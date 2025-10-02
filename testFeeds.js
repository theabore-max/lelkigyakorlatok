// testFeeds.js
// ------------------------------------------------------------
// Több RSS/Atom feed gyors tesztje (nem ír DB-be).
// Jelentés: összegzés + minta-sorok. ESM (package.json: "type":"module").
// Használat:
//   node testFeeds.js <feed1> <feed2> ... [--json out.json]
// Példa:
//   node testFeeds.js https://eletrendezeshaza.hu/?feed=atom --json report.json
// ------------------------------------------------------------

import Parser from "rss-parser";
import fs from "node:fs";

// ---- CLI ----
const args = process.argv.slice(2);
const outJsonPath = (() => {
  const i = args.indexOf("--json");
  return i >= 0 ? args[i + 1] : null;
})();
const FEEDS = args.filter((a) => /^https?:\/\//i.test(a));
if (FEEDS.length === 0) {
  FEEDS.push("https://eletrendezeshaza.hu/?feed=atom");
  console.log("Nem adtál meg feedet, a defaultot tesztelem:", FEEDS[0]);
}

// ---- Segédek (parserhez) ----
// Magyar hónapok + gyakori rövidítések
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

const extractFirstLink = (htmlOrText = "") => {
  const links = Array.from(String(htmlOrText).matchAll(/https?:\/\/[^\s"'<)]+/g)).map((m) => m[0]);
  if (!links.length) return null;
  const gform = links.find((l) => l.includes("forms.gle"));
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

// „szavas” időpontok → alapértelmezett órák
function mapHUTimeWord(word) {
  const w = (word || "").toLowerCase();
  if (/(vacsorától|vacsora)/.test(w)) return { hh: 18, mm: 0 };
  if (/(reggeliig|reggel)/.test(w)) return { hh: 9, mm: 0 };
  if (/ebédig/.test(w)) return { hh: 13, mm: 0 };
  if (/délelőtt/.test(w)) return { hh: 10, mm: 0 };
  if (/délután/.test(w)) return { hh: 15, mm: 0 };
  if (/este/.test(w)) return { hh: 19, mm: 0 };
  if (/éjfél/.test(w)) return { hh: 0, mm: 0 };
  return null;
}

// Magyar dátum/időtartomány kinyerése több mintával
function parseHUDateRangeFromText(textRaw = "") {
  const months = Object.keys(HU_MONTHS).join("|");

  // 1) "Időpont: 2025. október 16. (csütörtök, vacsorától) – október 26. (vasárnap, reggeliig)"
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
    return {
      startISO: toISO(y1, HU_MONTHS[mon1.toLowerCase()], d1, h1, min1),
      endISO: toISO(y2, HU_MONTHS[mon2.toLowerCase()], d2, h2, min2),
    };
  }

  // 2) "2025. október 16 – október 26."
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
      endISO: toISO(y, mm2, d2, 23, 59),
    };
  }

  // 3) "2025. október 6."
  const reSingle = new RegExp(String.raw`(\d{4})\.?\s*(${months})\.?\s*(\d{1,2})`, "i");
  m = textRaw.match(reSingle);
  if (m) {
    const [, y, mon, d] = m;
    const mm = HU_MONTHS[mon.toLowerCase()];
    return { startISO: toISO(y, mm, d), endISO: null };
  }

  return { startISO: null, endISO: null };
}

// ---- Egységes item-parser (minden feedre) ----
// A dátumkinyerést a (title + content) együttes szövegén futtatjuk.
function parseItem(item) {
  const title = (item.title || "").trim() || "(cím nélkül)";
  const html = item.content || item.summary || "";
  const text = stripHtml(html);

  const { startISO, endISO } = parseHUDateRangeFromText(`${title}\n${html}`);
  const registration_link = extractFirstLink(html) || item.link || null;
  const location = detectLocation(`${title} ${text}`);
  const contact = extractContact(text);

  return {
    title,
    start_date: startISO,
    end_date: endISO,
    location,
    contact,
    registration_link,
    link: item.link || null,
  };
}

// ---- Futás ----
const parser = new Parser();

async function testFeed(url) {
  const feed = await parser.parseURL(url);
  const items = feed.items || [];
  const rows = items.map((it) => {
    const parsed = parseItem(it);
    return {
      title: parsed.title,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      location: parsed.location,
      contact: parsed.contact,
      registration_link: parsed.registration_link,
      link: parsed.link,
    };
  });

  const withStart = rows.filter((r) => !!r.start_date).length;
  const withEnd = rows.filter((r) => !!r.end_date).length;

  return {
    feedTitle: feed.title || url,
    url,
    total: rows.length,
    withStart,
    withEnd,
    rateStartPct: rows.length ? Math.round((withStart / rows.length) * 100) : 0,
    rateEndPct: rows.length ? Math.round((withEnd / rows.length) * 100) : 0,
    sample: rows.slice(0, 5), // első 5 minta
    missingStartTitles: rows.filter((r) => !r.start_date).slice(0, 5).map((r) => r.title),
  };
}

async function run() {
  const report = [];
  for (const url of FEEDS) {
    console.log(`\n==> Fetching: ${url}`);
    try {
      const r = await testFeed(url);
      report.push(r);
      console.log(`Feed: ${r.feedTitle}`);
      console.log(`Összes item: ${r.total}`);
      console.log(
        `Kinyert start_date: ${r.withStart} (${r.rateStartPct}%) | end_date: ${r.withEnd} (${r.rateEndPct}%)`
      );
      if (r.sample.length) {
        console.log("\nMinták:");
        r.sample.forEach((s, i) => {
          console.log(` ${i + 1}. ${s.title}`);
          console.log(`    start: ${s.start_date} | end: ${s.end_date}`);
          if (s.location) console.log(`    location: ${s.location}`);
          if (s.contact) console.log(`    contact: ${s.contact}`);
          if (s.registration_link) console.log(`    reg: ${s.registration_link}`);
        });
      }
      if (r.missingStartTitles.length) {
        console.log("\nStart nélkül (minták):");
        r.missingStartTitles.forEach((t) => console.log(" -", t));
      }
    } catch (e) {
      console.error("Hiba a feed feldolgozásakor:", url, e?.message || e);
    }
  }

  if (outJsonPath) {
    fs.writeFileSync(outJsonPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nJelentés mentve: ${outJsonPath}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
