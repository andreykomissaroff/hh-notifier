// hh-notifier — Cloudflare Worker: новые вакансии hh.ru -> Telegram (24/7, бесплатно).
// Версия 2 проекта. Версия 1 (PowerShell + SMTP/Яндекс, ПК) — C:\Users\Андрей\Documents\JobSearch\hh-notifier.
// Логика отбора повторяет версию 1 один в один:
//   поисковые запросы + компании-мониторы (employer_id) -> стоп-слова ->
//   leadership-фильтр (для компаний) -> свежесть <= maxAgeHours -> дедуп (KV + replied-список).

export default {
  // запуск по расписанию (cron в wrangler.toml; в dashboard — Triggers -> Cron Triggers)
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runNotifier(env).catch((e) => console.error('FATAL: ' + e.message)));
  },
  // ручной прогон: https://<имя-воркера>.<поддомен>.workers.dev/run
  // тест канала доставки: /test — шлёт сообщение в Telegram независимо от вакансий
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/run') {
      await runNotifier(env);
      return new Response('OK: прогон выполнен (лог — dashboard Logs или wrangler tail)');
    }
    if (url.pathname === '/test') {
      await sendTelegram(env, ['✅ Тест доставки: hh-notifier работает из Cloudflare Workers. Новые вакансии будут приходить сюда.']);
      return new Response('OK: тестовое сообщение отправлено в Telegram');
    }
    return new Response('hh-notifier worker. GET /run — прогон, GET /test — проверка Telegram.');
  },
};

const CONFIG = {
  maxAgeHours: 26,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) hh-notifier/2.0',

  // поисковые запросы: text ищется в названии вакансии (search_field=name), area: 1 = Москва
  searches: [
    { name: 'CIO', text: 'CIO', area: '1' },
    { name: 'ИТ-директор', text: 'ИТ-директор', area: '1' },
    { name: 'Директор по ИТ', text: 'директор информационных технологий', area: '1' },
    { name: 'Технический директор', text: 'технический директор', area: '1' },
    { name: 'ИТ-лидер', text: 'ИТ-лидер', area: '1' },
    { name: 'Руководитель ИТ', text: 'руководитель ИТ', area: '1' },
    { name: 'Руководитель разработки (РФ)', text: 'руководитель разработки', area: '' },
  ],

  // чисто ИТ-компании: мониторим все их вакансии; целевые — управленческие роли
  companies: [
    { name: 'X5 Tech', employerId: '9352463' },
    { name: 'SberTech', employerId: '906557' },
    { name: 'Северсталь IT & Digital', employerId: '6041' },
    { name: 'Wildberries & Russ', employerId: '87021' },
  ],

  // вакансии с этими словами в названии не присылаем
  excludeKeywords: ['продаж', 'закупк', 'ассистент', 'помощник', 'оператор', 'секретарь', 'финансовый директор', 'маркетинг', 'маркетолог', 'team lead', 'тимлид'],

  // для company-мониторов: название должно содержать одно из управленческих слов
  leadershipKeywords: ['руковод', 'начальник', 'директор', 'лидер', 'head', 'chief', 'cio', 'cto'],

  // вакансии, на которые уже откликнулись (версия 1, replied.json) — не присылать никогда
  repliedIds: [
    '136296820', '136328870', '136653076', '136963913', '137401302', '137413460',
    '136786078', '137221551', '137368511', '137362906', '137367385', '137174777',
    '137239828', '137169049', '137343839', '137349306', '137343096', '137320125',
    '136700980', '137307322', '137298658', '137289442', '137118054', '137143207',
    '136932897', '137272526', '136898219',
  ],
};

function buildUrl(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  sp.set('order_by', 'publication_time');
  return 'https://hh.ru/search/vacancy/rss?' + sp.toString();
}

function buildTasks() {
  const tasks = CONFIG.searches.map((s) => ({
    name: s.name,
    url: buildUrl({ text: s.text, area: s.area, search_field: 'name' }),
    isCompany: false,
  }));
  for (const c of CONFIG.companies) {
    tasks.push({
      name: 'Компания: ' + c.name,
      url: buildUrl({ employer_id: c.employerId }),
      isCompany: true,
    });
  }
  return tasks;
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const body = m[1];
    const get = (tag) => {
      const mm = body.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
      return mm ? mm[1] : '';
    };
    const title = decodeXml(get('title')).trim();
    const link = decodeXml(get('link')).trim();
    const guid = decodeXml(get('guid')).trim();
    const pub = Date.parse(decodeXml(get('pubDate')).trim()) || 0;
    const descHtml = decodeXml(get('description').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, ''));
    const pick = (re2) => { const mm = descHtml.match(re2); return mm ? mm[1].trim() : ''; };
    const idMatch = guid.match(/\/vacancy\/(\d+)/) || link.match(/\/vacancy\/(\d+)/);
    items.push({
      id: idMatch ? idMatch[1] : guid,
      title, link, pub,
      company: pick(/Вакансия компании:\s*([^<]+)/),
      region: pick(/Регион:\s*([^<]+)/),
      salary: pick(/дохода:\s*([^<]+)/),
    });
  }
  return items;
}

function matchesAny(title, keywords) {
  const t = title.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runNotifier(env) {
  let state = await env.STATE.get('state', 'json');
  if (!state || !state.seen) state = { seen: {} };
  const repliedSet = new Set(CONFIG.repliedIds);
  const cutoff = Date.now() - CONFIG.maxAgeHours * 3600 * 1000;
  const fresh = [];
  const log = [];

  for (const task of buildTasks()) {
    try {
      const res = await fetch(task.url, { headers: { 'User-Agent': CONFIG.userAgent } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const items = parseItems(await res.text());
      const st = { dup: 0, old: 0, excluded: 0, notLead: 0, fresh: 0 };
      for (const it of items) {
        if (!it.id) continue;
        if (state.seen[it.id] || repliedSet.has(it.id)) { st.dup++; continue; }
        if (it.pub < cutoff) { st.old++; continue; }
        if (matchesAny(it.title, CONFIG.excludeKeywords)) { st.excluded++; continue; }
        if (task.isCompany && !matchesAny(it.title, CONFIG.leadershipKeywords)) { st.notLead++; continue; }
        fresh.push({ ...it, search: task.name });
        state.seen[it.id] = new Date().toISOString();
        st.fresh++;
      }
      log.push(`[${task.name}] загружено ${items.length}: уже показано ${st.dup}, устарело ${st.old}, отсеяно стоп-словом ${st.excluded}, не-руководящих ${st.notLead}, новых ${st.fresh}`);
    } catch (e) {
      log.push(`[${task.name}] ОШИБКА: ${e.message}`);
    }
    await sleep(2000); // вежливая пауза между запросами
  }

  // ротация state: держим записи за последние 14 дней
  const stateCutoff = Date.now() - 14 * 86400 * 1000;
  for (const id of Object.keys(state.seen)) {
    if (Date.parse(state.seen[id]) < stateCutoff) delete state.seen[id];
  }
  await env.STATE.put('state', JSON.stringify(state));
  console.log(log.join('\n'));

  if (fresh.length === 0) {
    console.log('Новых вакансий нет — сообщение не отправляется');
    return;
  }
  await sendTelegram(env, formatMessages(fresh));
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const fmtMSK = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

function vacancyBlock(v) {
  const parts = [v.company, v.region, v.salary].filter(Boolean).join(' · ');
  return (
    `<a href="${esc(v.link)}"><b>${esc(v.title)}</b></a>\n` +
    (parts ? esc(parts) + '\n' : '') +
    `<i>опубликовано ${fmtMSK.format(v.pub)} · поиск: ${esc(v.search)}</i>`
  );
}

// формирует тексты сообщений (лимит Telegram — 4096 символов, держим запас)
function formatMessages(fresh) {
  const header = `hh.ru: новых вакансий — ${fresh.length} (${fmtMSK.format(Date.now())})`;
  const blocks = fresh.sort((a, b) => a.search.localeCompare(b.search)).map(vacancyBlock);
  const chunks = [];
  let cur = header + '\n\n';
  for (const b of blocks) {
    if (cur.length + b.length + 2 > 3800) { chunks.push(cur.trim()); cur = ''; }
    cur += b + '\n\n';
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function sendTelegram(env, texts) {
  for (const text of texts) {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(env.TELEGRAM_CHAT_ID),
        text, parse_mode: 'HTML', disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error('Telegram API: ' + (data.description || res.status));
  }
  console.log(`Telegram: отправлено сообщений — ${texts.length}`);
}
