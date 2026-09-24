// Реакционное обучение: кнопки 👍/👎 с тремя состояниями (высокая/нейтральная/низкая),
// сдвиг весов слов на разницу состояний, команда /stats.

import { CONFIG } from './config.js';
import { loadState, saveState, pruneFeedbackData } from './state.js';
import { sendTelegramTo, answerCallbackQuery, markReactionOnMessage } from './telegram.js';

// нажатие 👍/👎: другая реакция заменяет предыдущую, повтор той же — снимает её.
// Веса слов сдвигаются на разницу состояний (например, 👍 -> 👎 = -2).
export async function handleFeedback(env, cq) {
  try {
    const dir = cq.data.startsWith('fb:up:') ? 1 : cq.data.startsWith('fb:down:') ? -1 : 0;
    const id = cq.data.split(':')[2];
    if (!dir || !id) { await answerCallbackQuery(env, cq.id, 'Не распознано'); return; }
    const state = await loadState(env);
    const entry = (state.vacWords || {})[id];
    const prev = (state.feedback || {})[id]?.v || 0;
    const next = prev === dir ? 0 : dir; // повтор — снять реакцию
    const delta = next - prev;

    const words = entry ? entry.w : [];
    state.wordWeights = state.wordWeights || {};
    for (const w of words) {
      state.wordWeights[w] = Math.max(-CONFIG.wordWeightCap, Math.min(CONFIG.wordWeightCap, (state.wordWeights[w] || 0) + delta));
    }

    state.feedback = state.feedback || {};
    state.feedback[id] = { v: next, t: new Date().toISOString(), s: entry ? entry.s : '' };
    pruneFeedbackData(state);
    await saveState(env, state);

    const answers = {
      '1': 'Учтено: вакансия высокой релевантности (👍)',
      '0': 'Учтено: реакция снята — вакансия нейтральная',
      '-1': 'Учтено: вакансия низкой релевантности (👎)',
    };
    await answerCallbackQuery(env, cq.id, answers[String(next)]);
    // видимость: галочка на кнопке текущего состояния
    await markReactionOnMessage(env, cq.message.chat.id, cq.message.message_id, id, next);
  } catch (e) {
    console.error('feedback error: ' + e.message);
  }
}

export async function formatStats(env) {
  const state = await loadState(env);
  const L = ['📊 Реакции и обучение фильтра:'];
  const fbList = Object.values(state.feedback || {});
  const high = fbList.filter((f) => f.v === 1).length;
  const low = fbList.filter((f) => f.v === -1).length;
  L.push(`Оценено вакансий: ${fbList.length} — высокая ${high}, низкая ${low}, нейтральная ${fbList.length - high - low}`);
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
  for (const f of fbList) {
    if (f.v === -1 && f.s) downBySearch[f.s] = (downBySearch[f.s] || 0) + 1;
  }
  const worst = Object.entries(downBySearch).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (worst.length) L.push('\nБольше всего 👎 по запросам: ' + worst.map(([s, n]) => `${s} (${n})`).join(', '));
  return L.join('\n');
}
