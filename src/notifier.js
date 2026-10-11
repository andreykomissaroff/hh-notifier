// Конвейер прогона: RSS-сбор кандидатов -> обогащение -> скоринг -> дайджест.
// Предохранители: алерты RSS и описаний (только на переходе «работало -> сломалось»).

import { CONFIG } from './config.js';
import { loadState, saveState, getActiveProfile, pruneSeen, pruneFeedbackData } from './state.js';
import { buildTasks, parseItems, matchesAny } from './feed.js';
import { enrichCandidates, fetchVacancyText } from './enrich.js';
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

  // история прогонов для /runs и /retry: сохраняем ДО отправки, чтобы прогон остался
  // в истории, даже если отправка умрёт посередине
  let runRecord = null;
  if (fresh.length > 0) {
    runRecord = {
      t: nowIso,
      sent: null,
      failed: null,
      items: fresh.map((v) => ({ id: v.id, title: v.title, link: v.link, details: v.details || '', search: v.search })),
    };
    state.runs = [runRecord, ...(state.runs || [])].slice(0, CONFIG.runHistoryLimit);
  }
  await saveState(env, state);

  log.push(`Скоринг: кандидатов ${candidates.length}, скрыто рейтингом ${hiddenByScore}, к отправке ${fresh.length}, сбоев описаний ${descFailures}`);
  console.log(log.join('\n'));

  if (fresh.length === 0) {
    console.log('Новых вакансий нет — сообщение не отправляется');
    await lateEnrichFollowUp(env, state, allowApi, new Set(), repliedSet);
    await saveState(env, state);
    return { fresh: 0, sent: 0, failed: 0 };
  }

  let sentIds = [];
  try {
    ({ sentIds } = await sendTelegram(env, formatMessages(fresh)));
  } catch (e) {
    // sendTelegram не бросает при отказе отдельных сообщений; сюда попадает только
    // крах самого цикла — тогда все вакансии считаем недоставленными
    console.error('sendTelegram упал: ' + e.message);
  }

  // недоставленные вакансии возвращаются в очередь следующего прогона:
  // снимаем пометку «обработано», чтобы не потерять их молча
  const sentSet = new Set(sentIds);
  let failed = 0;
  for (const v of fresh) {
    if (!sentSet.has(v.id)) {
      delete state.seen[v.id];
      delete state.vacWords[v.id];
      failed++;
    }
  }
  if (runRecord) { runRecord.sent = sentIds.length; runRecord.failed = failed; }
  if (failed > 0) {
    console.error('Недоставленные вакансии вернутся: ' + failed);
    try {
      // в cron-прогоне это единственное видимое в чате сообщение о сбое доставки
      await sendTelegram(env, ['⚠️ hh-notifier: доставлено ' + sentIds.length + ' из ' + fresh.length + ' вакансий. Недоставленные (' + failed + ') повторятся в следующем прогоне; повторить сейчас — /retry.']);
    } catch {}
  }
  await lateEnrichFollowUp(env, state, allowApi, new Set(candidates.map((c) => String(c.id))), repliedSet);
  await saveState(env, state);
  return { fresh: fresh.length, sent: sentIds.length, failed };
}

// доливка описаний для вакансий недавних прогонов, где скачать не удалось в свой
// прогон (например, вакансия скрыта от анонимного API, или hh.ru мигнул сбоем).
// Потолок за прогон и лимит попыток на вакансию — чтобы не долбить hh.ru впустую;
// успешные уходят в чат отдельным сообщением, details в истории обновляется (/retry
// тоже начинает присылать полный текст)
async function lateEnrichFollowUp(env, state, allowApi, skipIds, repliedSet) {
  const late = [];
  for (const r of state.runs) {
    if (Date.now() - Date.parse(r.t) > CONFIG.lateEnrichHours * 3600e3) continue;
    for (const it of r.items) {
      if (it.details || (it.tries || 0) >= CONFIG.lateTries) continue;
      if (skipIds.has(String(it.id)) || repliedSet.has(String(it.id))) continue;
      late.push(it);
    }
  }
  const got = [];
  for (const it of late.slice(0, CONFIG.maxLateEnrichPerRun)) {
    it.tries = (it.tries || 0) + 1;
    try {
      it.details = await fetchVacancyText(it.id, state, allowApi);
      got.push(it);
    } catch {}
    await sleep(CONFIG.enrichPauseMs);
  }
  if (!got.length) return;
  console.log('Доливка описаний: получено ' + got.length + ' из ' + late.length + ' ожидавших');
  try {
    await sendTelegram(env, [
      '📦 Описания вакансий из прошлых прогонов (тогда скачать не удалось):',
      ...got.map((it) => ({ text: it.link + '\n\n' + it.details, vacancyId: it.id })),
    ]);
  } catch (e) {
    console.error('Не отправлены долитые описания: ' + e.message);
  }
}
