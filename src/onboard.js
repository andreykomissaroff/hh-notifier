// Онбординг: ИИ-извлечение профиля из резюме (Workers AI), черновик и подтверждение.
// Фолбэк при сбое ИИ — заполнение профиля по шаблону вручную (см. README, /edit-profile в планах).

import { normalizeProfile, generateSearches, isProfileComplete } from './profile.js';
import { loadProfile, saveProfile, loadState, saveState } from './state.js';
import { sendTelegramTo } from './telegram.js';

const DRAFT_KEY = 'profile_draft';

const PROMPT = (resumeText) => `Ты — карьерный ассистент. Проанализируй резюме и верни ТОЛЬКО валидный JSON без пояснений, в формате:
{"title": "желаемая роль кратко", "roles": ["1-4 корня слов названия роли, например: ит-директор, cio, руководитель-разработки"], "tech": ["до 20 корней слов технологий и практик, например: 1с, java, postgres, itil"], "domains": ["до 10 корней слов отраслей и областей учёта, например: финанс, банк, логистик"], "stopWords": ["слова, вакансии с которыми точно не нужны"], "preferredArea": "id города hh.ru (1 = Москва) или пусто"}
Корень слова — без окончаний, чтобы ловить все падежи (например «интеграц» ловит интеграция/интеграции/интеграционных). Латиницу и кириллицу сохраняй как в резюме. Резюме:
${resumeText}`;

// вызов Workers AI (binding AI), извлечение и нормализация профиля
export async function extractProfileFromResume(env, resumeText) {
  const clipped = resumeText.slice(0, 12000);
  const out = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
    messages: [{ role: 'user', content: PROMPT(clipped) }],
    max_tokens: 1200,
  });
  const text = out.response || out.result?.response || '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('ИИ не вернул JSON');
  const profile = normalizeProfile(JSON.parse(m[0]));
  if (!isProfileComplete(profile)) throw new Error('ИИ не нашёл роль или технологии в резюме');
  profile.searches = generateSearches(profile) || [];
  return profile;
}

// приём резюме: текст команды или файл .txt; создаёт черновик и показывает его пользователю
export async function handleResume(env, chatId, text) {
  let draft;
  try {
    draft = await extractProfileFromResume(env, text);
  } catch (e) {
    await sendTelegramTo(env, chatId, [
      '⚠️ Не удалось автоматически извлечь профиль: ' + e.message +
      '\n\nПопробуйте ещё раз (/resume + текст резюме) или пришлите профиль вручную в формате:\n' +
      'роль: CIO, ИТ-директор\nтехнологии: 1с, java, postgres\nдомены: финанс, банк\nгород: Москва',
    ]);
    return;
  }
  await env.STATE.put(DRAFT_KEY, JSON.stringify(draft));
  await sendTelegramTo(env, chatId, [
    'Профиль из резюме (черновик):\n' +
    `• Роль: ${draft.title || '—'}\n` +
    `• Роли (${draft.roles.length}): ${draft.roles.join(', ') || '—'}\n` +
    `• Технологии (${draft.tech.length}): ${draft.tech.join(', ') || '—'}\n` +
    `• Домены (${draft.domains.length}): ${draft.domains.join(', ') || '—'}\n` +
    `• Город: ${draft.preferredArea === '1' ? 'Москва' : draft.preferredArea || 'вся Россия'}\n\n` +
    'Поисковые запросы, которые сгенерированы:\n' +
    draft.searches.map((s) => `• ${s.name}${s.area ? '' : ' (вся Россия)'}`).join('\n') +
    '\n\n/confirm-profile — сохранить и начать поиск\n/regenerate — извлечь заново',
  ]);
}

export async function confirmProfile(env, chatId) {
  const raw = await env.STATE.get(DRAFT_KEY, 'json');
  if (!raw) {
    await sendTelegramTo(env, chatId, ['Черновик профиля не найден. Пришлите резюме: /resume + текст.']);
    return;
  }
  await saveProfile(env, raw);
  await env.STATE.delete(DRAFT_KEY);
  await sendTelegramTo(env, chatId, [
    '✅ Профиль сохранён. Дайджесты пойдут по расписанию (каждый час 07:00–21:00 МСК) под вашу роль.',
    '/run — сделать первый прогон прямо сейчас. Реагируйте 👍/👎 под вакансиями — фильтр будет обучаться.',
  ]);
}

// наличие сохранённого профиля (для /start)
export async function hasProfile(env) {
  const p = await loadProfile(env);
  return !!(p && p.roles);
}

export function onboardingText() {
  return [
    '👋 Это персональный бот поиска вакансий на hh.ru.',
    'Чтобы он искал работу под вас, нужен ваш профиль — он извлекается из резюме.',
    '',
    'Пришлите текст резюме: скопируйте его из hh.ru («Отклики и резюме» → ваш профиль → редактировать → выделить всё) и отправьте сообщением или файлом .txt. Можно частями — берите разделы «Желаемая должность», «Опыт», «Навыки».',
    '',
    'Затем бот с помощью ИИ соберёт профиль (роль, технологии, домены) и сгенерирует поисковые запросы. После /confirm-profile начнут приходить персональные дайджесты.',
  ].join('\n');
}
