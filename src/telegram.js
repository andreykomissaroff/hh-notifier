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

// texts: массив строк/объектов { text, vacancyId } или одна строка
export async function sendTelegram(env, texts) {
  const list = typeof texts === 'string' ? [texts] : texts;
  const chatId = Number(env.TELEGRAM_CHAT_ID);
  for (let i = 0; i < list.length; i++) {
    if (i > 0) await sleep(400); // лимит Telegram ~1 сообщение/сек на чат
    const t = typeof list[i] === 'string' ? { text: list[i] } : list[i];
    const body = { chat_id: chatId, text: t.text, disable_web_page_preview: true };
    if (t.vacancyId) body.reply_markup = feedbackKeyboard(t.vacancyId);
    const data = await tgFetch(env, 'sendMessage', body);
    if (!data.ok) throw new Error('Telegram API: ' + (data.description || 'send error'));
  }
  console.log(`Telegram: отправлено сообщений — ${list.length}`);
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

// каждое сообщение — ссылка + описание вакансии; первым идёт заголовок; вакансии — с кнопками
export function formatMessages(fresh) {
  const header = `hh.ru: новых вакансий — ${fresh.length} (${fmtMSK.format(Date.now())})`;
  const sorted = fresh.sort((a, b) => a.search.localeCompare(b.search));
  const msgs = [{ text: header }];
  for (const v of sorted) {
    const text = v.details ? v.link + '\n\n' + v.details : v.link;
    for (const part of splitText(text)) msgs.push({ text: part, vacancyId: v.id });
  }
  return msgs;
}
