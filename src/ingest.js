// ingest.js
// ------------------------------------------------------------
// Hibrid import: RSS + Bizdrámagad scraper  → Supabase `events`
// - Duplikáció-kerülés: "uniqueness_key" (norm_cím + start_dátum + szervező/helyszín)
// - ESM (package.json: "type": "module")
// - npm i rss-parser axios cheerio @supabase/supabase-js
// - Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Service Role, csak szerveren!)
// ------------------------------------------------------------

import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ---------- ENV / SUPABASE ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ---------- ÁLTALÁNOS SEGÉDEK ----------
const FEEDS = [
  "https://eletrendezeshaza.hu/?feed=atom",
  "https://www.maranathahaz.hu/feed/",
  "https://martineum.hu/feed/",
  // ide vehetsz fel még feedeket
];

const HU_MONTHS = {
  január: 1, jan: 1, "jan.": 1,
  február: 2, feb: 2, "feb.": 2,
  március: 3, "márc": 3, "márc.": 3, marcius: 3,
  április: 4, "ápr": 4, "ápr.": 4, aprilis: 4,
  május: 5, "máj": 5, "máj.": 5, majus: 5,
  június: 6, "jún": 6, "jún.": 6, junius: 6,
  július: 7, "júl": 7, "júl.": 7, julius: 7,
  augusztus: 8, aug: 8, "aug.": 8,
  szeptember: 9, szept: 9, "szept.": 9, szep: 9, "szep.": 9,
  október: 10, okt: 10, "okt.": 10, oktober: 10,
  november: 11, nov: 11, "nov.": 11,
  december: 12, dec: 12, "dec.": 12,
};

const toISO = (y, m, d, hh = 0, mm = 0) => {
  if (!y || !m || !d) return null;
  const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(hh) || 0, Number(mm) || 0);
  return isNaN(dt) ? null : dt.toISOString();
};

const stripHtml = (html = "") =>
  String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const firstLink = (htmlOrText = "") => {
  const links = Array.from(String(htmlOrText).matchAll(/https?:\/\/[^\s"'<)]+/g)).map((m) => m[0]);
  if (!links.length) return null;
  const gform = links.find((l) => /forms\.gle|form|jelentkez|register/i.test(l));
  return gform || links[0];
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

  // Időpont: 2025. október 16. (csütörtök, vacsorától) – október 26. (vasárnap, reggeliig)
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

// Normalizálás a duplikációs kulcshoz
const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // ékezetek le
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const dateKey = (iso) => (iso ? iso.slice(0, 10) : ""); // YYYY-MM-DD

function buildUniquenessKey({ title, start_date, organizer, location }) {
  const t = normalize(title || "");
  const d = dateKey(start_date);
  const org = normalize(organizer || "");
  const loc = normalize(location || "");
  // szervező előrébb, ha van; különben helyszín
  const who = org || loc || "";
  return `${t}|${d}|${who}`;
}

const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");

// ---------- RSS IMPORT ----------
async function importFromRSS() {
  const parser = new Parser();
  const rows = [];

  for (const url of FEEDS) {
    const feed = await parser.parseURL(url);
    for (const item of feed.items || []) {
      const title = (item.title || "").trim() || "(cím nélkül)";
      const html = item.content || item.summary || "";
      const text = stripHtml(html);
      const { startISO, endISO } = parseHUDateRange(`${title}\n${html}`);
      const registration_link = firstLink(html) || item.link || null;
      const location = detectLocation(`${title} ${text}`);
      const contact = extractContact(text);

      // csak akkor adjuk hozzá, ha legalább start_date megvan
      if (!startISO) continue;

      rows.push({
        source: "rss",
        source_url: item.link || url,
        guid: item.id || (item.link ? `link:${item.link}` : `hash:${sha1(title)}`),
        title,
        description: text || null,
        start_date: startISO,
        end_date: endISO,
        location,
        contact,
        registration_link,
        target_group: "Mindenki",
        organizer: null,
        registration_deadline: null,
        community_id: null,
      });
    }
  }
  return rows;
}

// ---------- BIZDRÁMAGAD SCRAPER ----------
const BIZ_CATEGORY = "https://bizdramagad.hu/hitelet/lelkigyakorlat/";

async function getHtml(url) {
  const r = await axios.get(url, { headers: { "User-Agent": "RetreatCrawler/1.0 (+contact: you@example.com)" }});
  return r.data;
}

async function collectSolutionLinks() {
  const $ = cheerio.load(await getHtml(BIZ_CATEGORY));
  const links = new Set();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (href && /\/megoldasok\//.test(href)) links.add(href.split("#")[0]);
  });
  return [...links];
}

async function collectProgramLinks(solutionUrl) {
  const $ = cheerio.load(await getHtml(solutionUrl));
  const links = new Set();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (href && /\/programajanlo\//.test(href)) links.add(href.split("#")[0]);
  });
  return [...links];
}

function parseDateRangeFromPageText(text) {
  return parseHUDateRange(text); // ugyanazt a magyart használjuk
}

async function parseProgram(programUrl) {
  const $ = cheerio.load(await getHtml(programUrl));
  const title = ($("h1").first().text() || "").replace(/\s+/g, " ").trim();
  const pageText = $("body").text().replace(/\s+/g, " ");
  const { startISO, endISO } = parseDateRangeFromPageText(pageText);

  // címkék alapján mezők
  const field = (label) => {
    const re = new RegExp(`${label}\\s*:\\s*([^\\n]+)`, "i");
    return (pageText.match(re)?.[1] || "").trim() || null;
  };
  const location = field("Helyszín");
  const organizer = field("Programszervező") || field("Szervező");
  const registration_deadline = field("Jelentkezési határidő");

  // regisztrációs link előnyben (űrlap)
  let registration_link = null;
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    if (/forms\.gle|form|jelentkez/i.test(href)) { registration_link = href; return false; }
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
    target_group: null,
    organizer,
    registration_deadline,
    community_id: null,
  };
}

async function importFromBizdramagad() {
  const solutionLinks = await collectSolutionLinks();
  const programLinks = new Set();
  for (const sol of solutionLinks) {
    const links = await collectProgramLinks(sol);
    links.forEach(l => programLinks.add(l));
  }
  const rows = [];
  for (const url of programLinks) {
    try {
      const row = await parseProgram(url);
      if (row.title && row.start_date) rows.push(row);
    } catch (e) {
      // swallow, menjünk tovább
    }
  }
  return rows;
}

// ---------- DEDUP + UPSERT ----------
function prepareRows(rows) {
  return rows
    .filter(r => r.title && r.start_date) // biztosítsuk a kulcshoz szükséges mezőket
  .map(r => {
    const key = buildUniquenessKey(r);
    return {
      ...r,
      // táblamezők sane-throttle
      title: r.title.slice(0, 255),
      location: r.location ? r.location.slice(0, 255) : null,
      contact: r.contact ? r.contact.slice(0, 255) : null,
      registration_link: r.registration_link ? r.registration_link.slice(0, 1024) : null,
      organizer: r.organizer ? r.organizer.slice(0, 255) : null,
      source: r.source || null,
      source_url: r.source_url || null,
      // duplikációs kulcs
      uniqueness_key: key,
    };
  });
}

async function upsertByUniqKey(rows) {
  // fontos: DB-ben legyen egyedi index a "uniqueness_key" mezőn
  const chunkSize = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("events")
      .upsert(chunk, { onConflict: "uniqueness_key", ignoreDuplicates: false })
      .select("id");
    if (error) throw error;
    written += data?.length || 0;
  }
  return written;
}

// ---------- FŐ FUTTATÓ ----------
export async function runIngest({ dry = false } = {}) {
  const rssRows = await importFromRSS();
  const bizRows = await importFromBizdramagad();

  const prepared = prepareRows([...rssRows, ...bizRows]);

  // memóriabeli duplikáció-előszűrés ugyanazzal a kulccsal
  const seen = new Set();
  const unique = [];
  for (const r of prepared) {
    if (seen.has(r.uniqueness_key)) continue;
    seen.add(r.uniqueness_key);
    unique.push(r);
  }

  if (dry) {
    return {
      dry: true,
      rssCount: rssRows.length,
      bizCount: bizRows.length,
      prepared: prepared.length,
      unique: unique.length,
      sample: unique.slice(0, 5),
    };
  }

  const written = await upsertByUniqKey(unique);
  return {
    dry: false,
    rssCount: rssRows.length,
    bizCount: bizRows.length,
    prepared: prepared.length,
    unique: unique.length,
    written,
  };
}
