// Обогащение вакансий полными описаниями: api.hh.ru -> фолбэк на HTML-страницу.
// Предохранители: кэш отказа API (state.apiDisabledUntil), потолок скачиваний за прогон, паузы.

import { CONFIG } from './config.js';
import { sleep } from './util.js';

// state/allowApi: если api.hh.ru отказал, сутки ходим сразу по HTML — без двойных запросов.
export async function fetchVacancyText(id, state, allowApi) {
  if (allowApi) {
    const r = await fetch(`https://api.hh.ru/vacancies/${id}`, { headers: { 'User-Agent': CONFIG.userAgent } });
    if (r.ok) return formatApi(await r.json());
    if (r.status === 404) throw new Error('вакансия не найдена или удалена');
    if (state) {
      state.apiDisabledUntil = new Date(Date.now() + 24 * 86400 * 1000).toISOString();
      console.log('api.hh.ru отказал (' + r.status + ') — сутки используем только HTML-фолбэк');
    }
  }
  const r2 = await fetch(`https://hh.ru/vacancy/${id}`, { headers: { 'User-Agent': CONFIG.userAgent, 'Accept-Language': 'ru' } });
  if (r2.ok) return formatPage(await r2.text(), id);
  if (r2.status === 404) throw new Error('вакансия не найдена или удалена');
  throw new Error('hh.ru вернул ' + r2.status);
}

function formatApi(v) {
  const L = [`📌 ${v.name || 'Без названия'}`];
  if (v.employer?.name) L.push(`Компания: ${v.employer.name}`);
  if (v.address?.city || v.area?.name) L.push(`Город: ${v.address?.city || v.area.name}`);
  if (v.work_format?.name) L.push(`Формат: ${v.work_format.name}`);
  if (v.experience?.name) L.push(`Опыт: ${v.experience.name}`);
  const s = v.salary;
  if (s && (s.from || s.to)) {
    const parts = [];
    if (s.from) parts.push(`от ${s.from}`);
    if (s.to) parts.push(`до ${s.to}`);
    L.push(`Зарплата: ${parts.join(' ')} ${s.currency || ''}${s.gross ? ' (до вычета)' : ' (на руки)'}`);
  }
  const extra = [v.schedule?.name, v.employment?.name].filter(Boolean).join(', ');
  if (extra) L.push(`График: ${extra}`);
  skillsAndDesc(L, (v.key_skills || []).map((k) => k.name), v.description || '');
  return L.join('\n');
}

function formatPage(html, id) {
  const text = (re, group = 1) => {
    const m = html.match(re);
    return m ? stripTags(m[group]).trim() : null;
  };
  const ld = (() => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    try { return m ? JSON.parse(m[1]) : {}; } catch { return {}; }
  })();

  const title = text(/<h1[^>]*data-qa="vacancy-title"[^>]*>([\s\S]*?)<\/h1>/) || ld.title || 'Вакансия';
  const L = [`📌 ${title}`];
  const company = text(/data-qa="vacancy-company-name"[^>]*>([\s\S]*?)<\/a>/) || ld.hiringOrganization?.name;
  if (company) L.push(`Компания: ${stripTags(company).trim()}`);
  const city = ld.jobLocation?.address?.addressLocality;
  if (city) L.push(`Город: ${city}`);
  const exp = text(/data-qa="vacancy-experience"[^>]*>([\s\S]*?)<\/span>/);
  if (exp) L.push(`Опыт: ${exp}`);
  const salary = text(/data-qa="vacancy-salary"[^>]*>([\s\S]*?)<\/div>/);
  if (salary && !/не указан/.test(salary)) L.push(`Зарплата: ${salary}`);

  const skills = (() => {
    const m = html.match(/&#34;keySkills&#34;:\{&#34;keySkill&#34;:\[([\s\S]*?)\]/);
    if (!m) return [];
    return (m[1].replace(/&#34;/g, '"').replace(/&amp;/g, '&').match(/"[^"]+"/g) || [])
      .map((s) => s.slice(1, -1));
  })();
  skillsAndDesc(L, skills, ld.description || '');
  return L.join('\n');
}

function skillsAndDesc(L, skills, descHtml) {
  if (skills.length) L.push('\nКлючевые навыки:\n' + skills.map((s) => '• ' + s).join('\n'));
  const d = cleanHtml(descHtml);
  if (d) L.push(`\nОписание:\n${d}`);
}

function cleanHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(s) {
  return cleanHtml(s);
}

// скачивание описаний для кандидатов с потолком на прогон; неудачи молча дают пустой details
export async function enrichCandidates(candidates, state, allowApi, log) {
  let failures = 0;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (i < CONFIG.maxEnrichPerRun) {
      try {
        c.details = await fetchVacancyText(c.id, state, allowApi);
        // API отказал в этом прогоне — остальные кандидаты идут сразу по HTML
        if (state.apiDisabledUntil && Date.parse(state.apiDisabledUntil) > Date.now()) allowApi = false;
      } catch (e) {
        if (/не найдена или удалена/.test(e.message)) {
          log.push(`[${c.search}] вакансия ${c.id} удалена — пропущена`);
        } else {
          failures++;
          console.log(`[${c.id}] описание недоступно: ${e.message}`);
        }
        c.details = '';
      }
      await sleep(CONFIG.enrichPauseMs);
    }
  }
  return failures;
}
