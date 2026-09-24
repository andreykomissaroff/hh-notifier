// Точка входа: cron-прогон + HTTP-роутер (/run /test /diag /setup) + Telegram webhook
// (команды /run /test /stats /help, ссылки на вакансии, нажатия кнопок 👍/👎).

import { loadState, saveState, loadProfile, pruneFeedbackData } from './state.js';
import { runNotifier } from './notifier.js';
import { fetchVacancyText } from './enrich.js';
import { extractWordsFromVacancy } from './scoring.js';
import { handleFeedback, formatStats } from './learn.js';
import { onboardingText, handleResume, confirmProfile, hasProfile } from './onboard.js';
import { sendTelegramTo, splitText } from './telegram.js';
import { sleep } from './util.js';

export default {
  // запуск по расписанию (cron в wrangler.toml)
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runNotifier(env).catch((e) => console.error('FATAL: ' + e.message)));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ручной прогон: /run; тест канала: /test
    if (url.pathname === '/run') {
      await runNotifier(env);
      return new Response('OK: прогон выполнен (лог — dashboard Logs или wrangler tail)');
    }
    if (url.pathname === '/test') {
      await sendTelegramTo(env, env.TELEGRAM_CHAT_ID, ['✅ Тест доставки: hh-notifier работает из Cloudflare Workers. Новые вакансии будут приходить сюда.']);
      return new Response('OK: тестовое сообщение отправлено в Telegram');
    }

    // диагностика: /diag?key=СЕКРЕТ — webhook-info + состояние профиля
    if (url.pathname === '/diag' && env.TELEGRAM_WEBHOOK_SECRET && url.searchParams.get('key') === env.TELEGRAM_WEBHOOK_SECRET) {
      const [hookRes, profile, state] = await Promise.all([
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`).then((r) => r.json()),
        loadProfile(env),
        loadState(env),
      ]);
      const data = {
        webhook: hookRes.result,
        profile: profile ? { title: profile.title || '', roles: profile.roles?.length || 0, searches: profile.searches?.length || 0 } : null,
        state: { seen: Object.keys(state.seen).length, weights: Object.keys(state.wordWeights || {}).length, feedback: Object.keys(state.feedback || {}).length },
      };
      return new Response(JSON.stringify(data, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // подключение webhook (защищено тем же секретом): /setup?key=СЕКРЕТ
    if (url.pathname === '/setup' && env.TELEGRAM_WEBHOOK_SECRET && url.searchParams.get('key') === env.TELEGRAM_WEBHOOK_SECRET) {
      const hookUrl = url.origin + '/tg/' + env.TELEGRAM_WEBHOOK_SECRET;
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: hookUrl, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: data.ok ? 200 : 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Telegram webhook: команды из чата, ссылки на вакансии, нажатия кнопок 👍/👎
    if (env.TELEGRAM_WEBHOOK_SECRET && url.pathname === '/tg/' + env.TELEGRAM_WEBHOOK_SECRET) {
      let update;
      try { update = await request.json(); } catch { return new Response('bad json', { status: 400 }); }

      // нажатие inline-кнопок реакции
      if (update.callback_query) {
        const cq = update.callback_query;
        console.log('callback_query: ' + cq.data + ' от чата ' + cq.message?.chat?.id);
        if (String(cq.message?.chat?.id) === String(env.TELEGRAM_CHAT_ID)) {
          await handleFeedback(env, cq);
        }
        return new Response('OK');
      }

      const msg = update.message;
      // команды принимает только ваш чат
      if (msg && (msg.text || msg.document) && String(msg.chat.id) === String(env.TELEGRAM_CHAT_ID)) {
        const text = (msg.text || '').trim();
        const cmd = msg.text ? text.toLowerCase().split('@')[0].split(/\s+/)[0] : '';

        // файл .txt с резюме (caption команды /resume)
        if (msg.document && /\.txt$/i.test(msg.document.file_name || '') && /^\/resume/.test((msg.caption || '').toLowerCase())) {
          ctx.waitUntil(handleResumeFile(env, msg.chat.id, msg.document.file_id).catch(() => {}));
          return new Response('OK');
        }

        if (cmd === '/resume' || !msg.text) {
          const resumeText = text.replace(/^\/resume\s*/i, '');
          if (resumeText.length < 200) {
            ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ['Пришлите текст резюме после команды /resume (или файлом .txt с подписью /resume). Нужно хотя бы разделы «Желаемая должность», «Опыт» и «Навыки».']).catch(() => {}));
          } else {
            ctx.waitUntil(handleResume(env, msg.chat.id, resumeText).catch((e) => sendTelegramTo(env, msg.chat.id, ['⚠️ ' + e.message]).catch(() => {})));
          }
        } else if (cmd === '/confirm-profile') {
          ctx.waitUntil(confirmProfile(env, msg.chat.id).catch(() => {}));
        } else if (cmd === '/run') {
          // синхронно: waitUntil убивает прогон на ~30-й секунде; Telegram-вебхук ждёт до 60 с
          await handleRunCommand(env, msg.chat.id);
        } else if (cmd === '/test') {
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ['✅ Тест доставки: связь воркер → Telegram работает.']).catch(() => {}));
        } else if (cmd === '/stats') {
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, [await formatStats(env)]).catch(() => {}));
        } else if (cmd === '/help' || cmd === '/start') {
          const onboarded = await hasProfile(env);
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, onboarded ? helpText() : [helpText(), '', onboardingText()].join('\n\n')).catch(() => {}));
        } else {
          // не команда: если в тексте есть ссылки на вакансии — выдать их описания
          const ids = [...new Set((msg.text.match(/hh\.ru\/vacancy\/(\d+)/gi) || [])
            .map((s) => s.match(/(\d+)$/)[1]))];
          if (ids.length) {
            await handleVacancyLookup(env, msg.chat.id, ids);
          } else {
            ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ['Не знаю такую команду. Доступно: /run, /test, /stats, /help. Можно прислать ссылку на вакансию hh.ru — пришлю описание.']).catch(() => {}));
          }
        }
      }
      // Telegram ждёт быстрый 200; длительная работа завершается до ответа (в ветке /run) или в фоне
      return new Response('OK');
    }

    return new Response('hh-notifier worker. GET /run — прогон, GET /test — проверка Telegram.');
  },
};

function helpText() {
  return [
    'Команды hh-notifier:',
    '/run — проверить hh.ru прямо сейчас (пришлю вакансии, если появились новые)',
    '/test — проверить доставку сообщений',
    '/stats — статистика ваших реакций и обучения фильтра',
    '/resume <текст или файл .txt> — извлечь профиль из резюме и сгенерировать поиск заново',
    '/confirm-profile — сохранить черновик профиля',
    '/help — эта справка',
    '',
    'Под каждым сообщением вакансии — кнопки 👍/👎: высоко/низко релевантная. 👎 учит фильтр скрывать похожие (консервативно), отсутствие реакции — нейтрально.',
    'Пришлите ссылку на вакансию hh.ru (можно с любым «хвостом» после цифр или переслать шаринг) — пришлю очищенное описание; такая вакансия помечается обработанной и в дайджест больше не попадает.',
  ].join('\n');
}

// скачивание файла .txt из Telegram и извлечение профиля
async function handleResumeFile(env, chatId, fileId) {
  try {
    const meta = await (await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`)).json();
    if (!meta.ok) throw new Error('не удалось получить файл: ' + (meta.description || ''));
    const content = await (await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${meta.result.file_path}`)).text();
    await handleResume(env, chatId, content);
  } catch (e) {
    await sendTelegramTo(env, chatId, ['⚠️ ' + e.message]).catch(() => {});
  }
}

// фоновое выполнение /run из чата: подтверждение -> прогон -> отчёт
async function handleRunCommand(env, chatId) {
  try {
    await sendTelegramTo(env, chatId, ['⏳ Запускаю проверку hh.ru...']);
    const result = await runNotifier(env);
    if (result.sent > 0) {
      await sendTelegramTo(env, chatId, [`✅ Готово: найдено новых — ${result.fresh}, отправлено.`]);
    } else if (result.fresh === 0) {
      await sendTelegramTo(env, chatId, ['✅ Готово: новых вакансий нет.']);
    }
  } catch (e) {
    await sendTelegramTo(env, chatId, ['⚠️ Ошибка прогона: ' + e.message]).catch(() => {});
  }
}

// присланные ссылки: ссылка -> очищенное описание; вакансия помечается отработанной
// (state.seen), пополняет словарь слов и в дайджест больше не попадает
async function handleVacancyLookup(env, chatId, ids) {
  const state = await loadState(env);
  const nowStamp = new Date().toISOString();
  for (const id of ids) {
    // помечаем отработанной сразу: сам факт «показал ссылкой» = обработано,
    // даже если описание получить не удалось
    state.seen[id] = nowStamp;
    try {
      const text = await fetchVacancyText(id, state, true);
      const title = (text.match(/📌\s*(.+)/) || [, ''])[1].trim();
      state.vacWords[id] = { w: extractWordsFromVacancy(title, text), s: 'ссылка', t: nowStamp };
      for (const part of splitText('https://hh.ru/vacancy/' + id + '\n\n' + text)) {
        await sendTelegramTo(env, chatId, [{ text: part, vacancyId: id }]);
      }
    } catch (e) {
      await sendTelegramTo(env, chatId, ['Не удалось получить вакансию: ' + e.message]).catch(() => {});
    }
    await sleep(800);
  }
  pruneFeedbackData(state);
  await saveState(env, state);
}
