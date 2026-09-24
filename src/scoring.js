// Скоринг релевантности: лексика вакансии + профиль кандидата (из резюме) + реакционное обучение.
// Порядок вкладов: профильный бонус положительный, веса слов из 👍/👎 — с обучением по тексту.

import { CONFIG } from './config.js';
import { uniq } from './util.js';

// служебные слова, не участвующие в оценке релевантности
const FEEDBACK_STOP_EXACT = new Set([
  'полный', 'день', 'неполный', 'опыт', 'уровень', 'город', 'месяц', 'руб', 'usd', 'eur',
  'зарплата', 'формат', 'оригинал', 'описание', 'навыки', 'ключевые', 'график', 'работа',
  'вакансия', 'требования', 'обязанности', 'условия', 'занятость', 'сменный', 'гибкий',
  'удаленно', 'удалённо', 'гибрид', 'на', 'руки', 'вычета', 'года', 'лет', 'банк',
  // типовой шум тел описаний вакансий
  'знание', 'знания', 'знанием', 'будет', 'команд', 'команде', 'задач', 'задачи',
  'проект', 'проекта', 'проектов', 'требуется', 'требуются', 'приветствуется',
  'понимание', 'развитие', 'развития', 'результат', 'результатов', 'клиент',
  'клиентов', 'клиентам', 'более', 'менее', 'оформление', 'оплата', 'испытательный',
  'срок', 'резюме', 'отклик', 'отклику', 'вакансии', 'вакансию', 'работодатель',
]);

const FEEDBACK_STOP_PREFIXES = [
  'руковод', 'начальн', 'директор', 'заместит', 'помощник', 'ассистент', 'главный',
  'ведущий', 'старший', 'младший', 'компани', 'групп', 'отдел', 'управлен', 'специалист',
];

function isFeedbackStopWord(w) {
  if (FEEDBACK_STOP_EXACT.has(w)) return true;
  return FEEDBACK_STOP_PREFIXES.some((p) => w.startsWith(p));
}

// короткие осмысленные аббревиатуры, которые не проходят фильтр длины
const ALLOWED_SHORT = new Set(['ai', 'ии', 'bi', 'hr', 'qa', 'crm', 'erp', 'bpm', 'it', 'ит', 'ml', 'api', 'sql', 'edi', 'rag', 'mcp', 'ocr', 'esb', 'цб']);

export function extractWords(text) {
  const out = new Set();
  const tokens = (text || '').toLowerCase().replace(/ё/g, 'е').match(/[a-zа-я0-9+.#-]{2,}/g) || [];
  for (const raw of tokens) {
    const w = raw.replace(/^[+\-#.]+|[+\-#.]+$/g, '');
    if (!w) continue;
    if (((w.length >= 4 || /\d/.test(w) || ALLOWED_SHORT.has(w)) && !isFeedbackStopWord(w))) out.add(w);
  }
  return [...out];
}

// слова из секции «Ключевые навыки:» очищенного описания
export function extractSkillsWords(details) {
  const m = (details || '').match(/Ключевые навыки:\n([\s\S]*?)(\n\n|$)/);
  return m ? extractWords(m[1]) : [];
}

export function extractWordsFromVacancy(title, details) {
  return uniq([...extractWords(title), ...extractSkillsWords(details)]);
}

// профиль кандидата: сопоставление слов вакансии с корнями из профиля
export function profileScore(words, profile) {
  const p = profile || CONFIG.profile;
  const matched = { roles: [], tech: [], domains: [] };
  for (const w of words) {
    if (p.roles.some((r) => w.startsWith(r))) { matched.roles.push(w); continue; }
    if (p.tech.some((r) => w.startsWith(r))) { matched.tech.push(w); continue; }
    if (p.domains.some((r) => w.startsWith(r))) { matched.domains.push(w); }
  }
  const bonus = matched.roles.length * 2 + matched.tech.length + matched.domains.length * 0.5;
  return { bonus, matched, protected: matched.roles.length > 0 || bonus >= 2.5 };
}

// текстовый скоринг кандидата: название и навыки ×1.0, тело описания ×0.5
// (тело — только слова с |весом| ≥ 2: одиночная реакция на текст «инертна» до подкрепления).
// Профильный бонус защищает от авто-скрытия: целевые вакансии не прячем никогда.
export function scoreVacancy(c, weights, profile) {
  const details = c.details || '';
  const titleWords = extractWords(c.title);
  const skillsWords = details ? extractSkillsWords(details) : [];
  const namedSet = new Set([...titleWords, ...skillsWords]);
  const bodyWords = details ? extractWords(details).filter((w) => !namedSet.has(w)) : [];
  const prof = profileScore([...titleWords, ...skillsWords, ...bodyWords], profile);
  c.profile = prof.matched;

  let sum = prof.bonus, counted = prof.matched.roles.length + prof.matched.tech.length + prof.matched.domains.length;
  for (const w of titleWords) {
    const wt = weights[w] || 0;
    if (wt !== 0) { sum += wt; counted++; }
  }
  for (const w of skillsWords) {
    const wt = weights[w] || 0;
    if (wt !== 0) { sum += wt; counted++; }
  }
  for (const w of bodyWords) {
    const wt = weights[w] || 0;
    if (Math.abs(wt) >= 2) { sum += wt * 0.5; counted++; }
  }

  if (!details) {
    const skip = !prof.protected && counted >= CONFIG.titleMinWeightedWords && sum <= CONFIG.negativeScoreToSkip;
    return { skip, sum, counted };
  }
  const skip = !prof.protected && counted >= CONFIG.minWeightedWords && sum <= CONFIG.negativeScoreToSkip;
  return { skip, sum, counted };
}
