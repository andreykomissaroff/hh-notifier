// Конвейер прогона: RSS-сбор кандидатов -> обогащение -> скоринг -> дайджест.
// Предохранители: алерты RSS и описаний (только на переходе «работало -> сломалось»).

import { CONFIG } from './config.js';
import { loadState, saveState, getActiveProfile, pruneSeen, pruneFeedbackData } from './state.js';
import { buildTasks, parseItems, matchesAny } from './feed.js';
import { enrichCandidates } from './enrich.js';
import { scoreVacancy, extractWordsFromVacancy } from './scoring.js';
import { sendTelegram, formatMessages } from './telegram.js';
import { sleep } from './util.js';

export async function runNotifier(env) {
  const state = await loadState(env);
  const profile = await getActiveProfile(env);
  const repliedSet = new Set(CONFIG.repliedIds);
  const cutoff = Date.now() - CONFIG.maxAgeHours * 3600 * 1000;
  const candidates = []; // прошли структурные фильтры; судьба решается по полному тексту
  const log = [];
  const rssFailures = [];

  // 1. сбор кандидатов из RSS
  for (const task of buildTasks(profile.searches)) {
    try {
      const res = await fetch(task.url, { headers: { 'User-Agent': CONFIG.userAgent } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const items = parseItems(await res.text());
      const st = { dup: 0, old: 0, excluded: 0, notLead: 0, cand: 0 };
      for (const it of items) {
        if (!it.id) continue;
        if (state.seen[it.id] || repliedSet.has(it.id)) { st.dup++; continue; }
        if (it.pub < cutoff) { st.old++; continue; }
        if (matchesAny(it.title, CONFIG.excludeKeywords)) { st.excluded++; continue; }
        if (task.isCompany && !matchesAny(it.title, CONFIG.leadershipKeywords)) { st.notLead++; continue; }
        candidates.push({ ...it, search: task.name });
        // кандидат будет скачан и оценён — помечаем обработанной независимо от исхода,
        // чтобы не перекачивать его при следующих прогонах
        state.seen[it.id] = new Date().toISOString();
        st.cand++;
      }
      log.push(`[${task.name}] загружено ${items.length}: уже показано ${st.dup}, устарело ${st.old}, отсеяно стоп-словом ${st.excluded}, не-руководящих ${st.notLead}, кандидатов ${st.cand}`);
    } catch (e) {
      log.push(`[${task.name}] ОШИБКА: ${e.message}`);
      rssFailures.push(`${task.name} (${e.message})`);
    }
    await sleep(1500); // вежливая пауза между запросами
  }

  // алерт при ошибках RSS: только на переходе «работало -> сломалось», чтобы не спамить каждый час
  const hadRssFailures = rssFailures.length > 0;
  if (hadRssFailures && !state.rssAlerted) {
    try {
      await sendTelegram(env, [
        '⚠️ hh-notifier: ошибки загрузки RSS:\n' + rssFailures.join('\n') +
        '\n\nЕсли ошибка повторяется (например 403), hh.ru мог ограничить доступ с адресов Cloudflare. Проверьте лог: /run или dashboard.',
      ]);
    } catch {}
  }
  state.rssAlerted = hadRssFailures;

  pruneSeen(state);

  // 2. обогащение описаниями (с кэшем отказа API и потолком на прогон)
  const allowApi = Date.parse(state.apiDisabledUntil || 0) < Date.now();
  const descFailures = await enrichCandidates(candidates, state, allowApi, log);

  // алерт при ошибках описаний: только на переходе «работало -> сломалось»
  const descAlert = descFailures >= 2;
  if (descAlert && !state.descAlerted) {
    try {
      await sendTelegram(env, ['⚠️ hh-notifier: не удалось получить описания ' + descFailures + ' вакансий — возможна капча/ограничения hh.ru. Проверьте /run или dashboard.']);
    } catch {}
  }
  state.descAlerted = descAlert;

  // 3. текстовый скоринг: скачали -> оценили -> решили
  const fresh = [];
  let hiddenByScore = 0;
  for (const c of candidates) {
    const scored = scoreVacancy(c, state.wordWeights || {}, profile);
    if (scored.skip) {
      hiddenByScore++;
      state.autoSkippedCount = (state.autoSkippedCount || 0) + 1;
      state.autoSkippedLog = [...(state.autoSkippedLog || []), { t: new Date().toISOString(), title: c.title, score: scored.sum }].slice(-5);
      continue;
    }
    fresh.push({ ...c });
  }

  // 4. словарь слов отправляемых вакансий для реакционного обучения (полный текст)
  const nowIso = new Date().toISOString();
  for (const v of fresh) {
    state.vacWords[v.id] = { w: extractWordsFromVacancy(v.title, v.details || ''), s: v.search, t: nowIso };
  }
  pruneFeedbackData(state);
  await saveState(env, state);

  log.push(`Скоринг: кандидатов ${candidates.length}, скрыто рейтингом ${hiddenByScore}, к отправке ${fresh.length}, сбоев описаний ${descFailures}`);
  console.log(log.join('\n'));

  if (fresh.length === 0) {
    console.log('Новых вакансий нет — сообщение не отправляется');
    return { fresh: 0, sent: 0 };
  }
  await sendTelegram(env, formatMessages(fresh));
  return { fresh: fresh.length, sent: fresh.length };
}
