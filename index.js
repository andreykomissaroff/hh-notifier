// hh-notifier — Cloudflare Worker: новые вакансии hh.ru -> Telegram (24/7, бесплатно).
// Версия 2 проекта. Версия 1 (PowerShell + SMTP/Яндекс, ПК) — C:\Users\Андрей\Documents\JobSearch\hh-notifier.
// Логика отбора повторяет версию 1 один в один:
//   поисковые запросы + компании-мониторы (employer_id) -> стоп-слова ->
//   leadership-фильтр (для компаний) -> свежесть <= maxAgeHours -> дедуп (KV + replied-список).

export default {
  // запуск по расписанию (cron в wrangler.toml; в dashboard — Triggers -> Cron Triggers)
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
      await sendTelegram(env, ['✅ Тест доставки: hh-notifier работает из Cloudflare Workers. Новые вакансии будут приходить сюда.']);
      return new Response('OK: тестовое сообщение отправлено в Telegram');
    }

    // Telegram webhook: команды из чата (/run, /test, /stats, /help), ссылки на вакансии, нажатия кнопок 👍/👎
    if (env.TELEGRAM_WEBHOOK_SECRET && url.pathname === '/tg/' + env.TELEGRAM_WEBHOOK_SECRET) {
      let update;
      try { update = await request.json(); } catch { return new Response('bad json', { status: 400 }); }

      // нажатие inline-кнопок реакции
      if (update.callback_query) {
        const cq = update.callback_query;
        if (String(cq.message?.chat?.id) === String(env.TELEGRAM_CHAT_ID)) {
          await handleFeedback(env, cq);
        }
        return new Response('OK');
      }

      const msg = update.message;
      // команды принимает только ваш чат
      if (msg && msg.text && String(msg.chat.id) === String(env.TELEGRAM_CHAT_ID)) {
        const cmd = msg.text.trim().toLowerCase().split('@')[0];
        if (cmd === '/run') {
          // синхронно: waitUntil убивает прогон на ~30-й секунде; Telegram-вебхук ждёт до 60 с
          await handleRunCommand(env, msg.chat.id);
        } else if (cmd === '/test') {
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ['✅ Тест доставки: связь воркер → Telegram работает.']).catch(() => {}));
        } else if (cmd === '/stats') {
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, [await formatStats(env)]).catch(() => {}));
        } else if (cmd === '/help' || cmd === '/start') {
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, [
            'Команды hh-notifier:',
            '/run — проверить hh.ru прямо сейчас (пришлю вакансии, если появились новые)',
            '/test — проверить доставку сообщений',
            '/stats — статистика ваших реакций и обучения фильтра',
            '/help — эта справка',
            '',
            'Под каждым сообщением вакансии — кнопки 👍/👎: высоко/низко релевантная. 👎 учит фильтр скрывать похожие (консервативно), отсутствие реакции — нейтрально.',
            'Пришлите ссылку на вакансию hh.ru (можно с любым «хвостом» после цифр или переслать шаринг) — пришлю очищенное описание; такая вакансия помечается обработанной и в дайджест больше не попадает.',
          ].join('\n')).catch(() => {}));
        } else {
          // не команда: если в тексте есть ссылки на вакансии — выдать их описания
          const ids = [...new Set((msg.text.match(/hh\.ru\/vacancy\/(\d+)/gi) || [])
            .map((s) => s.match(/(\d+)$/)[1]))];
          if (ids.length) {
            await handleVacancyLookup(env, msg.chat.id, ids);
          } else {
            ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ['Не знаю такую команду. Доступно: /run, /test, /help. Можно прислать ссылку на вакансию hh.ru — пришлю описание.']).catch(() => {}));
          }
        }
      }
      // Telegram ждёт быстрый 200; работа продолжается в фоне
      return new Response('OK');
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

    return new Response('hh-notifier worker. GET /run — прогон, GET /test — проверка Telegram.');
  },
};

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
      const text = await fetchVacancyText(id);
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
  await env.STATE.put('state', JSON.stringify(state));
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

const CONFIG = {
  maxAgeHours: 26,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) hh-notifier/2.0',
  // реакционное обучение: авто-скрытие вакансий с сильно негативным рейтингом слов названия
  negativeScoreToSkip: -2,
  minWeightedWords: 2,
  wordWeightCap: 5,

  // поисковые запросы: text ищется в названии вакансии (search_field=name), area: 1 = Москва
  searches: [
    { name: 'CIO', text: 'CIO', area: '1' },
    { name: 'ИТ-директор', text: 'ИТ-директор', area: '1' },
    { name: 'Директор по ИТ', text: 'директор информационных технологий', area: '1' },
    { name: 'Технический директор', text: 'технический директор', area: '1' },
    { name: 'ИТ-лидер', text: 'ИТ-лидер', area: '1' },
    { name: 'Руководитель ИТ', text: 'руководитель ИТ', area: '1' },
    { name: 'Руководитель разработки (РФ)', text: 'руководитель разработки', area: '' },
  ],

  // чисто ИТ-компании: мониторим все их вакансии; целевые — управленческие роли
  companies: [
    { name: 'X5 Tech', employerId: '9352463' },
    { name: 'SberTech', employerId: '906557' },
    { name: 'Северсталь IT & Digital', employerId: '6041' },
    { name: 'Wildberries & Russ', employerId: '87021' },
  ],

  // вакансии с этими словами в названии не присылаем
  excludeKeywords: ['продаж', 'закупк', 'ассистент', 'помощник', 'оператор', 'секретарь', 'финансовый директор', 'маркетинг', 'маркетолог', 'team lead', 'тимлид'],

  // для company-мониторов: название должно содержать одно из управленческих слов
  leadershipKeywords: ['руковод', 'начальник', 'директор', 'лидер', 'head', 'chief', 'cio', 'cto'],

  // вакансии, на которые уже откликнулись (версия 1, replied.json) — не присылать никогда
  repliedIds: [
    '136296820', '136328870', '136653076', '136963913', '137401302', '137413460',
    '136786078', '137221551', '137368511', '137362906', '137367385', '137174777',
    '137239828', '137169049', '137343839', '137349306', '137343096', '137320125',
    '136700980', '137307322', '137298658', '137289442', '137118054', '137143207',
    '136932897', '137272526', '136898219',
  ],
};

function buildUrl(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  sp.set('order_by', 'publication_time');
  return 'https://hh.ru/search/vacancy/rss?' + sp.toString();
}

function buildTasks() {
  const tasks = CONFIG.searches.map((s) => ({
    name: s.name,
    url: buildUrl({ text: s.text, area: s.area, search_field: 'name' }),
    isCompany: false,
  }));
  for (const c of CONFIG.companies) {
    tasks.push({
      name: 'Компания: ' + c.name,
      url: buildUrl({ employer_id: c.employerId }),
      isCompany: true,
    });
  }
  return tasks;
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const body = m[1];
    const get = (tag) => {
      const mm = body.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
      return mm ? mm[1] : '';
    };
    const title = decodeXml(get('title')).trim();
    const link = decodeXml(get('link')).trim();
    const guid = decodeXml(get('guid')).trim();
    const pub = Date.parse(decodeXml(get('pubDate')).trim()) || 0;
    const descHtml = decodeXml(get('description').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, ''));
    const pick = (re2) => { const mm = descHtml.match(re2); return mm ? mm[1].trim() : ''; };
    const idMatch = guid.match(/\/vacancy\/(\d+)/) || link.match(/\/vacancy\/(\d+)/);
    items.push({
      id: idMatch ? idMatch[1] : guid,
      title, link, pub,
      company: pick(/Вакансия компании:\s*([^<]+)/),
      region: pick(/Регион:\s*([^<]+)/),
      salary: pick(/дохода:\s*([^<]+)/),
    });
  }
  return items;
}

function matchesAny(title, keywords) {
  const t = title.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- получение описания вакансии (порт из hh-vacancy-bot: bot-worker.js) ---
// 1) api.hh.ru/vacancies/{id} (доступен с адресов Cloudflare), 2) фолбэк — парсинг HTML-страницы.

async function fetchVacancyText(id) {
  let r = await fetch(`https://api.hh.ru/vacancies/${id}`, { headers: { 'User-Agent': CONFIG.userAgent } });
  if (r.ok) return formatApi(await r.json());
  if (r.status !== 404) {
    r = await fetch(`https://hh.ru/vacancy/${id}`, { headers: { 'User-Agent': CONFIG.userAgent, 'Accept-Language': 'ru' } });
    if (r.ok) return formatPage(await r.text(), id);
    if (r.status === 404) throw new Error('вакансия не найдена или удалена');
    throw new Error('hh.ru вернул ' + r.status);
  }
  throw new Error('вакансия не найдена или удалена');
}

function formatApi(v) {
  const L = [`📌 ${v.name || 'Без названия'}`];
  if (v.employer?.name) L.push(`Компания: ${v.employer.name}`);
  if (v.address?.city || v.area?.name) L.push(`Город: ${v.address?.city || v.area.name}`);
  if (v.work_format?.name) L.push(`Формат: ${v.work_format.name}`);
  if (v.experience?.name) L.push(`Опыт: ${v.experience.name}`);
  const s = v.salary;
  if (s && (s.from || s.to)) {
    const parts = [];
    if (s.from) parts.push(`от ${s.from}`);
    if (s.to) parts.push(`до ${s.to}`);
    L.push(`Зарплата: ${parts.join(' ')} ${s.currency || ''}${s.gross ? ' (до вычета)' : ' (на руки)'}`);
  }
  const extra = [v.schedule?.name, v.employment?.name].filter(Boolean).join(', ');
  if (extra) L.push(`График: ${extra}`);
  skillsAndDesc(L, (v.key_skills || []).map((k) => k.name), v.description || '');
  return L.join('\n');
}

function formatPage(html, id) {
  const text = (re, group = 1) => {
    const m = html.match(re);
    return m ? stripTags(m[group]).trim() : null;
  };
  const ld = (() => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    try { return m ? JSON.parse(m[1]) : {}; } catch { return {}; }
  })();

  const title = text(/<h1[^>]*data-qa="vacancy-title"[^>]*>([\s\S]*?)<\/h1>/) || ld.title || 'Вакансия';
  const L = [`📌 ${title}`];
  const company = text(/data-qa="vacancy-company-name"[^>]*>([\s\S]*?)<\/a>/) || ld.hiringOrganization?.name;
  if (company) L.push(`Компания: ${stripTags(company).trim()}`);
  const city = ld.jobLocation?.address?.addressLocality;
  if (city) L.push(`Город: ${city}`);
  const exp = text(/data-qa="vacancy-experience"[^>]*>([\s\S]*?)<\/span>/);
  if (exp) L.push(`Опыт: ${exp}`);
  const salary = text(/data-qa="vacancy-salary"[^>]*>([\s\S]*?)<\/div>/);
  if (salary && !/не указан/.test(salary)) L.push(`Зарплата: ${salary}`);

  const skills = (() => {
    const m = html.match(/&#34;keySkills&#34;:\{&#34;keySkill&#34;:\[([\s\S]*?)\]/);
    if (!m) return [];
    return (m[1].replace(/&#34;/g, '"').replace(/&amp;/g, '&').match(/"[^"]+"/g) || [])
      .map((s) => s.slice(1, -1));
  })();
  skillsAndDesc(L, skills, ld.description || '');
  return L.join('\n');
}

function skillsAndDesc(L, skills, descHtml) {
  if (skills.length) L.push('\nКлючевые навыки:\n' + skills.map((s) => '• ' + s).join('\n'));
  const d = cleanHtml(descHtml);
  if (d) L.push(`\nОписание:\n${d}`);
}

function cleanHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(s) {
  return cleanHtml(s);
}

// разбиение длинного текста на сообщения (лимит Telegram 4096, держим запас)
function splitText(text, limit = 3800) {
  if (text.length <= limit) return [text];
  const parts = [];
  let cur = '';
  for (const para of text.split('\n')) {
    let p = para;
    while (p.length > limit) { parts.push(p.slice(0, limit)); p = p.slice(limit); }
    if (cur.length + p.length + 1 > limit) { parts.push(cur); cur = p; }
    else cur = cur ? cur + '\n' + p : p;
  }
  if (cur) parts.push(cur);
  return parts;
}

// --- реакционное обучение: слова, веса, кнопки 👍/👎 ---

async function loadState(env) {
  let state = await env.STATE.get('state', 'json');
  if (!state || !state.seen) state = { seen: {} };
  return state;
}

// служебные слова, не участвующие в оценке релевантности
const FEEDBACK_STOP_EXACT = new Set([
  'полный', 'день', 'неполный', 'опыт', 'уровень', 'город', 'месяц', 'руб', 'usd', 'eur',
  'зарплата', 'формат', 'оригинал', 'описание', 'навыки', 'ключевые', 'график', 'работа',
  'вакансия', 'требования', 'обязанности', 'условия', 'занятость', 'сменный', 'гибкий',
  'удаленно', 'удалённо', 'гибрид', 'на', 'руки', 'вычета', 'года', 'лет', 'банк',
]);
const FEEDBACK_STOP_PREFIXES = [
  'руковод', 'начальн', 'директор', 'заместит', 'помощник', 'ассистент', 'главный',
  'ведущий', 'старший', 'младший', 'компани', 'групп', 'отдел', 'управлен', 'специалист',
];

function isFeedbackStopWord(w) {
  if (FEEDBACK_STOP_EXACT.has(w)) return true;
  return FEEDBACK_STOP_PREFIXES.some((p) => w.startsWith(p));
}

function extractWords(text) {
  const out = new Set();
  const tokens = (text || '').toLowerCase().match(/[a-zа-яё0-9+.#-]{2,}/g) || [];
  for (const raw of tokens) {
    const w = raw.replace(/^[+\-#.]+|[+\-#.]+$/g, '');
    if (!w) continue;
    if ((w.length >= 4 || /\d/.test(w)) && !isFeedbackStopWord(w)) out.add(w);
  }
  return [...out];
}

// слова из секции «Ключевые навыки:» очищенного описания
function extractSkillsWords(details) {
  const m = (details || '').match(/Ключевые навыки:\n([\s\S]*?)(\n\n|$)/);
  return m ? extractWords(m[1]) : [];
}

function extractWordsFromVacancy(title, details) {
  return uniq([...extractWords(title), ...extractSkillsWords(details)]);
}

function uniq(arr) {
  return [...new Set(arr)];
}

// рейтинг названия по накопленным весам слов
function titleScore(title, weights) {
  let sum = 0, counted = 0;
  const words = extractWords(title);
  for (const w of words) {
    const wt = weights[w] || 0;
    if (wt !== 0) { sum += wt; counted++; }
  }
  return { sum, counted, words };
}

function feedbackKeyboard(id) {
  return { inline_keyboard: [[
    { text: '👍', callback_data: 'fb:up:' + id },
    { text: '👎', callback_data: 'fb:down:' + id },
  ]] };
}

// нажатие 👍/👎: сдвиг весов слов вакансии, счётчики, ротация
async function handleFeedback(env, cq) {
  try {
    const dir = cq.data.startsWith('fb:up:') ? 1 : cq.data.startsWith('fb:down:') ? -1 : 0;
    const id = cq.data.split(':')[2];
    if (!dir || !id) { await answerCallbackQuery(env, cq.id, 'Не распознано'); return; }
    const state = await loadState(env);
    state.fbCounts = state.fbCounts || { up: 0, down: 0 };
    state.fbCounts[dir > 0 ? 'up' : 'down']++;
    const entry = (state.vacWords || {})[id];
    const words = entry ? entry.w : [];
    state.wordWeights = state.wordWeights || {};
    for (const w of words) {
      const next = Math.max(-CONFIG.wordWeightCap, Math.min(CONFIG.wordWeightCap, (state.wordWeights[w] || 0) + dir));
      state.wordWeights[w] = next;
    }
    state.feedback = state.feedback || {};
    state.feedback[id] = { v: dir, t: new Date().toISOString(), s: entry ? entry.s : '' };
    pruneFeedbackData(state);
    await env.STATE.put('state', JSON.stringify(state));
    await answerCallbackQuery(env, cq.id, dir > 0 ? 'Учтено: 👍 высоко релевантная' : 'Учтено: 👎 похожие буду скрывать');
  } catch (e) {
    console.error('feedback error: ' + e.message);
  }
}

async function answerCallbackQuery(env, callbackId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, text }),
    });
  } catch {}
}

// ротация данных обратной связи (45 дней) и ограничение роста словаря весов
function pruneFeedbackData(state) {
  const cutoff = Date.now() - 45 * 86400 * 1000;
  for (const coll of ['feedback', 'vacWords']) {
    const obj = state[coll];
    if (!obj) continue;
    for (const k of Object.keys(obj)) {
      if (!obj[k] || Date.parse(obj[k].t || 0) < cutoff) delete obj[k];
    }
  }
  const ww = state.wordWeights;
  if (ww && Object.keys(ww).length > 1200) {
    for (const k of Object.keys(ww)) {
      if (Object.keys(ww).length <= 1200) break;
      if (Math.abs(ww[k]) <= 1) delete ww[k];
    }
  }
}

async function formatStats(env) {
  const state = await loadState(env);
  const L = ['📊 Реакции и обучение фильтра:'];
  const fb = state.fbCounts || { up: 0, down: 0 };
  L.push(`Голоса: 👍 ${fb.up} · 👎 ${fb.down}`);
  const entries = Object.entries(state.wordWeights || {});
  const neg = entries.filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]).slice(0, 10);
  const pos = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (neg.length) L.push('\nТоп негативных слов:\n' + neg.map(([w, v]) => `• ${w} (${v})`).join('\n'));
  if (pos.length) L.push('\nТоп позитивных слов:\n' + pos.map(([w, v]) => `• ${w} (+${v})`).join('\n'));
  if (!neg.length && !pos.length) L.push('\nПока нет реакций — поставьте 👍/👎 под вакансиями из дайджеста.');
  L.push(`\nАвто-скрыто по негативному рейтингу: ${state.autoSkippedCount || 0}`);
  if (state.autoSkippedLog && state.autoSkippedLog.length) {
    L.push('Последние скрытые:\n' + state.autoSkippedLog.map((x) => `• ${x.title} (${x.score})`).join('\n'));
  }
  const downBySearch = {};
  for (const f of Object.values(state.feedback || {})) {
    if (f.v === -1 && f.s) downBySearch[f.s] = (downBySearch[f.s] || 0) + 1;
  }
  const worst = Object.entries(downBySearch).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (worst.length) L.push('\nБольше всего 👎 по запросам: ' + worst.map(([s, n]) => `${s} (${n})`).join(', '));
  return L.join('\n');
}

async function runNotifier(env) {
  const state = await loadState(env);
  const repliedSet = new Set(CONFIG.repliedIds);
  const cutoff = Date.now() - CONFIG.maxAgeHours * 3600 * 1000;
  const fresh = [];
  const log = [];
  const rssFailures = [];

  for (const task of buildTasks()) {
    try {
      const res = await fetch(task.url, { headers: { 'User-Agent': CONFIG.userAgent } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const items = parseItems(await res.text());
      const st = { dup: 0, old: 0, excluded: 0, notLead: 0, byScore: 0, fresh: 0 };
      for (const it of items) {
        if (!it.id) continue;
        if (state.seen[it.id] || repliedSet.has(it.id)) { st.dup++; continue; }
        if (it.pub < cutoff) { st.old++; continue; }
        if (matchesAny(it.title, CONFIG.excludeKeywords)) { st.excluded++; continue; }
        if (task.isCompany && !matchesAny(it.title, CONFIG.leadershipKeywords)) { st.notLead++; continue; }
        // реакционное обучение: консервативное авто-скрытие явно нерелевантных
        const score = titleScore(it.title, state.wordWeights || {});
        if (score.counted >= CONFIG.minWeightedWords && score.sum <= CONFIG.negativeScoreToSkip) {
          st.byScore++;
          state.autoSkippedCount = (state.autoSkippedCount || 0) + 1;
          state.autoSkippedLog = [...(state.autoSkippedLog || []), { t: new Date().toISOString(), title: it.title, score: score.sum }].slice(-5);
          continue;
        }
        fresh.push({ ...it, search: task.name, words: score.words });
        state.seen[it.id] = new Date().toISOString();
        st.fresh++;
      }
      log.push(`[${task.name}] загружено ${items.length}: уже показано ${st.dup}, устарело ${st.old}, отсеяно стоп-словом ${st.excluded}, не-руководящих ${st.notLead}, рейтингом ${st.byScore}, новых ${st.fresh}`);
    } catch (e) {
      log.push(`[${task.name}] ОШИБКА: ${e.message}`);
      rssFailures.push(`${task.name} (${e.message})`);
    }
    await sleep(1500); // вежливая пауза между запросами
  }

  // алерт при ошибках RSS: только на переходе «работало -> сломалось», чтобы не спамить каждый час
  const hadFailures = rssFailures.length > 0;
  if (hadFailures && !state.rssAlerted) {
    try {
      await sendTelegram(env, [
        '⚠️ hh-notifier: ошибки загрузки RSS:\n' + rssFailures.join('\n') +
        '\n\nЕсли ошибка повторяется (например 403), hh.ru мог ограничить доступ с адресов Cloudflare. Проверьте лог: /run или dashboard.',
      ]);
    } catch {}
  }
  state.rssAlerted = hadFailures;

  // ротация state: держим записи за последние 14 дней
  const stateCutoff = Date.now() - 14 * 86400 * 1000;
  for (const id of Object.keys(state.seen)) {
    if (Date.parse(state.seen[id]) < stateCutoff) delete state.seen[id];
  }
  await env.STATE.put('state', JSON.stringify(state));
  console.log(log.join('\n'));

  if (fresh.length === 0) {
    console.log('Новых вакансий нет — сообщение не отправляется');
    return { fresh: 0, sent: 0 };
  }

  // обогащение: описание каждой вакансии (api.hh.ru -> HTML-фолбэк), пауза между запросами
  for (const v of fresh) {
    try {
      v.details = await fetchVacancyText(v.id);
    } catch (e) {
      console.log(`[{${v.id}}] описание недоступно: ${e.message}`);
      v.details = '';
    }
    await sleep(800);
  }

  // словарь слов вакансий для реакционного обучения (название + ключевые навыки)
  const nowIso = new Date().toISOString();
  for (const v of fresh) {
    state.vacWords[v.id] = { w: uniq([...(v.words || []), ...extractSkillsWords(v.details)]), s: v.search, t: nowIso };
  }
  pruneFeedbackData(state);
  await env.STATE.put('state', JSON.stringify(state));

  await sendTelegram(env, formatMessages(fresh));
  return { fresh: fresh.length, sent: fresh.length };
}

const fmtMSK = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

// каждое сообщение — ссылка + описание вакансии; первым идёт заголовок; вакансии — с кнопками 👍/👎
function formatMessages(fresh) {
  const header = `hh.ru: новых вакансий — ${fresh.length} (${fmtMSK.format(Date.now())})`;
  const sorted = fresh.sort((a, b) => a.search.localeCompare(b.search));
  const msgs = [{ text: header }];
  for (const v of sorted) {
    const text = v.details ? v.link + '\n\n' + v.details : v.link;
    for (const part of splitText(text)) msgs.push({ text: part, vacancyId: v.id });
  }
  return msgs;
}

async function sendTelegram(env, texts) {
  const chatId = Number(env.TELEGRAM_CHAT_ID);
  for (let i = 0; i < texts.length; i++) {
    if (i > 0) await sleep(400); // лимит Telegram ~1 сообщение/сек на чат
    const t = typeof texts[i] === 'string' ? { text: texts[i] } : texts[i];
    const body = { chat_id: chatId, text: t.text, disable_web_page_preview: true };
    if (t.vacancyId) body.reply_markup = feedbackKeyboard(t.vacancyId);
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error('Telegram API: ' + (data.description || res.status));
  }
  console.log(`Telegram: отправлено сообщений — ${texts.length}`);
}

// отправка в указанный чат (ответы на команды и присланные ссылки); строка или {text, vacancyId}
async function sendTelegramTo(env, chatId, texts) {
  for (let i = 0; i < texts.length; i++) {
    if (i > 0) await sleep(400);
    const t = typeof texts[i] === 'string' ? { text: texts[i] } : texts[i];
    const body = { chat_id: chatId, text: t.text, disable_web_page_preview: true };
    if (t.vacancyId) body.reply_markup = feedbackKeyboard(t.vacancyId);
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error('Telegram API: ' + (data.description || res.status));
  }
}
