// importFeed.js
// ------------------------------------------------------------
// RSS/Atom -> Supabase `events` upsert, magyar dátum-parsinggal
// - ESM (package.json: "type": "module")
// - npm i rss-parser @supabase/supabase-js
// - Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Service Role!)
// - Táblában javasolt: events.guid UNIQUE
// ------------------------------------------------------------

import Parser from "rss-parser";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ---- FEED LISTA ----
// Ide add a feedeket; a megadott feedhez speciális parser (magyar dátum) van.
const FEEDS = [
  "https://eletrendezeshaza.hu/?feed=atom",
  // ide jöhetnek további feedek...
];

// (opcionális) feed-specifikus alapértelmezések, pl. fix community_id
// kulcs: host (pl. "eletrendezeshaza.hu")
const FEED_DEFAULTS = {
  "eletrendezeshaza.hu": {
    target_group: "Mindenki",
    community_id: null, // ha ismered, ide tehetsz pl. 3
  },
};

// ---- Supabase kliens (server-side) ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const DRY = process.argv.includes("--dry-run");

// ---- Segédek ----
const HU_MONTHS = {
  január: 1, február: 2, március: 3, április: 4, május: 5, június: 6,
  július: 7, augusztus: 8, szeptember: 9, október: 10, november: 11, december: 12,
};

const toISO = (y, m, d, hh = 0, mm = 0) => {
  if (!y || !m || !d) return null;
  const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(hh) || 0, Number(mm) || 0);
  return isNaN(dt) ? null : dt.toISOString();
};

const stripHtml = (html = "") =>
  String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const extractFirstLink = (htmlOrText = "") => {
  const links = Array.from(String(htmlOrText).matchAll(/https?:\/\/[^\s"'<)]+/g)).map(
    (m) => m[0]
  );
  if (!links.length) return null;
  const gform = links.find((l) => l.includes("forms.gle"));
  return gform || links[0];
};

const detectLocation = (text = "") => {
  if (/püspökszentlászló/i.test(text)) return "Püspökszentlászló";
  if (/mecsek/i.test(text)) return "Mecsek";
  return null;
};

const extractContact = (text = "") => {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(\+?\d[\d\s-]{7,}\d)/)?.[0];
  if (email && phone) return `${email}, ${phone}`;
  return email || phone || null;
};

const hash = (s) => crypto.createHash("sha1").update(s).digest("hex");

// magyar „szavas” időpontok mappelése
function mapHUTimeWord(word) {
  const w = (word || "").toLowerCase();
  if (/(vacsorától|vacsora)/.test(w)) return { hh: 18, mm: 0 };
  if (/reggeliig/.test(w)) return { hh: 9, mm: 0 };
  if (/ebédig/.test(w)) return { hh: 13, mm: 0 };
  return null;
}

// Magyar dátum és időtartomány kinyerése (több minta támogatása).
// Képes kezelni:
//  - "Időpont: 2025. október 6. (hétfő, vacsorától) – október 10. (péntek, ebédig)"
//  - "2025. október 16 – október 26."
//  - "2025. október 6."
function parseHUDateRangeFromText(textRaw = "") {
  const months = Object.keys(HU_MONTHS).join("|");

  // 1) Időpont-sor részletes minta (óra számokkal VAGY szavakkal)
  const reDetail = new RegExp(
    String.raw`időpont[^:]*:\s*(\d{4})\.\s*(${months})\.?\s*(\d{1,2})\.?\s*(?:\(([^)]+)\))?\s*(?:(\d{1,2})(?::(\d{2}))?\s*órától)?\s*[–—-]\s*(?:(\d{4})\.\s*)?(?:(${months})\.?\s*)?(\d{1,2})\.?\s*(?:\(([^)]+)\))?\s*(?:(\d{1,2})(?::(\d{2}))?\s*óráig)?`,
    "i"
  );
  let m = textRaw.match(reDetail);
  if (m) {
    let [, y1, mon1, d1, startWords, h1, min1, y2, mon2, d2, endWords, h2, min2] = m;
    y2 = y2 || y1;
    mon2 = mon2 || mon1;

    if (!h1 && startWords) {
      const t = mapHUTimeWord(startWords);
      if (t) {
        h1 = t.hh;
        min1 = t.mm;
      }
    }
    if (!h2 && endWords) {
      const t = mapHUTimeWord(endWords);
      if (t) {
        h2 = t.hh;
        min2 = t.mm;
      }
    }

    const startISO = toISO(y1, HU_MONTHS[mon1.toLowerCase()], d1, h1, min1);
    const endISO = toISO(y2, HU_MONTHS[mon2.toLowerCase()], d2, h2, min2);
    return { startISO, endISO };
  }

  // 2) Rövid tartomány (idő nélkül): "2025. október 16 – október 26."
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
    const startISO = toISO(y, mm1, d1, 0, 0);
    const endISO = toISO(y, mm2, d2, 23, 59);
    return { startISO, endISO };
  }

  // 3) Legalább kezdőnap: "2025. október 6."
  const reSingle = new RegExp(String.raw`(\d{4})\.?\s*(${months})\.?\s*(\d{1,2})`, "i");
  m = textRaw.match(reSingle);
  if (m) {
    const [, y, mon, d] = m;
    const mm = HU_MONTHS[mon.toLowerCase()];
    const startISO = toISO(y, mm, d);
    return { startISO, endISO: null };
  }

  return { startISO: null, endISO: null };
}

// ---- FEED-SPECIFIKUS PARSER: eletrendezeshaza.hu ----
function parseItem_eletRendezesHaza(item) {
  const title = (item.title || "").trim() || "(cím nélkül)";
  const pageLink = item.link || null;
  const html = item.content || item.summary || "";
  const text = stripHtml(html);

  const { startISO, endISO } = parseHUDateRangeFromText(html);
  const registration_link = extractFirstLink(html) || pageLink;
  const location = detectLocation(text);
  const contact = extractContact(text);

  return {
    guid: item.id || (pageLink ? `link:${pageLink}` : `hash:${hash(title)}`),
    title,
    description: text || null,
    start_date: startISO, // <— KINYERT eseménykezdés
    end_date: endISO,     // <— KINYERT eseményvég (ha van)
    location,
    contact, // pl. "eletrendezes@jezsuita.hu, 06-30-338-5784"
    registration_link,
    // feed-specifikus alapértelmezések
    target_group: FEED_DEFAULTS["eletrendezeshaza.hu"]?.target_group ?? "Mindenki",
    community_id: FEED_DEFAULTS["eletrendezeshaza.hu"]?.community_id ?? null,
  };
}

// ---- Általános parseItem: domain alapján kapcsol feed-specifikusra ----
function parseItem(item) {
  const url = item.link || "";
  let host = "";
  try {
    host = new URL(url).host;
  } catch (_) {
    // no-op
  }

  if (/eletrendezeshaza\.hu$/.test(host)) {
    return parseItem_eletRendezesHaza(item);
  }

  // Fallback általános mapping (ha más feedeket is felveszel)
  const title = item.title?.trim() || "(cím nélkül)";
  const link = item.link || null;
  const description = item.contentSnippet || item.content || null;

  return {
    guid: item.id || (link ? `link:${link}` : `hash:${hash(title)}`),
    title,
    description,
    start_date: null,
    end_date: null,
    location: null,
    contact: null,
    registration_link: link,
    target_group: "Mindenki",
    community_id: null,
  };
}

// ---- Upsert DB-be (guid alapján ütközéskezelés) ----
async function upsertEvents(rows) {
  // Fontos: legyen UNIQUE index az events.guid mezőn.
  const { data, error } = await supabase
    .from("events")
    .upsert(rows, { onConflict: "guid", ignoreDuplicates: false })
    .select("id, guid");

  if (error) throw error;
  return data;
}

// ---- Parser init ----
const parser = new Parser({
  // ha további egyedi mezőket szeretnél, ide felveheted:
  // customFields: { item: ["event:startdate", "event:enddate", "ev:location", "dc:date"] }
});

// ---- Fő futtatás ----
async function run() {
  for (const url of FEEDS) {
    console.log(`\n==> Fetching: ${url}\n`);
    const feed = await parser.parseURL(url);
    const rows = [];

    for (const item of feed.items || []) {
      const row = parseItem(item);

      // minimális validáció – legyen cím és legalább start_date vagy link
      if (!row.title) continue;
      if (!row.start_date && !row.registration_link) continue;

      // Táblába illesztés előtt: gently trim
      rows.push({
        ...row,
        title: row.title?.slice(0, 255) || null,
        description: row.description || null,
        location: row.location?.slice(0, 255) || null,
        registration_link: row.registration_link?.slice(0, 1024) || null,
        contact: row.contact?.slice(0, 255) || null,
        target_group: row.target_group || "Mindenki",
      });
    }

    console.log(`Feldolgozott itemek: ${rows.length}`);

    if (DRY) {
      console.log("DRY RUN — nem írunk DB-be. Minta sor:");
      console.dir(rows[0], { depth: 2 });
    } else {
      // nagy feednél chunkoljuk az upsertet
      const chunkSize = 200;
      let writtenTotal = 0;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const written = await upsertEvents(chunk);
        writtenTotal += written?.length || 0;
      }
      console.log(`Upsert kész. Érintett sorok: ${writtenTotal}`);
    }
  }
}

// ---- Start ----
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
