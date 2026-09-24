// Хранилище (KV): состояние дайджеста, данные реакционного обучения, профиль.
// Все записи живут в одном ключе state (структура описана в README) + отдельный ключ profile.

import { CONFIG } from './config.js';

const STATE_KEY = 'state';
const PROFILE_KEY = 'profile';

export async function loadState(env) {
  let state = await env.STATE.get(STATE_KEY, 'json');
  if (!state || !state.seen) state = { seen: {} };
  state.vacWords = state.vacWords || {};
  state.wordWeights = state.wordWeights || {};
  state.feedback = state.feedback || {};
  return state;
}

export async function saveState(env, state) {
  await env.STATE.put(STATE_KEY, JSON.stringify(state));
}

// профиль: отдельный ключ, чтобы онбординг менял его независимо от состояния прогона
export async function loadProfile(env) {
  return await env.STATE.get(PROFILE_KEY, 'json');
}

export async function saveProfile(env, profile) {
  await env.STATE.put(PROFILE_KEY, JSON.stringify(profile));
}

// активный профиль: из KV, при отсутствии — дефолт из config
export async function getActiveProfile(env) {
  const p = await loadProfile(env);
  return p && p.roles ? p : CONFIG.profile;
}

// ротация данных обратной связи (45 дней) и ограничение роста словаря весов
export function pruneFeedbackData(state) {
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

// ротация памяти дедупликации: держим записи за последние 14 дней
export function pruneSeen(state) {
  const cutoff = Date.now() - 14 * 86400 * 1000;
  for (const id of Object.keys(state.seen)) {
    if (Date.parse(state.seen[id]) < cutoff) delete state.seen[id];
  }
}
