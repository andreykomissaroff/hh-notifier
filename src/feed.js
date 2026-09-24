// Слой hh.ru: построение RSS-задач из поисковых запросов и компаний-мониторов, парсинг фида.

import { CONFIG } from './config.js';

export function buildUrl(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  sp.set('order_by', 'publication_time');
  return 'https://hh.ru/search/vacancy/rss?' + sp.toString();
}

// задачи прогона: поисковые запросы (isCompany=false) + компании по employer_id
export function buildTasks(searches) {
  const tasks = (searches || CONFIG.searches).map((s) => ({
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

export function parseItems(xml) {
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

export function matchesAny(title, keywords) {
  const t = title.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}
