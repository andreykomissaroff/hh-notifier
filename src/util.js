// Общие утилиты.

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function uniq(arr) {
  return [...new Set(arr)];
}

export const fmtMSK = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});
