// src/config.js
var CONFIG = {
  maxAgeHours: 26,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) hh-notifier/3.0",
  // поисковые запросы по умолчанию (fallback, если профиль не задан): text ищется в названии вакансии, area: 1 = Москва
  searches: [
    { name: "CIO", text: "CIO", area: "1" },
    { name: "\u0418\u0422-\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440", text: "\u0418\u0422-\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440", area: "1" },
    { name: "\u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440 \u043F\u043E \u0418\u0422", text: "\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0445 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439", area: "1" },
    { name: "\u0422\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440", text: "\u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440", area: "1" },
    { name: "\u0418\u0422-\u043B\u0438\u0434\u0435\u0440", text: "\u0418\u0422-\u043B\u0438\u0434\u0435\u0440", area: "1" },
    { name: "\u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u0418\u0422", text: "\u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u0418\u0422", area: "1" },
    { name: "\u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438 (\u0420\u0424)", text: "\u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438", area: "" }
  ],
  // чисто ИТ-компании: мониторим все их вакансии; целевые — управленческие роли
  companies: [
    { name: "X5 Tech", employerId: "9352463" },
    { name: "SberTech", employerId: "906557" },
    { name: "\u0421\u0435\u0432\u0435\u0440\u0441\u0442\u0430\u043B\u044C IT & Digital", employerId: "6041" },
    { name: "Wildberries & Russ", employerId: "87021" }
  ],
  // вакансии с этими словами в названии не присылаем
  excludeKeywords: ["\u043F\u0440\u043E\u0434\u0430\u0436", "\u0437\u0430\u043A\u0443\u043F\u043A", "\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442", "\u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A", "\u043E\u043F\u0435\u0440\u0430\u0442\u043E\u0440", "\u0441\u0435\u043A\u0440\u0435\u0442\u0430\u0440\u044C", "\u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u044B\u0439 \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440", "\u043C\u0430\u0440\u043A\u0435\u0442\u0438\u043D\u0433", "\u043C\u0430\u0440\u043A\u0435\u0442\u043E\u043B\u043E\u0433", "team lead", "\u0442\u0438\u043C\u043B\u0438\u0434"],
  // для company-мониторов: название должно содержать одно из управленческих слов
  leadershipKeywords: ["\u0440\u0443\u043A\u043E\u0432\u043E\u0434", "\u043D\u0430\u0447\u0430\u043B\u044C\u043D\u0438\u043A", "\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440", "\u043B\u0438\u0434\u0435\u0440", "head", "chief", "cio", "cto"],
  // вакансии, на которые уже откликнулись — не присылать никогда
  repliedIds: [
    "136296820",
    "136328870",
    "136653076",
    "136963913",
    "137401302",
    "137413460",
    "136786078",
    "137221551",
    "137368511",
    "137362906",
    "137367385",
    "137174777",
    "137239828",
    "137169049",
    "137343839",
    "137349306",
    "137343096",
    "137320125",
    "136700980",
    "137307322",
    "137298658",
    "137289442",
    "137118054",
    "137143207",
    "136932897",
    "137272526",
    "136898219"
  ],
  // реакционное обучение: авто-скрытие вакансий с сильно негативным рейтингом
  negativeScoreToSkip: -2,
  minWeightedWords: 3,
  // текстовый скоринг: минимум «знакомых» слов
  titleMinWeightedWords: 2,
  // скоринг по названию (текст недоступен или сверх потолка)
  wordWeightCap: 5,
  maxEnrichPerRun: 10,
  // потолок скачиваний описаний за прогон (защита от всплесков)
  enrichPauseMs: 1200,
  // профиль по умолчанию (пример из резюме владельца репозитория).
  // При онбординге заменяется профилем из KV — см. src/profile.js.
  // Корни слов: совпадение = токен вакансии начинается с корня (ё нормализована в «е»).
  profile: {
    roles: [
      "cio",
      "cto",
      "\u0438\u0442-\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440",
      "it-\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440",
      "\u0438\u0442-\u043B\u0438\u0434\u0435\u0440",
      "it-\u043B\u0438\u0434\u0435\u0440",
      "\u0438\u0442-\u043F\u0430\u0440\u0442\u043D\u0435\u0440",
      "it-\u043F\u0430\u0440\u0442\u043D\u0435\u0440",
      "\u0446\u0438\u0444\u0440\u043E\u0432\u0430\u044F-\u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F",
      "\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0445-\u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439"
    ],
    tech: [
      "1\u0441",
      "erp",
      "crm",
      "bi",
      "olap",
      "oracle",
      "postgres",
      "sql",
      "java",
      "c#",
      "kubernetes",
      "gitlab",
      "camunda",
      "cognos",
      "sharepoint",
      "bpm",
      "itil",
      "itsm",
      "devsecops",
      "devops",
      "scrum",
      "pmbok",
      "agile",
      "ai",
      "\u0438\u0438",
      "ml",
      "rag",
      "mcp",
      "ocr",
      "n8n",
      "api",
      "rest",
      "soap",
      "esb",
      "edi",
      "\u044D\u0434\u043E",
      "\u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446",
      "\u043C\u0438\u043A\u0440\u043E\u0441\u0435\u0440\u0432\u0438\u0441",
      "\u0438\u043C\u043F\u043E\u0440\u0442\u043E\u0437\u0430\u043C\u0435\u0449",
      "\u0446\u0438\u0444\u0440\u043E\u0432\u0438\u0437\u0430\u0446",
      "\u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446",
      "\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u043E\u0431\u043E\u0440\u043E\u0442"
    ],
    domains: [
      "\u0444\u0438\u043D\u0430\u043D\u0441",
      "\u0444\u0438\u043D\u0442\u0435\u0445",
      "\u0444\u0438\u043D\u0441\u0435\u043A\u0442\u043E\u0440",
      "\u0431\u0430\u043D\u043A",
      "\u0431\u0438\u0440\u0436",
      "\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u0430\u043D",
      "\u043A\u0430\u0437\u043D\u0430\u0447\u0435\u0439\u0441\u0442\u0432",
      "\u0431\u044E\u0434\u0436\u0435\u0442\u0438\u0440",
      "\u0443\u0447\u0435\u0442",
      "\u0437\u0430\u0440\u043F\u043B\u0430\u0442",
      "\u043A\u0430\u0434\u0440\u043E\u0432",
      "\u043D\u0430\u043B\u043E\u0433\u043E\u0432",
      "\u043C\u0441\u0444\u043E",
      "\u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C\u0430\u0446"
    ]
  }
};

// src/state.js
var STATE_KEY = "state";
var PROFILE_KEY = "profile";
async function loadState(env) {
  let state = await env.STATE.get(STATE_KEY, "json");
  if (!state || !state.seen) state = { seen: {} };
  state.vacWords = state.vacWords || {};
  state.wordWeights = state.wordWeights || {};
  state.feedback = state.feedback || {};
  return state;
}
async function saveState(env, state) {
  await env.STATE.put(STATE_KEY, JSON.stringify(state));
}
async function loadProfile(env) {
  return await env.STATE.get(PROFILE_KEY, "json");
}
async function saveProfile(env, profile) {
  await env.STATE.put(PROFILE_KEY, JSON.stringify(profile));
}
async function getActiveProfile(env) {
  const p = await loadProfile(env);
  return p && p.roles ? p : CONFIG.profile;
}
function pruneFeedbackData(state) {
  const cutoff = Date.now() - 45 * 86400 * 1e3;
  for (const coll of ["feedback", "vacWords"]) {
    const obj = state[coll];
    if (!obj) continue;
    for (const k of Object.keys(obj)) {
      if (!obj[k] || Date.parse(obj[k].t || 0) < cutoff) delete obj[k];
    }
  }
  const ww = state.wordWeights;
  if (ww && Object.keys(ww).length > 1200) {
    for (const k of Object.keys(ww)) {
      if (Object.keys(ww).length <= 1200) break;
      if (Math.abs(ww[k]) <= 1) delete ww[k];
    }
  }
}
function pruneSeen(state) {
  const cutoff = Date.now() - 14 * 86400 * 1e3;
  for (const id of Object.keys(state.seen)) {
    if (Date.parse(state.seen[id]) < cutoff) delete state.seen[id];
  }
}

// src/feed.js
function buildUrl(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  sp.set("order_by", "publication_time");
  return "https://hh.ru/search/vacancy/rss?" + sp.toString();
}
function buildTasks(searches) {
  const tasks = (searches || CONFIG.searches).map((s) => ({
    name: s.name,
    url: buildUrl({ text: s.text, area: s.area, search_field: "name" }),
    isCompany: false
  }));
  for (const c of CONFIG.companies) {
    tasks.push({
      name: "\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F: " + c.name,
      url: buildUrl({ employer_id: c.employerId }),
      isCompany: true
    });
  }
  return tasks;
}
function decodeXml(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const body = m[1];
    const get = (tag) => {
      const mm = body.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">"));
      return mm ? mm[1] : "";
    };
    const title = decodeXml(get("title")).trim();
    const link = decodeXml(get("link")).trim();
    const guid = decodeXml(get("guid")).trim();
    const pub = Date.parse(decodeXml(get("pubDate")).trim()) || 0;
    const descHtml = decodeXml(get("description").replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, ""));
    const pick = (re2) => {
      const mm = descHtml.match(re2);
      return mm ? mm[1].trim() : "";
    };
    const idMatch = guid.match(/\/vacancy\/(\d+)/) || link.match(/\/vacancy\/(\d+)/);
    items.push({
      id: idMatch ? idMatch[1] : guid,
      title,
      link,
      pub,
      company: pick(/Вакансия компании:\s*([^<]+)/),
      region: pick(/Регион:\s*([^<]+)/),
      salary: pick(/дохода:\s*([^<]+)/)
    });
  }
  return items;
}
function matchesAny(title, keywords) {
  const t = title.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

// src/util.js
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function uniq(arr) {
  return [...new Set(arr)];
}
var fmtMSK = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

// src/enrich.js
async function fetchVacancyText(id, state, allowApi) {
  if (allowApi) {
    const r = await fetch(`https://api.hh.ru/vacancies/${id}`, { headers: { "User-Agent": CONFIG.userAgent } });
    if (r.ok) return formatApi(await r.json());
    if (r.status === 404) throw new Error("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0430");
    if (state) {
      state.apiDisabledUntil = new Date(Date.now() + 24 * 86400 * 1e3).toISOString();
      console.log("api.hh.ru \u043E\u0442\u043A\u0430\u0437\u0430\u043B (" + r.status + ") \u2014 \u0441\u0443\u0442\u043A\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C \u0442\u043E\u043B\u044C\u043A\u043E HTML-\u0444\u043E\u043B\u0431\u044D\u043A");
    }
  }
  const r2 = await fetch(`https://hh.ru/vacancy/${id}`, { headers: { "User-Agent": CONFIG.userAgent, "Accept-Language": "ru" } });
  if (r2.ok) return formatPage(await r2.text(), id);
  if (r2.status === 404) throw new Error("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0430");
  throw new Error("hh.ru \u0432\u0435\u0440\u043D\u0443\u043B " + r2.status);
}
function formatApi(v) {
  const L = [`\u{1F4CC} ${v.name || "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F"}`];
  if (v.employer?.name) L.push(`\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F: ${v.employer.name}`);
  if (v.address?.city || v.area?.name) L.push(`\u0413\u043E\u0440\u043E\u0434: ${v.address?.city || v.area.name}`);
  if (v.work_format?.name) L.push(`\u0424\u043E\u0440\u043C\u0430\u0442: ${v.work_format.name}`);
  if (v.experience?.name) L.push(`\u041E\u043F\u044B\u0442: ${v.experience.name}`);
  const s = v.salary;
  if (s && (s.from || s.to)) {
    const parts = [];
    if (s.from) parts.push(`\u043E\u0442 ${s.from}`);
    if (s.to) parts.push(`\u0434\u043E ${s.to}`);
    L.push(`\u0417\u0430\u0440\u043F\u043B\u0430\u0442\u0430: ${parts.join(" ")} ${s.currency || ""}${s.gross ? " (\u0434\u043E \u0432\u044B\u0447\u0435\u0442\u0430)" : " (\u043D\u0430 \u0440\u0443\u043A\u0438)"}`);
  }
  const extra = [v.schedule?.name, v.employment?.name].filter(Boolean).join(", ");
  if (extra) L.push(`\u0413\u0440\u0430\u0444\u0438\u043A: ${extra}`);
  skillsAndDesc(L, (v.key_skills || []).map((k) => k.name), v.description || "");
  return L.join("\n");
}
function formatPage(html, id) {
  const text = (re, group = 1) => {
    const m = html.match(re);
    return m ? stripTags(m[group]).trim() : null;
  };
  const ld = (() => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    try {
      return m ? JSON.parse(m[1]) : {};
    } catch {
      return {};
    }
  })();
  const title = text(/<h1[^>]*data-qa="vacancy-title"[^>]*>([\s\S]*?)<\/h1>/) || ld.title || "\u0412\u0430\u043A\u0430\u043D\u0441\u0438\u044F";
  const L = [`\u{1F4CC} ${title}`];
  const company = text(/data-qa="vacancy-company-name"[^>]*>([\s\S]*?)<\/a>/) || ld.hiringOrganization?.name;
  if (company) L.push(`\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F: ${stripTags(company).trim()}`);
  const city = ld.jobLocation?.address?.addressLocality;
  if (city) L.push(`\u0413\u043E\u0440\u043E\u0434: ${city}`);
  const exp = text(/data-qa="vacancy-experience"[^>]*>([\s\S]*?)<\/span>/);
  if (exp) L.push(`\u041E\u043F\u044B\u0442: ${exp}`);
  const salary = text(/data-qa="vacancy-salary"[^>]*>([\s\S]*?)<\/div>/);
  if (salary && !/не указан/.test(salary)) L.push(`\u0417\u0430\u0440\u043F\u043B\u0430\u0442\u0430: ${salary}`);
  const skills = (() => {
    const m = html.match(/&#34;keySkills&#34;:\{&#34;keySkill&#34;:\[([\s\S]*?)\]/);
    if (!m) return [];
    return (m[1].replace(/&#34;/g, '"').replace(/&amp;/g, "&").match(/"[^"]+"/g) || []).map((s) => s.slice(1, -1));
  })();
  skillsAndDesc(L, skills, ld.description || "");
  return L.join("\n");
}
function skillsAndDesc(L, skills, descHtml) {
  if (skills.length) L.push("\n\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u043D\u0430\u0432\u044B\u043A\u0438:\n" + skills.map((s) => "\u2022 " + s).join("\n"));
  const d = cleanHtml(descHtml);
  if (d) L.push(`
\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435:
${d}`);
}
function cleanHtml(html) {
  return (html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<li[^>]*>/gi, "\n\u2022 ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
}
function stripTags(s) {
  return cleanHtml(s);
}
async function enrichCandidates(candidates, state, allowApi, log) {
  let failures = 0;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (i < CONFIG.maxEnrichPerRun) {
      try {
        c.details = await fetchVacancyText(c.id, state, allowApi);
        if (state.apiDisabledUntil && Date.parse(state.apiDisabledUntil) > Date.now()) allowApi = false;
      } catch (e) {
        if (/не найдена или удалена/.test(e.message)) {
          log.push(`[${c.search}] \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F ${c.id} \u0443\u0434\u0430\u043B\u0435\u043D\u0430 \u2014 \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u0430`);
        } else {
          failures++;
          console.log(`[${c.id}] \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ${e.message}`);
        }
        c.details = "";
      }
      await sleep(CONFIG.enrichPauseMs);
    }
  }
  return failures;
}

// src/scoring.js
var FEEDBACK_STOP_EXACT = /* @__PURE__ */ new Set([
  "\u043F\u043E\u043B\u043D\u044B\u0439",
  "\u0434\u0435\u043D\u044C",
  "\u043D\u0435\u043F\u043E\u043B\u043D\u044B\u0439",
  "\u043E\u043F\u044B\u0442",
  "\u0443\u0440\u043E\u0432\u0435\u043D\u044C",
  "\u0433\u043E\u0440\u043E\u0434",
  "\u043C\u0435\u0441\u044F\u0446",
  "\u0440\u0443\u0431",
  "usd",
  "eur",
  "\u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430",
  "\u0444\u043E\u0440\u043C\u0430\u0442",
  "\u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B",
  "\u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435",
  "\u043D\u0430\u0432\u044B\u043A\u0438",
  "\u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0435",
  "\u0433\u0440\u0430\u0444\u0438\u043A",
  "\u0440\u0430\u0431\u043E\u0442\u0430",
  "\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F",
  "\u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F",
  "\u043E\u0431\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438",
  "\u0443\u0441\u043B\u043E\u0432\u0438\u044F",
  "\u0437\u0430\u043D\u044F\u0442\u043E\u0441\u0442\u044C",
  "\u0441\u043C\u0435\u043D\u043D\u044B\u0439",
  "\u0433\u0438\u0431\u043A\u0438\u0439",
  "\u0443\u0434\u0430\u043B\u0435\u043D\u043D\u043E",
  "\u0443\u0434\u0430\u043B\u0451\u043D\u043D\u043E",
  "\u0433\u0438\u0431\u0440\u0438\u0434",
  "\u043D\u0430",
  "\u0440\u0443\u043A\u0438",
  "\u0432\u044B\u0447\u0435\u0442\u0430",
  "\u0433\u043E\u0434\u0430",
  "\u043B\u0435\u0442",
  "\u0431\u0430\u043D\u043A",
  // типовой шум тел описаний вакансий
  "\u0437\u043D\u0430\u043D\u0438\u0435",
  "\u0437\u043D\u0430\u043D\u0438\u044F",
  "\u0437\u043D\u0430\u043D\u0438\u0435\u043C",
  "\u0431\u0443\u0434\u0435\u0442",
  "\u043A\u043E\u043C\u0430\u043D\u0434",
  "\u043A\u043E\u043C\u0430\u043D\u0434\u0435",
  "\u0437\u0430\u0434\u0430\u0447",
  "\u0437\u0430\u0434\u0430\u0447\u0438",
  "\u043F\u0440\u043E\u0435\u043A\u0442",
  "\u043F\u0440\u043E\u0435\u043A\u0442\u0430",
  "\u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432",
  "\u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F",
  "\u0442\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F",
  "\u043F\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442\u0441\u044F",
  "\u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u0435",
  "\u0440\u0430\u0437\u0432\u0438\u0442\u0438\u0435",
  "\u0440\u0430\u0437\u0432\u0438\u0442\u0438\u044F",
  "\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442",
  "\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432",
  "\u043A\u043B\u0438\u0435\u043D\u0442",
  "\u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432",
  "\u043A\u043B\u0438\u0435\u043D\u0442\u0430\u043C",
  "\u0431\u043E\u043B\u0435\u0435",
  "\u043C\u0435\u043D\u0435\u0435",
  "\u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435",
  "\u043E\u043F\u043B\u0430\u0442\u0430",
  "\u0438\u0441\u043F\u044B\u0442\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439",
  "\u0441\u0440\u043E\u043A",
  "\u0440\u0435\u0437\u044E\u043C\u0435",
  "\u043E\u0442\u043A\u043B\u0438\u043A",
  "\u043E\u0442\u043A\u043B\u0438\u043A\u0443",
  "\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0438",
  "\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044E",
  "\u0440\u0430\u0431\u043E\u0442\u043E\u0434\u0430\u0442\u0435\u043B\u044C"
]);
var FEEDBACK_STOP_PREFIXES = [
  "\u0440\u0443\u043A\u043E\u0432\u043E\u0434",
  "\u043D\u0430\u0447\u0430\u043B\u044C\u043D",
  "\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440",
  "\u0437\u0430\u043C\u0435\u0441\u0442\u0438\u0442",
  "\u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A",
  "\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442",
  "\u0433\u043B\u0430\u0432\u043D\u044B\u0439",
  "\u0432\u0435\u0434\u0443\u0449\u0438\u0439",
  "\u0441\u0442\u0430\u0440\u0448\u0438\u0439",
  "\u043C\u043B\u0430\u0434\u0448\u0438\u0439",
  "\u043A\u043E\u043C\u043F\u0430\u043D\u0438",
  "\u0433\u0440\u0443\u043F\u043F",
  "\u043E\u0442\u0434\u0435\u043B",
  "\u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D",
  "\u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442"
];
function isFeedbackStopWord(w) {
  if (FEEDBACK_STOP_EXACT.has(w)) return true;
  return FEEDBACK_STOP_PREFIXES.some((p) => w.startsWith(p));
}
var ALLOWED_SHORT = /* @__PURE__ */ new Set(["ai", "\u0438\u0438", "bi", "hr", "qa", "crm", "erp", "bpm", "it", "\u0438\u0442", "ml", "api", "sql", "edi", "rag", "mcp", "ocr", "esb", "\u0446\u0431"]);
function extractWords(text) {
  const out = /* @__PURE__ */ new Set();
  const tokens = (text || "").toLowerCase().replace(/ё/g, "\u0435").match(/[a-zа-я0-9+.#-]{2,}/g) || [];
  for (const raw of tokens) {
    const w = raw.replace(/^[+\-#.]+|[+\-#.]+$/g, "");
    if (!w) continue;
    if ((w.length >= 4 || /\d/.test(w) || ALLOWED_SHORT.has(w)) && !isFeedbackStopWord(w)) out.add(w);
  }
  return [...out];
}
function extractSkillsWords(details) {
  const m = (details || "").match(/Ключевые навыки:\n([\s\S]*?)(\n\n|$)/);
  return m ? extractWords(m[1]) : [];
}
function extractWordsFromVacancy(title, details) {
  return uniq([...extractWords(title), ...extractSkillsWords(details)]);
}
function profileScore(words, profile) {
  const p = profile || CONFIG.profile;
  const matched = { roles: [], tech: [], domains: [] };
  for (const w of words) {
    if (p.roles.some((r) => w.startsWith(r))) {
      matched.roles.push(w);
      continue;
    }
    if (p.tech.some((r) => w.startsWith(r))) {
      matched.tech.push(w);
      continue;
    }
    if (p.domains.some((r) => w.startsWith(r))) {
      matched.domains.push(w);
    }
  }
  const bonus = matched.roles.length * 2 + matched.tech.length + matched.domains.length * 0.5;
  return { bonus, matched, protected: matched.roles.length > 0 || bonus >= 2.5 };
}
function scoreVacancy(c, weights, profile) {
  const details = c.details || "";
  const titleWords = extractWords(c.title);
  const skillsWords = details ? extractSkillsWords(details) : [];
  const namedSet = /* @__PURE__ */ new Set([...titleWords, ...skillsWords]);
  const bodyWords = details ? extractWords(details).filter((w) => !namedSet.has(w)) : [];
  const prof = profileScore([...titleWords, ...skillsWords, ...bodyWords], profile);
  c.profile = prof.matched;
  let sum = prof.bonus, counted = prof.matched.roles.length + prof.matched.tech.length + prof.matched.domains.length;
  for (const w of titleWords) {
    const wt = weights[w] || 0;
    if (wt !== 0) {
      sum += wt;
      counted++;
    }
  }
  for (const w of skillsWords) {
    const wt = weights[w] || 0;
    if (wt !== 0) {
      sum += wt;
      counted++;
    }
  }
  for (const w of bodyWords) {
    const wt = weights[w] || 0;
    if (Math.abs(wt) >= 2) {
      sum += wt * 0.5;
      counted++;
    }
  }
  if (!details) {
    const skip2 = !prof.protected && counted >= CONFIG.titleMinWeightedWords && sum <= CONFIG.negativeScoreToSkip;
    return { skip: skip2, sum, counted };
  }
  const skip = !prof.protected && counted >= CONFIG.minWeightedWords && sum <= CONFIG.negativeScoreToSkip;
  return { skip, sum, counted };
}

// src/telegram.js
async function tgFetch(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return await res.json();
}
function feedbackKeyboard(id, v) {
  v = v || 0;
  return { inline_keyboard: [[
    { text: v === -1 ? "\u{1F44E} \u2705" : "\u{1F44E}", callback_data: "fb:down:" + id },
    { text: v === 1 ? "\u{1F44D} \u2705" : "\u{1F44D}", callback_data: "fb:up:" + id }
  ]] };
}
async function sendTelegram(env, texts) {
  const list = typeof texts === "string" ? [texts] : texts;
  const chatId = Number(env.TELEGRAM_CHAT_ID);
  const sentIds = [];
  for (let i = 0; i < list.length; i++) {
    if (i > 0) await sleep(400);
    const t = typeof list[i] === "string" ? { text: list[i] } : list[i];
    const body = { chat_id: chatId, text: t.text, disable_web_page_preview: true };
    if (t.vacancyId) body.reply_markup = feedbackKeyboard(t.vacancyId);
    let ok = false, lastError = "";
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      if (attempt > 0) await sleep(3e3);
      const data = await tgFetch(env, "sendMessage", body);
      if (data.ok) {
        ok = true;
        break;
      }
      lastError = data.description || "HTTP " + data.error_code;
      const retryable = data.error_code === 429 || data.error_code >= 500;
      if (data.error_code === 429) await sleep((data.parameters?.retry_after || 3) * 1e3);
      else if (!retryable) break;
    }
    if (ok) {
      if (t.vacancyId) sentIds.push(t.vacancyId);
    } else {
      console.error("sendMessage failed: " + lastError + " | text: " + String(t.text).slice(0, 60));
    }
  }
  console.log(`Telegram: \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u2014 ${sentIds.length} \u0438\u0437 ${list.length}`);
  return { sentIds };
}
async function sendTelegramTo(env, chatId, texts) {
  const list = typeof texts === "string" ? [texts] : texts;
  for (let i = 0; i < list.length; i++) {
    if (i > 0) await sleep(400);
    const t = typeof list[i] === "string" ? { text: list[i] } : list[i];
    const body = { chat_id: chatId, text: t.text, disable_web_page_preview: true };
    if (t.vacancyId) body.reply_markup = feedbackKeyboard(t.vacancyId);
    const data = await tgFetch(env, "sendMessage", body);
    if (!data.ok) throw new Error("Telegram API: " + (data.description || "send error"));
  }
}
async function answerCallbackQuery(env, callbackId, text) {
  try {
    await tgFetch(env, "answerCallbackQuery", { callback_query_id: callbackId, text });
  } catch {
  }
}
async function markReactionOnMessage(env, chatId, messageId, vacancyId, vote) {
  try {
    await tgFetch(env, "editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: feedbackKeyboard(vacancyId, vote)
    });
  } catch (e) {
    console.error("markReaction error: " + e.message);
  }
}
function splitText(text, limit = 3800) {
  if (text.length <= limit) return [text];
  const parts = [];
  let cur = "";
  for (const para of text.split("\n")) {
    let p = para;
    while (p.length > limit) {
      parts.push(p.slice(0, limit));
      p = p.slice(limit);
    }
    if (cur.length + p.length + 1 > limit) {
      parts.push(cur);
      cur = p;
    } else cur = cur ? cur + "\n" + p : p;
  }
  if (cur) parts.push(cur);
  return parts;
}
function formatMessages(fresh) {
  const header = `hh.ru: \u043D\u043E\u0432\u044B\u0445 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0439 \u2014 ${fresh.length} (${fmtMSK.format(Date.now())})`;
  const sorted = fresh.sort((a, b) => a.search.localeCompare(b.search));
  const msgs = [{ text: header }];
  for (const v of sorted) {
    const text = v.details ? v.link + "\n\n" + v.details : v.link;
    for (const part of splitText(text)) msgs.push({ text: part, vacancyId: v.id });
  }
  return msgs;
}

// src/notifier.js
async function runNotifier(env) {
  const state = await loadState(env);
  const profile = await getActiveProfile(env);
  const repliedSet = new Set(CONFIG.repliedIds);
  const cutoff = Date.now() - CONFIG.maxAgeHours * 3600 * 1e3;
  const candidates = [];
  const log = [];
  const rssFailures = [];
  for (const task of buildTasks(profile.searches)) {
    try {
      const res = await fetch(task.url, { headers: { "User-Agent": CONFIG.userAgent } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const items = parseItems(await res.text());
      const st = { dup: 0, old: 0, excluded: 0, notLead: 0, cand: 0 };
      for (const it of items) {
        if (!it.id) continue;
        if (state.seen[it.id] || repliedSet.has(it.id)) {
          st.dup++;
          continue;
        }
        if (it.pub < cutoff) {
          st.old++;
          continue;
        }
        if (matchesAny(it.title, CONFIG.excludeKeywords)) {
          st.excluded++;
          continue;
        }
        if (task.isCompany && !matchesAny(it.title, CONFIG.leadershipKeywords)) {
          st.notLead++;
          continue;
        }
        candidates.push({ ...it, search: task.name });
        state.seen[it.id] = (/* @__PURE__ */ new Date()).toISOString();
        st.cand++;
      }
      log.push(`[${task.name}] \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E ${items.length}: \u0443\u0436\u0435 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ${st.dup}, \u0443\u0441\u0442\u0430\u0440\u0435\u043B\u043E ${st.old}, \u043E\u0442\u0441\u0435\u044F\u043D\u043E \u0441\u0442\u043E\u043F-\u0441\u043B\u043E\u0432\u043E\u043C ${st.excluded}, \u043D\u0435-\u0440\u0443\u043A\u043E\u0432\u043E\u0434\u044F\u0449\u0438\u0445 ${st.notLead}, \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432 ${st.cand}`);
    } catch (e) {
      log.push(`[${task.name}] \u041E\u0428\u0418\u0411\u041A\u0410: ${e.message}`);
      rssFailures.push(`${task.name} (${e.message})`);
    }
    await sleep(1500);
  }
  const hadRssFailures = rssFailures.length > 0;
  if (hadRssFailures && !state.rssAlerted) {
    try {
      await sendTelegram(env, [
        "\u26A0\uFE0F hh-notifier: \u043E\u0448\u0438\u0431\u043A\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 RSS:\n" + rssFailures.join("\n") + "\n\n\u0415\u0441\u043B\u0438 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 403), hh.ru \u043C\u043E\u0433 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F \u0441 \u0430\u0434\u0440\u0435\u0441\u043E\u0432 Cloudflare. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043B\u043E\u0433: /run \u0438\u043B\u0438 dashboard."
      ]);
    } catch {
    }
  }
  state.rssAlerted = hadRssFailures;
  pruneSeen(state);
  const allowApi = Date.parse(state.apiDisabledUntil || 0) < Date.now();
  const descFailures = await enrichCandidates(candidates, state, allowApi, log);
  const descAlert = descFailures >= 2;
  if (descAlert && !state.descAlerted) {
    try {
      await sendTelegram(env, ["\u26A0\uFE0F hh-notifier: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F " + descFailures + " \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0439 \u2014 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u0430 \u043A\u0430\u043F\u0447\u0430/\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F hh.ru. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 /run \u0438\u043B\u0438 dashboard."]);
    } catch {
    }
  }
  state.descAlerted = descAlert;
  const fresh = [];
  let hiddenByScore = 0;
  for (const c of candidates) {
    const scored = scoreVacancy(c, state.wordWeights || {}, profile);
    if (scored.skip) {
      hiddenByScore++;
      state.autoSkippedCount = (state.autoSkippedCount || 0) + 1;
      state.autoSkippedLog = [...state.autoSkippedLog || [], { t: (/* @__PURE__ */ new Date()).toISOString(), title: c.title, score: scored.sum }].slice(-5);
      continue;
    }
    fresh.push({ ...c });
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  for (const v of fresh) {
    state.vacWords[v.id] = { w: extractWordsFromVacancy(v.title, v.details || ""), s: v.search, t: nowIso };
  }
  pruneFeedbackData(state);
  await saveState(env, state);
  log.push(`\u0421\u043A\u043E\u0440\u0438\u043D\u0433: \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432 ${candidates.length}, \u0441\u043A\u0440\u044B\u0442\u043E \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u043E\u043C ${hiddenByScore}, \u043A \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435 ${fresh.length}, \u0441\u0431\u043E\u0435\u0432 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0439 ${descFailures}`);
  console.log(log.join("\n"));
  if (fresh.length === 0) {
    console.log("\u041D\u043E\u0432\u044B\u0445 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0439 \u043D\u0435\u0442 \u2014 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F");
    return { fresh: 0, sent: 0, failed: 0 };
  }
  const { sentIds } = await sendTelegram(env, formatMessages(fresh));
  const sentSet = new Set(sentIds);
  let failed = 0;
  for (const v of fresh) {
    if (!sentSet.has(v.id)) {
      delete state.seen[v.id];
      delete state.vacWords[v.id];
      failed++;
    }
  }
  if (failed > 0) {
    log.push(`\u26A0\uFE0F \u041D\u0435 \u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0439: ${failed} \u2014 \u0432\u0435\u0440\u043D\u0443\u0442\u0441\u044F \u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C \u043F\u0440\u043E\u0433\u043E\u043D\u0435`);
    console.error("\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0438 \u0432\u0435\u0440\u043D\u0443\u0442\u0441\u044F: " + failed);
  }
  await saveState(env, state);
  return { fresh: fresh.length, sent: sentIds.length, failed };
}

// src/learn.js
async function handleFeedback(env, cq) {
  try {
    const dir = cq.data.startsWith("fb:up:") ? 1 : cq.data.startsWith("fb:down:") ? -1 : 0;
    const id = cq.data.split(":")[2];
    if (!dir || !id) {
      await answerCallbackQuery(env, cq.id, "\u041D\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043E");
      return;
    }
    const state = await loadState(env);
    const entry = (state.vacWords || {})[id];
    const prev = (state.feedback || {})[id]?.v || 0;
    const next = prev === dir ? 0 : dir;
    const delta = next - prev;
    const words = entry ? entry.w : [];
    state.wordWeights = state.wordWeights || {};
    for (const w of words) {
      state.wordWeights[w] = Math.max(-CONFIG.wordWeightCap, Math.min(CONFIG.wordWeightCap, (state.wordWeights[w] || 0) + delta));
    }
    state.feedback = state.feedback || {};
    state.feedback[id] = { v: next, t: (/* @__PURE__ */ new Date()).toISOString(), s: entry ? entry.s : "" };
    pruneFeedbackData(state);
    await saveState(env, state);
    const answers = {
      "1": "\u0423\u0447\u0442\u0435\u043D\u043E: \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0432\u044B\u0441\u043E\u043A\u043E\u0439 \u0440\u0435\u043B\u0435\u0432\u0430\u043D\u0442\u043D\u043E\u0441\u0442\u0438 (\u{1F44D})",
      "0": "\u0423\u0447\u0442\u0435\u043D\u043E: \u0440\u0435\u0430\u043A\u0446\u0438\u044F \u0441\u043D\u044F\u0442\u0430 \u2014 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u0430\u044F",
      "-1": "\u0423\u0447\u0442\u0435\u043D\u043E: \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u043D\u0438\u0437\u043A\u043E\u0439 \u0440\u0435\u043B\u0435\u0432\u0430\u043D\u0442\u043D\u043E\u0441\u0442\u0438 (\u{1F44E})"
    };
    await answerCallbackQuery(env, cq.id, answers[String(next)]);
    await markReactionOnMessage(env, cq.message.chat.id, cq.message.message_id, id, next);
  } catch (e) {
    console.error("feedback error: " + e.message);
  }
}
async function formatStats(env) {
  const state = await loadState(env);
  const L = ["\u{1F4CA} \u0420\u0435\u0430\u043A\u0446\u0438\u0438 \u0438 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u0430:"];
  const fbList = Object.values(state.feedback || {});
  const high = fbList.filter((f) => f.v === 1).length;
  const low = fbList.filter((f) => f.v === -1).length;
  L.push(`\u041E\u0446\u0435\u043D\u0435\u043D\u043E \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0439: ${fbList.length} \u2014 \u0432\u044B\u0441\u043E\u043A\u0430\u044F ${high}, \u043D\u0438\u0437\u043A\u0430\u044F ${low}, \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u0430\u044F ${fbList.length - high - low}`);
  const entries = Object.entries(state.wordWeights || {});
  const neg = entries.filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]).slice(0, 10);
  const pos = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (neg.length) L.push("\n\u0422\u043E\u043F \u043D\u0435\u0433\u0430\u0442\u0438\u0432\u043D\u044B\u0445 \u0441\u043B\u043E\u0432:\n" + neg.map(([w, v]) => `\u2022 ${w} (${v})`).join("\n"));
  if (pos.length) L.push("\n\u0422\u043E\u043F \u043F\u043E\u0437\u0438\u0442\u0438\u0432\u043D\u044B\u0445 \u0441\u043B\u043E\u0432:\n" + pos.map(([w, v]) => `\u2022 ${w} (+${v})`).join("\n"));
  if (!neg.length && !pos.length) L.push("\n\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0440\u0435\u0430\u043A\u0446\u0438\u0439 \u2014 \u043F\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u{1F44D}/\u{1F44E} \u043F\u043E\u0434 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F\u043C\u0438 \u0438\u0437 \u0434\u0430\u0439\u0434\u0436\u0435\u0441\u0442\u0430.");
  L.push(`
\u0410\u0432\u0442\u043E-\u0441\u043A\u0440\u044B\u0442\u043E \u043F\u043E \u043D\u0435\u0433\u0430\u0442\u0438\u0432\u043D\u043E\u043C\u0443 \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u0443: ${state.autoSkippedCount || 0}`);
  if (state.autoSkippedLog && state.autoSkippedLog.length) {
    L.push("\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0441\u043A\u0440\u044B\u0442\u044B\u0435:\n" + state.autoSkippedLog.map((x) => `\u2022 ${x.title} (${x.score})`).join("\n"));
  }
  const downBySearch = {};
  for (const f of fbList) {
    if (f.v === -1 && f.s) downBySearch[f.s] = (downBySearch[f.s] || 0) + 1;
  }
  const worst = Object.entries(downBySearch).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (worst.length) L.push("\n\u0411\u043E\u043B\u044C\u0448\u0435 \u0432\u0441\u0435\u0433\u043E \u{1F44E} \u043F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430\u043C: " + worst.map(([s, n]) => `${s} (${n})`).join(", "));
  return L.join("\n");
}

// src/profile.js
var norm = (s) => (s || "").toLowerCase().replace(/ё/g, "\u0435").trim();
function normalizeProfile(raw) {
  const pick = (arr) => uniq((Array.isArray(arr) ? arr : []).map((x) => norm(x).replace(/[^a-zа-я0-9+# -]/g, "").replace(/\s+/g, "")).filter((x) => x.length >= 2)).slice(0, 60);
  return {
    roles: pick(raw?.roles),
    tech: pick(raw?.tech),
    domains: pick(raw?.domains),
    stopWords: uniq((Array.isArray(raw?.stopWords) ? raw.stopWords : []).map(norm).filter(Boolean)).slice(0, 50),
    preferredArea: String(raw?.preferredArea || "").trim(),
    title: norm(raw?.title || ""),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function isProfileComplete(profile) {
  return profile && (profile.roles?.length || profile.tech?.length);
}
function generateSearches(profile) {
  if (!isProfileComplete(profile)) return null;
  const searches = [];
  const area = profile.preferredArea || "1";
  const push = (name, text, ar) => {
    if (text && !searches.some((s) => s.text === text)) searches.push({ name, text, area: ar });
  };
  for (const r of (profile.roles || []).slice(0, 4)) {
    const label = r.replace(/-/g, " ");
    push("\u0420\u043E\u043B\u044C: " + label, r, area);
  }
  const mainRole = (profile.roles || [])[0];
  if (mainRole) push("\u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F", mainRole, area);
  for (const t of (profile.tech || []).slice(0, 2)) {
    const label = t.replace(/-/g, " ");
    push("\u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044F: " + label, t, area);
  }
  if (mainRole) push("\u0420\u043E\u043B\u044C (\u0432\u0441\u044F \u0420\u043E\u0441\u0441\u0438\u044F)", mainRole, "");
  return searches.length ? searches : null;
}

// src/onboard.js
var DRAFT_KEY = "profile_draft";
var PROMPT = (resumeText) => `\u0422\u044B \u2014 \u043A\u0430\u0440\u044C\u0435\u0440\u043D\u044B\u0439 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442. \u041F\u0440\u043E\u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0439 \u0440\u0435\u0437\u044E\u043C\u0435 \u0438 \u0432\u0435\u0440\u043D\u0438 \u0422\u041E\u041B\u042C\u041A\u041E \u0432\u0430\u043B\u0438\u0434\u043D\u044B\u0439 JSON \u0431\u0435\u0437 \u043F\u043E\u044F\u0441\u043D\u0435\u043D\u0438\u0439, \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435:
{"title": "\u0436\u0435\u043B\u0430\u0435\u043C\u0430\u044F \u0440\u043E\u043B\u044C \u043A\u0440\u0430\u0442\u043A\u043E", "roles": ["1-4 \u043A\u043E\u0440\u043D\u044F \u0441\u043B\u043E\u0432 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0440\u043E\u043B\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0438\u0442-\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440, cio, \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C-\u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438"], "tech": ["\u0434\u043E 20 \u043A\u043E\u0440\u043D\u0435\u0439 \u0441\u043B\u043E\u0432 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439 \u0438 \u043F\u0440\u0430\u043A\u0442\u0438\u043A, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: 1\u0441, java, postgres, itil"], "domains": ["\u0434\u043E 10 \u043A\u043E\u0440\u043D\u0435\u0439 \u0441\u043B\u043E\u0432 \u043E\u0442\u0440\u0430\u0441\u043B\u0435\u0439 \u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u0435\u0439 \u0443\u0447\u0451\u0442\u0430, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0444\u0438\u043D\u0430\u043D\u0441, \u0431\u0430\u043D\u043A, \u043B\u043E\u0433\u0438\u0441\u0442\u0438\u043A"], "stopWords": ["\u0441\u043B\u043E\u0432\u0430, \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0438 \u0441 \u043A\u043E\u0442\u043E\u0440\u044B\u043C\u0438 \u0442\u043E\u0447\u043D\u043E \u043D\u0435 \u043D\u0443\u0436\u043D\u044B"], "preferredArea": "id \u0433\u043E\u0440\u043E\u0434\u0430 hh.ru (1 = \u041C\u043E\u0441\u043A\u0432\u0430) \u0438\u043B\u0438 \u043F\u0443\u0441\u0442\u043E"}
\u041A\u043E\u0440\u0435\u043D\u044C \u0441\u043B\u043E\u0432\u0430 \u2014 \u0431\u0435\u0437 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u0439, \u0447\u0442\u043E\u0431\u044B \u043B\u043E\u0432\u0438\u0442\u044C \u0432\u0441\u0435 \u043F\u0430\u0434\u0435\u0436\u0438 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \xAB\u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\xBB \u043B\u043E\u0432\u0438\u0442 \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F/\u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438/\u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0445). \u041B\u0430\u0442\u0438\u043D\u0438\u0446\u0443 \u0438 \u043A\u0438\u0440\u0438\u043B\u043B\u0438\u0446\u0443 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0439 \u043A\u0430\u043A \u0432 \u0440\u0435\u0437\u044E\u043C\u0435. \u0420\u0435\u0437\u044E\u043C\u0435:
${resumeText}`;
async function extractProfileFromResume(env, resumeText) {
  const clipped = resumeText.slice(0, 12e3);
  const out = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
    messages: [{ role: "user", content: PROMPT(clipped) }],
    max_tokens: 1200
  });
  const text = out.response || out.result?.response || "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("\u0418\u0418 \u043D\u0435 \u0432\u0435\u0440\u043D\u0443\u043B JSON");
  const profile = normalizeProfile(JSON.parse(m[0]));
  if (!isProfileComplete(profile)) throw new Error("\u0418\u0418 \u043D\u0435 \u043D\u0430\u0448\u0451\u043B \u0440\u043E\u043B\u044C \u0438\u043B\u0438 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438 \u0432 \u0440\u0435\u0437\u044E\u043C\u0435");
  profile.searches = generateSearches(profile) || [];
  return profile;
}
async function handleResume(env, chatId, text) {
  let draft;
  try {
    draft = await extractProfileFromResume(env, text);
  } catch (e) {
    await sendTelegramTo(env, chatId, [
      "\u26A0\uFE0F \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0438\u0437\u0432\u043B\u0435\u0447\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C: " + e.message + "\n\n\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437 (/resume + \u0442\u0435\u043A\u0441\u0442 \u0440\u0435\u0437\u044E\u043C\u0435) \u0438\u043B\u0438 \u043F\u0440\u0438\u0448\u043B\u0438\u0442\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435:\n\u0440\u043E\u043B\u044C: CIO, \u0418\u0422-\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440\n\u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438: 1\u0441, java, postgres\n\u0434\u043E\u043C\u0435\u043D\u044B: \u0444\u0438\u043D\u0430\u043D\u0441, \u0431\u0430\u043D\u043A\n\u0433\u043E\u0440\u043E\u0434: \u041C\u043E\u0441\u043A\u0432\u0430"
    ]);
    return;
  }
  await env.STATE.put(DRAFT_KEY, JSON.stringify(draft));
  await sendTelegramTo(env, chatId, [
    `\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u0438\u0437 \u0440\u0435\u0437\u044E\u043C\u0435 (\u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A):
\u2022 \u0420\u043E\u043B\u044C: ${draft.title || "\u2014"}
\u2022 \u0420\u043E\u043B\u0438 (${draft.roles.length}): ${draft.roles.join(", ") || "\u2014"}
\u2022 \u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438 (${draft.tech.length}): ${draft.tech.join(", ") || "\u2014"}
\u2022 \u0414\u043E\u043C\u0435\u043D\u044B (${draft.domains.length}): ${draft.domains.join(", ") || "\u2014"}
\u2022 \u0413\u043E\u0440\u043E\u0434: ${draft.preferredArea === "1" ? "\u041C\u043E\u0441\u043A\u0432\u0430" : draft.preferredArea || "\u0432\u0441\u044F \u0420\u043E\u0441\u0441\u0438\u044F"}

\u041F\u043E\u0438\u0441\u043A\u043E\u0432\u044B\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B:
` + draft.searches.map((s) => `\u2022 ${s.name}${s.area ? "" : " (\u0432\u0441\u044F \u0420\u043E\u0441\u0441\u0438\u044F)"}`).join("\n") + "\n\n/confirm-profile \u2014 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438 \u043D\u0430\u0447\u0430\u0442\u044C \u043F\u043E\u0438\u0441\u043A\n/regenerate \u2014 \u0438\u0437\u0432\u043B\u0435\u0447\u044C \u0437\u0430\u043D\u043E\u0432\u043E"
  ]);
}
async function confirmProfile(env, chatId) {
  const raw = await env.STATE.get(DRAFT_KEY, "json");
  if (!raw) {
    await sendTelegramTo(env, chatId, ["\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u043F\u0440\u043E\u0444\u0438\u043B\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u041F\u0440\u0438\u0448\u043B\u0438\u0442\u0435 \u0440\u0435\u0437\u044E\u043C\u0435: /resume + \u0442\u0435\u043A\u0441\u0442."]);
    return;
  }
  await saveProfile(env, raw);
  await env.STATE.delete(DRAFT_KEY);
  await sendTelegramTo(env, chatId, [
    "\u2705 \u041F\u0440\u043E\u0444\u0438\u043B\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D. \u0414\u0430\u0439\u0434\u0436\u0435\u0441\u0442\u044B \u043F\u043E\u0439\u0434\u0443\u0442 \u043F\u043E \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044E (\u043A\u0430\u0436\u0434\u044B\u0439 \u0447\u0430\u0441 07:00\u201321:00 \u041C\u0421\u041A) \u043F\u043E\u0434 \u0432\u0430\u0448\u0443 \u0440\u043E\u043B\u044C.",
    "/run \u2014 \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u043F\u0435\u0440\u0432\u044B\u0439 \u043F\u0440\u043E\u0433\u043E\u043D \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441. \u0420\u0435\u0430\u0433\u0438\u0440\u0443\u0439\u0442\u0435 \u{1F44D}/\u{1F44E} \u043F\u043E\u0434 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F\u043C\u0438 \u2014 \u0444\u0438\u043B\u044C\u0442\u0440 \u0431\u0443\u0434\u0435\u0442 \u043E\u0431\u0443\u0447\u0430\u0442\u044C\u0441\u044F."
  ]);
}
async function hasProfile(env) {
  const p = await loadProfile(env);
  return !!(p && p.roles);
}
function onboardingText() {
  return [
    "\u{1F44B} \u042D\u0442\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0431\u043E\u0442 \u043F\u043E\u0438\u0441\u043A\u0430 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0439 \u043D\u0430 hh.ru.",
    "\u0427\u0442\u043E\u0431\u044B \u043E\u043D \u0438\u0441\u043A\u0430\u043B \u0440\u0430\u0431\u043E\u0442\u0443 \u043F\u043E\u0434 \u0432\u0430\u0441, \u043D\u0443\u0436\u0435\u043D \u0432\u0430\u0448 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u2014 \u043E\u043D \u0438\u0437\u0432\u043B\u0435\u043A\u0430\u0435\u0442\u0441\u044F \u0438\u0437 \u0440\u0435\u0437\u044E\u043C\u0435.",
    "",
    "\u041F\u0440\u0438\u0448\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0440\u0435\u0437\u044E\u043C\u0435: \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0435\u0433\u043E \u0438\u0437 hh.ru (\xAB\u041E\u0442\u043A\u043B\u0438\u043A\u0438 \u0438 \u0440\u0435\u0437\u044E\u043C\u0435\xBB \u2192 \u0432\u0430\u0448 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u2192 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u2192 \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u0432\u0441\u0451) \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u043C \u0438\u043B\u0438 \u0444\u0430\u0439\u043B\u043E\u043C .txt. \u041C\u043E\u0436\u043D\u043E \u0447\u0430\u0441\u0442\u044F\u043C\u0438 \u2014 \u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u0437\u0434\u0435\u043B\u044B \xAB\u0416\u0435\u043B\u0430\u0435\u043C\u0430\u044F \u0434\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C\xBB, \xAB\u041E\u043F\u044B\u0442\xBB, \xAB\u041D\u0430\u0432\u044B\u043A\u0438\xBB.",
    "",
    "\u0417\u0430\u0442\u0435\u043C \u0431\u043E\u0442 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0418\u0418 \u0441\u043E\u0431\u0435\u0440\u0451\u0442 \u043F\u0440\u043E\u0444\u0438\u043B\u044C (\u0440\u043E\u043B\u044C, \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438, \u0434\u043E\u043C\u0435\u043D\u044B) \u0438 \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0435\u0442 \u043F\u043E\u0438\u0441\u043A\u043E\u0432\u044B\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B. \u041F\u043E\u0441\u043B\u0435 /confirm-profile \u043D\u0430\u0447\u043D\u0443\u0442 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442\u044C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u0439\u0434\u0436\u0435\u0441\u0442\u044B."
  ].join("\n");
}

// src/index.js
var index_default = {
  // запуск по расписанию (cron в wrangler.toml)
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runNotifier(env).catch((e) => console.error("FATAL: " + e.message)));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      await runNotifier(env);
      return new Response("OK: \u043F\u0440\u043E\u0433\u043E\u043D \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D (\u043B\u043E\u0433 \u2014 dashboard Logs \u0438\u043B\u0438 wrangler tail)");
    }
    if (url.pathname === "/test") {
      await sendTelegramTo(env, env.TELEGRAM_CHAT_ID, ["\u2705 \u0422\u0435\u0441\u0442 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438: hh-notifier \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0438\u0437 Cloudflare Workers. \u041D\u043E\u0432\u044B\u0435 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0438 \u0431\u0443\u0434\u0443\u0442 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442\u044C \u0441\u044E\u0434\u0430."]);
      return new Response("OK: \u0442\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0432 Telegram");
    }
    if (url.pathname === "/diag" && env.TELEGRAM_WEBHOOK_SECRET && url.searchParams.get("key") === env.TELEGRAM_WEBHOOK_SECRET) {
      const [hookRes, profile, state] = await Promise.all([
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`).then((r) => r.json()),
        loadProfile(env),
        loadState(env)
      ]);
      const data = {
        webhook: hookRes.result,
        profile: profile ? { title: profile.title || "", roles: profile.roles?.length || 0, searches: profile.searches?.length || 0 } : null,
        state: { seen: Object.keys(state.seen).length, weights: Object.keys(state.wordWeights || {}).length, feedback: Object.keys(state.feedback || {}).length }
      };
      return new Response(JSON.stringify(data, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/setup" && env.TELEGRAM_WEBHOOK_SECRET && url.searchParams.get("key") === env.TELEGRAM_WEBHOOK_SECRET) {
      const hookUrl = url.origin + "/tg/" + env.TELEGRAM_WEBHOOK_SECRET;
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: hookUrl, allowed_updates: ["message", "callback_query"], drop_pending_updates: true })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: data.ok ? 200 : 500, headers: { "Content-Type": "application/json" } });
    }
    if (env.TELEGRAM_WEBHOOK_SECRET && url.pathname === "/tg/" + env.TELEGRAM_WEBHOOK_SECRET) {
      let update;
      try {
        update = await request.json();
      } catch {
        return new Response("bad json", { status: 400 });
      }
      if (update.callback_query) {
        const cq = update.callback_query;
        console.log("callback_query: " + cq.data + " \u043E\u0442 \u0447\u0430\u0442\u0430 " + cq.message?.chat?.id);
        if (String(cq.message?.chat?.id) === String(env.TELEGRAM_CHAT_ID)) {
          await handleFeedback(env, cq);
        }
        return new Response("OK");
      }
      const msg = update.message;
      if (msg && (msg.text || msg.document) && String(msg.chat.id) === String(env.TELEGRAM_CHAT_ID)) {
        const text = (msg.text || "").trim();
        const cmd = msg.text ? text.toLowerCase().split("@")[0].split(/\s+/)[0] : "";
        if (msg.document && /\.txt$/i.test(msg.document.file_name || "") && /^\/resume/.test((msg.caption || "").toLowerCase())) {
          ctx.waitUntil(handleResumeFile(env, msg.chat.id, msg.document.file_id).catch(() => {
          }));
          return new Response("OK");
        }
        if (cmd === "/resume" || !msg.text) {
          const resumeText = text.replace(/^\/resume\s*/i, "");
          if (resumeText.length < 200) {
            ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ["\u041F\u0440\u0438\u0448\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0440\u0435\u0437\u044E\u043C\u0435 \u043F\u043E\u0441\u043B\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B /resume (\u0438\u043B\u0438 \u0444\u0430\u0439\u043B\u043E\u043C .txt \u0441 \u043F\u043E\u0434\u043F\u0438\u0441\u044C\u044E /resume). \u041D\u0443\u0436\u043D\u043E \u0445\u043E\u0442\u044F \u0431\u044B \u0440\u0430\u0437\u0434\u0435\u043B\u044B \xAB\u0416\u0435\u043B\u0430\u0435\u043C\u0430\u044F \u0434\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C\xBB, \xAB\u041E\u043F\u044B\u0442\xBB \u0438 \xAB\u041D\u0430\u0432\u044B\u043A\u0438\xBB."]).catch(() => {
            }));
          } else {
            ctx.waitUntil(handleResume(env, msg.chat.id, resumeText).catch((e) => sendTelegramTo(env, msg.chat.id, ["\u26A0\uFE0F " + e.message]).catch(() => {
            })));
          }
        } else if (cmd === "/confirm-profile") {
          ctx.waitUntil(confirmProfile(env, msg.chat.id).catch(() => {
          }));
        } else if (cmd === "/run") {
          await handleRunCommand(env, msg.chat.id);
        } else if (cmd === "/test") {
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ["\u2705 \u0422\u0435\u0441\u0442 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438: \u0441\u0432\u044F\u0437\u044C \u0432\u043E\u0440\u043A\u0435\u0440 \u2192 Telegram \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442."]).catch(() => {
          }));
        } else if (cmd === "/stats") {
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, [await formatStats(env)]).catch(() => {
          }));
        } else if (cmd === "/help" || cmd === "/start") {
          const onboarded = await hasProfile(env);
          ctx.waitUntil(sendTelegramTo(env, msg.chat.id, onboarded ? helpText() : [helpText(), "", onboardingText()].join("\n\n")).catch(() => {
          }));
        } else {
          const ids = [...new Set((msg.text.match(/hh\.ru\/vacancy\/(\d+)/gi) || []).map((s) => s.match(/(\d+)$/)[1]))];
          if (ids.length) {
            await handleVacancyLookup(env, msg.chat.id, ids);
          } else {
            ctx.waitUntil(sendTelegramTo(env, msg.chat.id, ["\u041D\u0435 \u0437\u043D\u0430\u044E \u0442\u0430\u043A\u0443\u044E \u043A\u043E\u043C\u0430\u043D\u0434\u0443. \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E: /run, /test, /stats, /help. \u041C\u043E\u0436\u043D\u043E \u043F\u0440\u0438\u0441\u043B\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044E hh.ru \u2014 \u043F\u0440\u0438\u0448\u043B\u044E \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435."]).catch(() => {
            }));
          }
        }
      }
      return new Response("OK");
    }
    return new Response("hh-notifier worker. GET /run \u2014 \u043F\u0440\u043E\u0433\u043E\u043D, GET /test \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 Telegram.");
  }
};
function helpText() {
  return [
    "\u041A\u043E\u043C\u0430\u043D\u0434\u044B hh-notifier:",
    "/run \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C hh.ru \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441 (\u043F\u0440\u0438\u0448\u043B\u044E \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0438, \u0435\u0441\u043B\u0438 \u043F\u043E\u044F\u0432\u0438\u043B\u0438\u0441\u044C \u043D\u043E\u0432\u044B\u0435)",
    "/test \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0443 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439",
    "/stats \u2014 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0432\u0430\u0448\u0438\u0445 \u0440\u0435\u0430\u043A\u0446\u0438\u0439 \u0438 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F \u0444\u0438\u043B\u044C\u0442\u0440\u0430",
    "/resume <\u0442\u0435\u043A\u0441\u0442 \u0438\u043B\u0438 \u0444\u0430\u0439\u043B .txt> \u2014 \u0438\u0437\u0432\u043B\u0435\u0447\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0438\u0437 \u0440\u0435\u0437\u044E\u043C\u0435 \u0438 \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0438\u0441\u043A \u0437\u0430\u043D\u043E\u0432\u043E",
    "/confirm-profile \u2014 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u043F\u0440\u043E\u0444\u0438\u043B\u044F",
    "/help \u2014 \u044D\u0442\u0430 \u0441\u043F\u0440\u0430\u0432\u043A\u0430",
    "",
    "\u041F\u043E\u0434 \u043A\u0430\u0436\u0434\u044B\u043C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u043C \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0438 \u2014 \u043A\u043D\u043E\u043F\u043A\u0438 \u{1F44D}/\u{1F44E}: \u0432\u044B\u0441\u043E\u043A\u043E/\u043D\u0438\u0437\u043A\u043E \u0440\u0435\u043B\u0435\u0432\u0430\u043D\u0442\u043D\u0430\u044F. \u{1F44E} \u0443\u0447\u0438\u0442 \u0444\u0438\u043B\u044C\u0442\u0440 \u0441\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u043F\u043E\u0445\u043E\u0436\u0438\u0435 (\u043A\u043E\u043D\u0441\u0435\u0440\u0432\u0430\u0442\u0438\u0432\u043D\u043E), \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0435 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u2014 \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u043E.",
    "\u041F\u0440\u0438\u0448\u043B\u0438\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044E hh.ru (\u043C\u043E\u0436\u043D\u043E \u0441 \u043B\u044E\u0431\u044B\u043C \xAB\u0445\u0432\u043E\u0441\u0442\u043E\u043C\xBB \u043F\u043E\u0441\u043B\u0435 \u0446\u0438\u0444\u0440 \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0441\u043B\u0430\u0442\u044C \u0448\u0430\u0440\u0438\u043D\u0433) \u2014 \u043F\u0440\u0438\u0448\u043B\u044E \u043E\u0447\u0438\u0449\u0435\u043D\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435; \u0442\u0430\u043A\u0430\u044F \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u043F\u043E\u043C\u0435\u0447\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u043E\u0439 \u0438 \u0432 \u0434\u0430\u0439\u0434\u0436\u0435\u0441\u0442 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043F\u043E\u043F\u0430\u0434\u0430\u0435\u0442."
  ].join("\n");
}
async function handleResumeFile(env, chatId, fileId) {
  try {
    const meta = await (await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`)).json();
    if (!meta.ok) throw new Error("\u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0444\u0430\u0439\u043B: " + (meta.description || ""));
    const content = await (await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${meta.result.file_path}`)).text();
    await handleResume(env, chatId, content);
  } catch (e) {
    await sendTelegramTo(env, chatId, ["\u26A0\uFE0F " + e.message]).catch(() => {
    });
  }
}
async function handleRunCommand(env, chatId) {
  try {
    await sendTelegramTo(env, chatId, ["\u23F3 \u0417\u0430\u043F\u0443\u0441\u043A\u0430\u044E \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443 hh.ru..."]);
    const result = await runNotifier(env);
    if (result.failed > 0) {
      await sendTelegramTo(env, chatId, [`\u26A0\uFE0F \u0413\u043E\u0442\u043E\u0432\u043E: \u043D\u0430\u0439\u0434\u0435\u043D\u043E ${result.fresh}, \u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E ${result.sent}. \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0435 (${result.failed}) \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0442\u0441\u044F \u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C \u043F\u0440\u043E\u0433\u043E\u043D\u0435.`]);
    } else if (result.sent > 0) {
      await sendTelegramTo(env, chatId, [`\u2705 \u0413\u043E\u0442\u043E\u0432\u043E: \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u043D\u043E\u0432\u044B\u0445 \u2014 ${result.fresh}, \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E.`]);
    } else if (result.fresh === 0) {
      await sendTelegramTo(env, chatId, ["\u2705 \u0413\u043E\u0442\u043E\u0432\u043E: \u043D\u043E\u0432\u044B\u0445 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0439 \u043D\u0435\u0442."]);
    }
  } catch (e) {
    await sendTelegramTo(env, chatId, ["\u26A0\uFE0F \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u043E\u0433\u043E\u043D\u0430: " + e.message]).catch(() => {
    });
  }
}
async function handleVacancyLookup(env, chatId, ids) {
  const state = await loadState(env);
  const nowStamp = (/* @__PURE__ */ new Date()).toISOString();
  for (const id of ids) {
    state.seen[id] = nowStamp;
    try {
      const text = await fetchVacancyText(id, state, true);
      const title = (text.match(/📌\s*(.+)/) || [, ""])[1].trim();
      state.vacWords[id] = { w: extractWordsFromVacancy(title, text), s: "\u0441\u0441\u044B\u043B\u043A\u0430", t: nowStamp };
      for (const part of splitText("https://hh.ru/vacancy/" + id + "\n\n" + text)) {
        await sendTelegramTo(env, chatId, [{ text: part, vacancyId: id }]);
      }
    } catch (e) {
      await sendTelegramTo(env, chatId, ["\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044E: " + e.message]).catch(() => {
      });
    }
    await sleep(800);
  }
  pruneFeedbackData(state);
  await saveState(env, state);
}
export {
  index_default as default
};
