// exploreFeed.js
import Parser from "rss-parser";

const url = process.argv[2];
if (!url) {
  console.error("Használat: node exploreFeed.js <RSS_FEED_URL>");
  process.exit(1);
}

const parser = new Parser({
  // Ha kell: customFields: { item: ["event:startdate", "event:enddate", "ev:location"] }
});

const run = async () => {
  const feed = await parser.parseURL(url);

  console.log(`\nFeed cím: ${feed.title || "(nincs title)"}\n`);
  console.log(`Összes item: ${feed.items?.length ?? 0}\n`);

  const allKeys = new Set();
  for (const it of feed.items || []) {
    Object.keys(it).forEach((k) => allKeys.add(k));
  }
  console.log("Talált item-kulcsok:");
  console.log([...allKeys].sort().join(", "));
  console.log("");

  // Mutassunk 1-2 minta itemet:
  (feed.items || []).slice(0, 2).forEach((it, idx) => {
    console.log(`--- Minta item #${idx + 1} ---`);
    // csak a fontosabb részeket írjuk ki
    const preview = {};
    for (const k of Object.keys(it)) {
      if (["title", "link", "guid", "isoDate", "pubDate", "contentSnippet", "content", "categories", "dc:date", "event:startdate", "event:enddate", "ev:location"].includes(k)) {
        preview[k] = it[k];
      }
    }
    console.dir(preview, { depth: 3, maxArrayLength: 20 });
    console.log("");
  });

  console.log("Tipp: ha látsz olyan kulcsot, mint 'event:startdate' vagy 'ev:location', azt kifejezetten mapelhetjük majd.");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
