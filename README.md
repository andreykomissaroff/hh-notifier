# hh-notifier CF Worker — версия 2 (Telegram, 24/7 в облаке)

Worker для Cloudflare Workers: раз в 2 часа проверяет RSS hh.ru и присылает новые вакансии
в Telegram боту `@digest_hh_vacancies_bot`. Бесплатный тариф Cloudflare покрывает работу с многократным запасом.

Логика отбора идентична версии 1 (`C:\Users\Андрей\Documents\JobSearch\hh-notifier`):
7 поисковых запросов + 4 компании-монитора (employer_id), стоп-слова, leadership-фильтр,
свежесть ≤26 ч, дедуп по id (KV) + постоянный список откликнутых (`repliedIds` в index.js).

С 24.09.2026 — **реакционное обучение**: под каждым сообщением вакансии кнопки 👍/👎;
веса слов (название + навыки ×1.0, тело описания ×0.5) сдвигаются голосами, вакансии с
рейтингом ≤ −2 по ≥3 «знакомым» словам скрываются из дайджеста (консервативно). `/stats` —
статистика. Скачивание описаний: до 10 за прогон (защита от всплесков), при отказе
api.hh.ru — сутки сразу по HTML-фолбэку, алерт ⚠️ при серийных сбоях описаний.

## Перед деплоем — 2 значения

1. **TELEGRAM_BOT_TOKEN** — токен от @BotFather (у вас есть).
2. **TELEGRAM_CHAT_ID** — напишите боту `/start`, затем откройте в **Edge** (VPN браузера нужен):
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates`
   В JSON найдите `"chat":{"id": ЧИСЛО}` — это chat_id (у личного чата число положительное).

## Деплой через dashboard (без npm, ~10 минут)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Create Worker** → имя `hh-notifier` → Deploy.
2. **Edit code** → удалить шаблон → вставить содержимое `index.js` → Deploy.
3. **Storage & Databases → KV → Create namespace**: имя `hh-notifier-state`.
4. Воркер → **Settings → Bindings → Add**: тип **KV namespace**, имя переменной `STATE`, namespace `hh-notifier-state`.
5. **Settings → Variables**: добавить
   - `TELEGRAM_CHAT_ID` (тип Text) — ваш chat_id;
   - `TELEGRAM_BOT_TOKEN` (тип **Secret**) — токен бота.
6. **Settings → Triggers → Cron Triggers → Add**: `0 4,6,8,10,12,14,16,18 * * *` (UTC = 07:00–21:00 МСК).
7. (Чтобы первый прогон не прислал заново уже показанные вакансии) **Storage & Databases → KV → hh-notifier-state → Add key manually**:
   Key = `state`, Value = содержимое файла `initial-state.json` (копия state.json версии 1; обновляйте при переносе).
8. Тест: открыть `https://hh-notifier.<ваш-поддомен>.workers.dev/run` — увидите `OK`;
   лог прогона — **Worker → Logs → Begin log stream**, затем снова `/run`.
   В Telegram должно прийти сообщение (если есть новые вакансии за последние 26 часов).

## Деплой через wrangler CLI (альтернатива)

```cmd
npm install -g wrangler
wrangler login
wrangler kv namespace create STATE
:: вставьте выданный id в wrangler.toml (kv_namespaces) и chat_id в [vars]
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler deploy
wrangler tail          :: живой лог
```

Ручной прогон: откройте `https://hh-notifier.<поддомен>.workers.dev/run`.

## После проверки

Отключите локальную версию 1 (иначе будут дубли — дедуп у версий раздельный):

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Андрей\Documents\JobSearch\hh-notifier\uninstall-schedule.ps1"
```

Версия 1 остаётся в папке как резерв (README внутри описывает, как включить обратно).

## Отличия от версии 1

- Нет email/SMTP — уведомления в Telegram (HTML, ссылки, превью отключено).
- state.json → KV-ключ `state` (та же структура, ротация 14 дней).
- replied.json → константа `repliedIds` в index.js.
- companies.json → employer_id зашиты в CONFIG (меняются редко).
- Конфиг (запросы, стоп-слова) — константы в начале index.js: правьте и жмите Deploy.

## Известные ограничения

- RSS hh.ru доступен с зарубежных IP (проверено), но hh.ru может начать резать Cloudflare-адреса —
  тогда в логе воркера будут «ОШИБКА: HTTP 403»; решение — российская площадка (Yandex Cloud Functions) или VPS.
- Telegram Bot API доступен воркеру напрямую; для чтения сообщений на телефоне по-прежнему нужен VPN.
