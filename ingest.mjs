// ingest.mjs
// Hibrid import: RSS + Bizdrámagad scraper → Supabase `events`
// - Duplikáció kulcs: normalize(title) | YYYY-MM-DD(start) | normalize(organizer || location)
// - Hash-alapú egyediség: uniqueness_key_hash = sha1(uniqueness_key)
// - Limitálható: { limit, rssLimitPerFeed }

import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const HU_MONTHS = {
  "jan":1,"jan.":1,"januar":1,"január":1,
  "feb":2,"feb.":2,"febr":2,"február":2,
  "marc":3,"mar.":3,"márc":3,"márc.":3,"marcius":3,"március":3,
  "apr":4,"apr.":4,"ápr":4,"ápr.":4,"aprilis":4,"április":4,
  "maj":5,"máj":5,"máj.":5,"majus":5,"május":5,
  "jun":6,"jún":6,"jún.":6,"junius":6,"június":6,
  "jul":7,"júl":7,"júl.":7,"julius":7,"július":7,
  "aug":8,"aug.":8,"augusztus":8,
  "szept":9,"szept.":9,"szeptember":9,
  "okt":10,"okt.":10,"oktober":10,"október":10,
  "nov":11,"nov.":11,"november":11,
  "dec":12,"dec.":12,"december":12
};

// ---------- segéd: abszolút URL ----------
function absUrl(raw, base) {
  try { return new URL(raw, base).toString(); } catch { return null; }
}

function plainText(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}



// ---------- Supabase (lustán) ----------
let _sb = null;
function getSupabase() {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}
// ============ ENRICH/OKOSÍTÁS KEZDETE ============

function pad2(n){return String(n).padStart(2,"0");}
function toISO(y,m,d,hh=12,mm=0){ return new Date(Date.UTC(+y, m-1, +d, +hh, +mm, 0)).toISOString(); }

function inferYearFor(month, today = new Date()){
  const y = today.getUTCFullYear();
  const thisMonth = today.getUTCMonth()+1;
  return (month < thisMonth - 1) ? (y + 1) : y;
}

/** Laza HU dátum: cím/HTML szövegben is eltalálja. */
function parseHuDateRangeLoose(text, today = new Date()){
  if(!text) return null;
  const src = text.toLowerCase().replace(/\u00a0/g," ").replace(/\s+/g," ").trim();

  // 1) 2025. okt. 22 – 26.
  let m = src.match(/(\d{4})\.?\s+([a-záéíóöőúüű\.]+)\s+(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?/i);
  if(m){
    const y = +m[1];
    const mon = HU_MONTHS[(m[2]||"").replace(/\.$/,"")] || null;
    const d1 = +m[3];
    const d2 = m[4] ? +m[4] : null;
    if(mon && d1){
      return { start: toISO(y, mon, d1), end: d2 ? toISO(y, mon, d2) : null };
    }
  }

  // 2) 2025 november 14-16
  m = src.match(/(\d{4})\s+([a-záéíóöőúüű\.]+)\s+(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?/i);
  if(m){
    const y = +m[1];
    const mon = HU_MONTHS[(m[2]||"").replace(/\.$/,"")] || null;
    const d1 = +m[3];
    const d2 = m[4] ? +m[4] : null;
    if(mon && d1){
      return { start: toISO(y, mon, d1), end: d2 ? toISO(y, mon, d2) : null };
    }
  }

  // 3) év nélkül: "október 16–19"
  m = src.match(/([a-záéíóöőúüű\.]+)\s+(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?/i);
  if(m){
    const mon = HU_MONTHS[(m[1]||"").replace(/\.$/,"")] || null;
    const d1 = +m[2], d2 = m[3] ? +m[3] : null;
    if(mon && d1){
      const y = inferYearFor(mon, today);
      return { start: toISO(y, mon, d1), end: d2 ? toISO(y, mon, d2) : null };
    }
  }
  return null;
}

const TG_RULES = [
  { group:"Fiatalok",      rx: /(fiataloknak|fiatal(?:\s|$)|ifjúsági|diák|egyetemista|találkozó fiatal)/i },
  { group:"Jegyesek",      rx: /(jegyes(?:ek|eknek)?|jegyeskurzus|jegyes hétvége)/i },
  { group:"Fiatal házasok",rx: /(fiatal(?:\s|-)h(?:á|a)zas|friss házas)/i },
  { group:"Érett házasok", rx: /(érett(?:\s|-)h(?:á|a)zas|házaspár(?:oknak)?|házaspárok)/i },
  { group:"Tinédzserek",   rx: /(tinédzser|tini|középiskolás|konfirmandus)/i },
  { group:"Családok",      rx: /(család(?:ok|os)|anya-apa-gyerek|apák|anyák)/i },
  { group:"Idősek",        rx: /(időseknek|nyugdíjas|szépkorú)/i },
];

function guessTargetGroup(title="", description="") {
  const t = (title||"") + " " + (description||"");
  for(const r of TG_RULES){ if(r.rx.test(t)) return r.group; }
  return "Mindenki";
}

function pickRegistrationLink({ links=[], baseUrl=null, prefer=null }){
  const isImage = (u) => /\.(gif|png|jpe?g|webp|svg)(\?|$)/i.test(u||"");
  const score = (href="", text="") => {
    let s = 0;
    const H = (href||"").toLowerCase(), T = (text||"").toLowerCase();
    if (/forms\.gle|docs\.google\.com\/forms|form|jelentkez|regisztr|eventbrite|jotform/.test(H)) s += 5;
    if (/jelentkez|regisztr|jelentkezem|jel/.test(T)) s += 3;
    if (prefer && H.includes(prefer)) s += 1;
    if (isImage(H)) s -= 10;
    return s;
  };

  let best = null, bestScore = -1e9;
  for(const link of links){
    const hrefAbs = absUrl(link.href, baseUrl);
    if(!hrefAbs) continue;
    const sc = score(hrefAbs, link.text);
    if(sc > bestScore){ bestScore = sc; best = hrefAbs; }
  }
  return best || null;
}

function sourceSpecificFixes(row){
  const notes = [];

  // Bükkszentkereszt – ha 12.31-re esett, próbáld a cím/descr-ből
  if (/bükkszentkereszt/i.test(row.location||"") || /bükkszentkereszt/i.test(row.title||"")){
    const bad = row.start_date && /-12-31T/.test(row.start_date);
    if (bad) {
      const dr = parseHuDateRangeLoose(`${row.title} ${row.description}`);
      if (dr) { row.start_date = dr.start; row.end_date = dr.end; notes.push("date_fix:bukkszent-cimbol"); }
    }
  }

  // Jezsuiták: ne mutasson képre a jelentkezési link
  // (rss 'source' nem 'Jezsuiták', ezért a domain alapján is jelöljük)
  const srcTxt = `${row.source||""} ${row.source_url||""}`.toLowerCase();
  if (/jezsuit/.test(srcTxt)){
    if (row.registration_link && /\.(gif|png|jpe?g|webp|svg)(\?|$)/i.test(row.registration_link)){
      row.registration_link = null;
      notes.push("reglink_removed:image");
    }
  }

  return notes;
}

function normalizeAndEnrich(rawRow){
  const row = { ...rawRow };
  const notes = [];

  // célcsoport (csak ha nincs beállítva vagy Mindenki)
  const guessed = guessTargetGroup(row.title, row.description || plainText(row.content||""));
  if (!row.target_group || row.target_group === "Mindenki") {
    row.target_group = guessed;
    notes.push("tg:"+guessed);
  }

  // jelentkezési link – ha van linklista, válassz; ha kép, dobd el
  if (row._linkCandidates && row._linkCandidates.length){
    const picked = pickRegistrationLink({ links: row._linkCandidates, baseUrl: row.link });
    if (picked && picked !== row.registration_link) {
      row.registration_link = picked;
      notes.push("reglink:picked");
    }
  } else if (row.registration_link) {
    if (/\.(gif|png|jpe?g|webp|svg)(\?|$)/i.test(row.registration_link)) {
      row.registration_link = null;
      notes.push("reglink_removed:image");
    }
  }

  // dátum fallback: ha hiányos vagy 12.31-re csúszott
  const badDate = row.start_date && /-12-31T/.test(row.start_date);
  if (!row.start_date || badDate) {
    const textForDate = `${row.title||""} ${row.description||plainText(row.content||"")}`;
    const dr = parseHuDateRangeLoose(textForDate);
    if (dr) {
      row.start_date = dr.start;
      row.end_date = dr.end;
      notes.push("date:parsed_from_text");
    }
  }

  // forrás-specifikus
  notes.push(...sourceSpecificFixes(row));

  // end < start → end=null
  if (row.start_date && row.end_date) {
    if (new Date(row.end_date) < new Date(row.start_date)) {
      row.end_date = null;
      notes.push("date_fix:end_before_start");
    }
  }

  row._debug_notes = notes.join("|");
  return row;
}
// ============ ENRICH/OKOSÍTÁS VÉGE ============


// ---------- beállítások ----------
const FEEDS = [
  "https://eletrendezeshaza.hu/?feed=atom",
  "https://www.maranathahaz.hu/feed/",
  "https://martineum.hu/feed/",
];
const BIZ_CATEGORY = "https://bizdramagad.hu/hitelet/lelkigyakorlat/";

const AXIOS = axios.create({
  timeout: 15000,
  headers: { "User-Agent": "RetreatCrawler/1.0 (+contact: sajat@emailcimed)" },
});

// ---------- segédek ----------

const stripHtml = (html = "") =>
  String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const firstLink = (htmlOrText = "") => {
  const links = Array.from(String(htmlOrText).matchAll(/https?:\/\/[^\s"'<)]+/g)).map((m) => m[0]);
  if (!links.length) return null;
  const form = links.find((l) => /forms\.gle|form|jelentkez|register/i.test(l));
  return form || links[0];
};

const detectLocation = (text = "") => {
  if (/martineum/i.test(text)) return "Martineum Felnőttképző Akadémia, Szombathely";
  if (/szombathely/i.test(text)) return "Szombathely";
  if (/püspökszentlászló/i.test(text)) return "Püspökszentlászló";
  if (/mecsek/i.test(text)) return "Mecsek";
  if (/mána?fa/i.test(text)) return "Mánfa";
  if (/maranatha\s+lelkigyakorlatos\s+ház/i.test(text)) return "MaranaTha Lelkigyakorlatos Ház";
  return null;
};

const extractContact = (text = "") => {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(\+?\d[\d\s-]{7,}\d)/)?.[0];
  if (email && phone) return `${email}, ${phone}`;
  return email || phone || null;
};

function mapHUTimeWord(word) {
  const w = (word || "").toLowerCase();
  if (/(vacsorától|vacsora)/.test(w)) return { hh: 18, mm: 0 };
  if (/(reggeliig|reggel)/.test(w))   return { hh: 9,  mm: 0 };
  if (/ebédig/.test(w))               return { hh: 13, mm: 0 };
  if (/délelőtt/.test(w))             return { hh: 10, mm: 0 };
  if (/délután/.test(w))              return { hh: 15, mm: 0 };
  if (/este/.test(w))                 return { hh: 19, mm: 0 };
  if (/éjfél/.test(w))                return { hh: 0,  mm: 0 };
  return null;
}

function parseHUDateRange(textRaw = "") {
  const months = Object.keys(HU_MONTHS).join("|");

  // Időpont: 2025. október 16. (…) – október 26. (…)
  const reDetail = new RegExp(
    String.raw`időpont[^:]*:\s*(\d{4})\.\s*(${months})\.?\s*(\d{1,2})\.?\s*(?:\(([^)]+)\))?\s*(?:(\d{1,2})(?::(\d{2}))?\s*órától)?\s*[–—-]\s*(?:(\d{4})\.\s*)?(?:(${months})\.?\s*)?(\d{1,2})\.?\s*(?:\(([^)]+)\))?\s*(?:(\d{1,2})(?::(\d{2}))?\s*óráig)?`,
    "i"
  );
  let m = textRaw.match(reDetail);
  if (m) {
    let [, y1, mon1, d1, startWords, h1, min1, y2, mon2, d2, endWords, h2, min2] = m;
    y2 = y2 || y1;
    mon2 = mon2 || mon1;
    if (!h1 && startWords) { const t = mapHUTimeWord(startWords); if (t) { h1 = t.hh; min1 = t.mm; } }
    if (!h2 && endWords)   { const t = mapHUTimeWord(endWords);   if (t) { h2 = t.hh; min2 = t.mm; } }
    return {
      startISO: toISO(y1, HU_MONTHS[mon1.toLowerCase()], d1, h1, min1),
      endISO:   toISO(y2, HU_MONTHS[mon2.toLowerCase()], d2, h2, min2),
    };
  }

  // 2025. október 16 – október 26.
  const reShort = new RegExp(
    String.raw`(\d{4})\.?\s*(${months})\.?\s*(\d{1,2})\s*[–—-]\s*(?:(${months})\.?\s*)?(\d{1,2})`,
    "i"
  );
  m = textRaw.match(reShort);
  if (m) {
    let [, y, mon1, d1, mon2Maybe, d2] = m;
    const mon2 = mon2Maybe || mon1;
    const mm1 = HU_MONTHS[mon1.toLowerCase()];
    const mm2 = HU_MONTHS[mon2.toLowerCase()];
    return {
      startISO: toISO(y, mm1, d1, 0, 0),
      endISO:   toISO(y, mm2, d2, 23, 59),
    };
  }

  // 2025. október 6.
  const reSingle = new RegExp(String.raw`(\d{4})\.?\s*(${months})\.?\s*(\d{1,2})`, "i");
  m = textRaw.match(reSingle);
  if (m) {
    const [, y, mon, d] = m;
    const mm = HU_MONTHS[mon.toLowerCase()];
    return { startISO: toISO(y, mm, d), endISO: null };
  }
  return { startISO: null, endISO: null };
}

const normalize = (s = "") =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const dateKey = (iso) => (iso ? iso.slice(0, 10) : "");

function buildUniquenessKey({ title, start_date, organizer, location }) {
  const t = normalize(title || "");
  const d = dateKey(start_date);
  const org = normalize(organizer || "");
  const loc = normalize(location || "");
  const who = org || loc || "";
  return `${t}|${d}|${who}`;
}

const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");

// ---------- RSS ----------
async function importFromRSS({ rssLimitPerFeed = Infinity } = {}) {
  const parser = new Parser();
  const rows = [];

  for (const url of FEEDS) {
    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, rssLimitPerFeed);

    for (const item of items) {
      const title = (item.title || "").trim() || "(cím nélkül)";
      const html = item.content || item.summary || "";
      const text = stripHtml(html);
      const { startISO, endISO } = parseHUDateRange(`${title}\n${html}`);
      if (!startISO) continue;
 
 // link jelöltek a részhez – később okosan választunk
      const $$ = cheerio.load(html || "");
      const linkCandidates = [];
      $$("a[href]").each((_, a) => {
      const href = $$(a).attr("href");
      if (!href) return;
      linkCandidates.push({ href, text: $$(a).text().trim() });
      });

      rows.push({
        source: "rss",
        source_url: item.link || url,
        guid: item.id || (item.link ? `link:${item.link}` : `hash:${sha1(title)}`),
        title,
        description: text || null,
        start_date: startISO,
        end_date: endISO,
        location: detectLocation(`${title} ${text}`),
        contact: extractContact(text),
		registration_link: firstLink(html) || item.link || null,
        _linkCandidates: linkCandidates,                 // ⇐ új
        target_group: guessTargetGroup(title, text),     // ⇐ jobb default
        organizer: null,
        registration_deadline: null,
        community_id: null,
      });
    }
  }
  return rows;
}

// ---------- Bizdrámagad ----------
async function getHtml(url) {
  if (!/^https?:\/\//i.test(url)) throw new Error(`Invalid absolute URL: ${url}`);
  const r = await AXIOS.get(url);
  return r.data;
}

async function collectSolutionLinks() {
  const base = BIZ_CATEGORY;
  const $ = cheerio.load(await getHtml(base));
  const links = new Set();
  $("a[href]").each((_, a) => {
    const raw = $(a).attr("href");
    const href = raw ? absUrl(raw, base) : null;
    if (href && /\/megoldasok\//.test(href)) links.add(href.split("#")[0]);
  });
  return [...links];
}

async function collectProgramLinks(solutionUrl) {
  const $ = cheerio.load(await getHtml(solutionUrl));
  const links = new Set();
  $("a[href]").each((_, a) => {
    const raw = $(a).attr("href");
    const href = raw ? absUrl(raw, solutionUrl) : null;
    if (href && /\/programajanlo\//.test(href)) links.add(href.split("#")[0]);
  });
  return [...links];
}

function parseDateRangeFromPageText(text) {
  return parseHUDateRange(text);
}

async function parseProgram(programUrl) {
  const $ = cheerio.load(await getHtml(programUrl));
  const title = ($("h1").first().text() || "").replace(/\s+/g, " ").trim();
  const pageText = $("body").text().replace(/\s+/g, " ");
  const { startISO, endISO } = parseDateRangeFromPageText(pageText);

  const field = (label) => {
    const re = new RegExp(`${label}\\s*:\\s*([^\\n]+)`, "i");
    return (pageText.match(re)?.[1] || "").trim() || null;
  };
  const location = field("Helyszín");
  const organizer = field("Programszervező") || field("Szervező");
  const registration_deadline = field("Jelentkezési határidő");

  // reg link preferáltan űrlap
  let registration_link = null;
  const linkCandidates = []; // ⇐ gyűjtjük
  $("a[href]").each((_, a) => {
    const raw = $(a).attr("href");
    if (!raw) return;
    const href = absUrl(raw, programUrl);
    if (!href) return;
	linkCandidates.push({ href, text: $(a).text().trim() }); // ⇐ jelölt
    if (/forms\.gle|form|jelentkez/i.test(href)) {
      registration_link = href;
      return false;
    }
  });
  if (!registration_link) registration_link = programUrl;

  return {
    source: "bizdramagad",
    source_url: programUrl,
    guid: `biz:${sha1(`${title}|${startISO||""}|${programUrl}`)}`,
    title,
    description: null,
    start_date: startISO,
    end_date: endISO,
    location,
    contact: null,
    registration_link,
    _linkCandidates: linkCandidates,                     // ⇐ add át
	target_group: null,
    organizer,
    registration_deadline,
    community_id: null,
  };
}
async function fetchElza(axios, cheerio, limit = 40) {
  const base = "https://elza.szerzetesek.hu";
  const listUrl = `${base}/lelkigyakorlatok`;

  const { data: html } = await AXIOS.get(listUrl, { timeout: 20000 });
  const $ = cheerio.load(html);

  const rows = [];
  let curDate = null, curPlace = null;

  // A lista szerkezete: Dátum → Hely → <h3/h4><a href="...">Cím</a>
  $("h4, h3, p").each((_, el) => {
    const tag = el.tagName?.toLowerCase?.() || el.name;
    const text = $(el).text().trim().replace(/\s+/g, " ");

    // 1) dátum sor (pl. "2025. okt. 22 – 26.")
    if (/^\d{4}\./.test(text) || /^\d{4}\s+(jan|feb|márc|ápr|máj|jún|júl|aug|szept|okt|nov|dec)/i.test(text)) {
      const dr = parseHuDateRangeLoose(text);
      if (dr) curDate = dr;
      return;
    }

    // 2) helyszín sor (követi a dátumot)
    if (curDate && !curPlace && text && text.length < 150) {
      curPlace = text;
      return;
    }

    // 3) cím + részletlink
    if (tag === "h4" || tag === "h3") {
      const a = $(el).find("a[href]").first();
      if (!a.length) return;
      const href = absUrl(a.attr("href"), base);
      const title = a.text().trim();

      rows.push({ title, href, curDate, curPlace });
      // reset a következő blokkhoz
      curDate = null;
      curPlace = null;
    }
  });

  // részletoldalak letöltése (udvariasan)
  const out = [];
  for (const it of rows.slice(0, limit)) {
    const { title, href, curDate, curPlace } = it;
    let description = "";
    let registration_link = null;
    const linkCandidates = [];

    try {
      const { data: detailHtml } = await AXIOS.get(href, { timeout: 20000 });
      const $$ = cheerio.load(detailHtml);

      // leírás: első 3-4 bekezdés szövege
      const paras = [];
      $$("p").each((i, p) => {
        const t = $$(p).text().trim();
        if (t) paras.push(t);
      });
      description = paras.slice(0, 4).join("\n\n");

      // linkjelöltek + preferált jelentkezési link
      $$("a[href]").each((_, a2) => {
        const raw = $$(a2).attr("href");
        const h = absUrl(raw, href);
        if (!h) return;
        const txt = $$(a2).text().trim();
        linkCandidates.push({ href: h, text: txt });
      });
      registration_link = pickRegistrationLink({ links: linkCandidates, baseUrl: href });

    } catch (e) {
      // ha nem sikerül a részletoldal, marad a cím és a lista-információ
    }

    // start/end dátum: ha a listából nem jött, próbáljuk cím/leírás szövegből
    let start_date = curDate?.start || null;
    let end_date = curDate?.end || null;
    if (!start_date) {
      const dr2 = parseHuDateRangeLoose(`${title} ${description}`);
      if (dr2) { start_date = dr2.start; end_date = dr2.end; }
    }

    const rawRow = {
      source: "ELZA",
      source_url: listUrl,     // forrásmegjelöléshez
      link: href,              // részletoldal
      guid: `elza:${href}`,    // emberi-olvasható azonosító
      title,
      description,
      start_date,
      end_date,
      location: curPlace || null,
      contact: null,
      registration_link,
      _linkCandidates: linkCandidates,
      target_group: guessTargetGroup(title, description),
      organizer: null,
      registration_deadline: null,
      community_id: null,
      // stabil dedup a DB felé:
      uniqueness_key: sha1(`elza|${href}`)
    };

    out.push(normalizeAndEnrich(rawRow));
    // kis pihenő, ne üssük az oldalt
    await sleep(350);
  }

  return out;
}

async function importFromBizdramagad({ limit = Infinity } = {}) {
  const solutionLinks = await collectSolutionLinks();

  const programLinks = new Set();
  for (const sol of solutionLinks) {
    const links = await collectProgramLinks(sol);
    links.forEach((l) => programLinks.add(l));
  }

  const list = Array.from(programLinks).slice(0, limit);

  const rows = [];
  for (const url of list) {
    try {
      const row = await parseProgram(url);
      if (row.title && row.start_date) rows.push(row);
    } catch (e) {
      // haladjunk tovább
    }
  }
  return rows;
}

// ---------- DEDUP + UPSERT ----------
function prepareRows(rows) {
  return rows
    .filter((r) => r.title && r.start_date)
    .map((r) => {
      const key = buildUniquenessKey(r);
      const keyHash = sha1(key);
      return {
        ...r,
        title: r.title.slice(0, 255),
        location: r.location ? r.location.slice(0, 255) : null,
        contact: r.contact ? r.contact.slice(0, 255) : null,
        registration_link: r.registration_link ? r.registration_link.slice(0, 1024) : null,
        organizer: r.organizer ? r.organizer.slice(0, 255) : null,
        source: r.source || null,
        source_url: r.source_url || null,
        uniqueness_key: key,          // olvasható kulcs
        uniqueness_key_hash: keyHash, // ezt indexeljük
      };
    });
}

async function upsertByUniqKey(rows) {
  const supabase = getSupabase();
  const chunkSize = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("events")
      .upsert(chunk, { onConflict: "uniqueness_key_hash", ignoreDuplicates: false })
      .select("id");
    if (error) throw error;
    written += data?.length || 0;
  }
  return written;
}

// ---------- fő futtató ----------
export async function runIngest({
  dry = false,
  src = "all",             // "rss" | "biz" | "all"
  limit = 40,              // Bizdrámagad: ennyi program-oldalt dolgozzon fel
  rssLimitPerFeed = 100,   // RSS: feedenként ennyi item
} = {}) {
  const doRSS = src === "rss" || src === "all";
  const doBIZ = src === "biz" || src === "all";

 // 1) beolvasások
const rssRows = await importFromRSS({ rssLimitPerFeed });
const bizRows = src === "all" || src === "biz" ? await importFromBiz({ limit }) : [];
const elzaRows = src === "all" || src === "elza" ? await fetchElza(AXIOS, cheerio, limit) : [];

// 2) összevonás
const incoming = [...rssRows, ...bizRows, ...elzaRows].map(normalizeAndEnrich);

// 3) futáson belüli kereszt-forrás dedup (cím+start+hely alapján)
const seenTriples = new Set();
const crossDedup = [];
for (const r of incoming) {
  const tNorm = (r.title || "").toLowerCase().replace(/\s+/g, " ").trim();
  const dKey = r.start_date ? r.start_date.slice(0, 10) : "";
  const lNorm = (r.location || "").toLowerCase().replace(/\s+/g, " ").trim();
  const key = `${tNorm}|${dKey}|${lNorm}`;
  if (seenTriples.has(key)) continue;
  seenTriples.add(key);
  crossDedup.push(r);
}

// 4) a te meglévő előkészítőd
const prepared = prepareRows(crossDedup);

// 5) a te meglévő DB-dedup beszúrás (uniqueness_key index)
//    — itt a prepared elemek már hordozzák a `uniqueness_key`-et (ELZA-nál biztosan)


  const enriched  = [...rssRows, ...bizRows].map(normalizeAndEnrich);
 const prepared  = prepareRows(enriched);

  // memóriabeli dedup HASH alapján
  const seen = new Set();
  const unique = [];
  for (const r of prepared) {
    const h = r.uniqueness_key_hash;
    if (seen.has(h)) continue;
    seen.add(h);
    unique.push(r);
  }

   if (dry) {
    return {
      dry: true,
      src,
      rssCount: rssRows.length,
      bizCount: bizRows.length,
      prepared: prepared.length,
      unique: unique.length,
     sample: unique.slice(0, 5).map(r => ({
       title: r.title, start_date: r.start_date, end_date: r.end_date,
       target_group: r.target_group, registration_link: r.registration_link,
       source: r.source, source_url: r.source_url,
       notes: r._debug_notes
     })),
    };
  }

  const written = await upsertByUniqKey(unique);
  return {
    dry: false,
    src,
    rssCount: rssRows.length,
    bizCount: bizRows.length,
    prepared: prepared.length,
    unique: unique.length,
    written,
  };
}

export default runIngest;
