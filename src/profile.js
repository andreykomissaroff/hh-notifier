// Модель профиля кандидата: нормализация словарей, валидация, генерация поисковых запросов.
// Профиль приходит из онбординга (/resume -> Workers AI) или правится вручную (/edit-profile).

import { uniq } from './util.js';

const norm = (s) => (s || '').toLowerCase().replace(/ё/g, 'е').trim();

// строгая нормализация: только корни слов, без пустых и дублей
export function normalizeProfile(raw) {
  const pick = (arr) => uniq((Array.isArray(arr) ? arr : [])
    .map((x) => norm(x).replace(/[^a-zа-я0-9+# -]/g, '').replace(/\s+/g, ''))
    .filter((x) => x.length >= 2)).slice(0, 60);
  return {
    roles: pick(raw?.roles),
    tech: pick(raw?.tech),
    domains: pick(raw?.domains),
    stopWords: uniq((Array.isArray(raw?.stopWords) ? raw.stopWords : []).map(norm).filter(Boolean)).slice(0, 50),
    preferredArea: String(raw?.preferredArea || '').trim(),
    title: norm(raw?.title || ''),
    createdAt: new Date().toISOString(),
  };
}

export function isProfileComplete(profile) {
  return profile && (profile.roles?.length || profile.tech?.length);
}

// поисковые запросы из профиля: роль -> формулировки, технологии/домены -> дополнительно
export function generateSearches(profile) {
  if (!isProfileComplete(profile)) return null;
  const searches = [];
  const area = profile.preferredArea || '1';
  const push = (name, text, ar) => {
    if (text && !searches.some((s) => s.text === text)) searches.push({ name, text, area: ar });
  };

  for (const r of (profile.roles || []).slice(0, 4)) {
    const label = r.replace(/-/g, ' ');
    push('Роль: ' + label, r, area);          // точное корневое слово в названии вакансии
  }
  // роль, как часть более длинных названий («ведущий ИТ-лидер», «ИТ-директор направления»)
  const mainRole = (profile.roles || [])[0];
  if (mainRole) push('Руководитель направления', mainRole, area);
  for (const t of (profile.tech || []).slice(0, 2)) {
    const label = t.replace(/-/g, ' ');
    push('Технология: ' + label, t, area);
  }
  // широкая пара: главная роль без привязки к городу (удалёнка)
  if (mainRole) push('Роль (вся Россия)', mainRole, '');
  return searches.length ? searches : null;
}
