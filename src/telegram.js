// Telegram adapter: отправка сообщений, клавиатура реакций, шаблоны дайджеста.

import { sleep, fmtMSK } from './util.js';

async function tgFetch(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
}

// клавиатура реакций: 👎 слева, 👍 справа; галочка — текущее состояние вакансии
export function feedbackKeyboard(id, v) {
  v = v || 0;
  return { inline_keyboard: [[
    { text: v === -1 ? '👎 ✅' : '👎', callback_data: 'fb:down:' + id },
    { text: v === 1 ? '👍 ✅' : '👍', callback_data: 'fb:up:' + id },
  ]] };
}

// texts: массив строк/объектов { text, vacancyId } или одна строка.
// Не бросает исключение при отказе отдельных сообщений: ретраит 429/5xx
// (уважая retry_after) и возвращает id вакансий, доставленных успешно.
export async function sendTelegram(env, texts) {
  const list = typeof texts === 'string' ? [texts] : texts;
  const chatId = Number(env.TELEGRAM_CHAT_ID);
  const sentIds = [];
  for (let i = 0; i < list.length; i++) {
    if (i > 0) await sleep(400); // лимит Telegram ~1 сообщение/сек на чат
    const t = typeof list[i] === 'string' ? { text: list[i] } : list[i];
    const body = { chat_id: chatId, text: t.text, disable_web_page_preview: true };
    if (t.vacancyId) body.reply_markup = feedbackKeyboard(t.vacancyId);
    let ok = false, lastError = '';
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      if (attempt > 0) await sleep(3000);
      const data = await tgFetch(env, 'sendMessage', body);
      if (data.ok) { ok = true; break; }
      lastError = data.description || ('HTTP ' + data.error_code);
      const retryable = data.error_code === 429 || data.error_code >= 500;
      if (data.error_code === 429) await sleep(((data.parameters?.retry_after) || 3) * 1000);
      else if (!retryable) break; // 4xx — повтор бессмыслен
    }
    if (ok) {
      if (t.vacancyId) sentIds.push(t.vacancyId);
    } else {
      console.error('sendMessage failed: ' + lastError + ' | text: ' + String(t.text).slice(0, 60));
    }
  }
  console.log(`Telegram: отправлено сообщений — ${sentIds.length} из ${list.length}`);
  return { sentIds };
}

// отправка в указанный чат (ответы на команды, онбординг, присланные ссылки)
export async function sendTelegramTo(env, chatId, texts) {
  const list = typeof texts === 'string' ? [texts] : texts;
  for (let i = 0; i < list.length; i++) {
    if (i > 0) await sleep(400);
    const t = typeof list[i] === 'string' ? { text: list[i] } : list[i];
    const body = { chat_id: chatId, text: t.text, disable_web_page_preview: true };
    if (t.vacancyId) body.reply_markup = feedbackKeyboard(t.vacancyId);
    const data = await tgFetch(env, 'sendMessage', body);
    if (!data.ok) throw new Error('Telegram API: ' + (data.description || 'send error'));
  }
}

export async function answerCallbackQuery(env, callbackId, text) {
  try {
    await tgFetch(env, 'answerCallbackQuery', { callback_query_id: callbackId, text });
  } catch {}
}

// помечает на сообщении кнопку текущего состояния вакансии (кнопки остаются)
export async function markReactionOnMessage(env, chatId, messageId, vacancyId, vote) {
  try {
    await tgFetch(env, 'editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: feedbackKeyboard(vacancyId, vote),
    });
  } catch (e) {
    console.error('markReaction error: ' + e.message);
  }
}

// разбиение длинного текста на сообщения (лимит Telegram 4096, держим запас)
export function splitText(text, limit = 3800) {
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

// каждое сообщение — ссылка + описание вакансии; первым идёт заголовок.
// Если вакансия не влезла в одно сообщение, кнопки 👍/👎 — только на последнем куске
export function formatMessages(fresh) {
  const header = `hh.ru: новых вакансий — ${fresh.length} (${fmtMSK.format(Date.now())})`;
  const sorted = fresh.sort((a, b) => a.search.localeCompare(b.search));
  const msgs = [{ text: header }];
  for (const v of sorted) {
    const text = v.details ? v.link + '\n\n' + v.details : v.link;
    const parts = splitText(text);
    parts.forEach((part, i) => msgs.push({ text: part, vacancyId: i === parts.length - 1 ? v.id : null }));
  }
  return msgs;
}
