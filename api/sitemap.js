// api/sitemap.js
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    const base = "https://lelkigyakorlatok.vercel.app";
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).send("Missing Supabase env");
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    // csak jövőbeni/szűrhető események – tetszés szerint lazítható
    const { data, error } = await supabase
      .from("events")
      .select("id, updated_at, start_date")
      .gte("start_date", new Date(2000, 0, 1).toISOString())
      .limit(2000);

    if (error) throw error;

    const urls = [];
    // főoldal
    urls.push({
      loc: `${base}/`,
      changefreq: "hourly",
      priority: "0.8",
      lastmod: new Date().toISOString()
    });

    // share-oldalak (megfelelőek OG/JSON-LD szempontból is)
    (data || []).forEach((row) => {
      urls.push({
        loc: `${base}/api/share?id=${row.id}`,
        changefreq: "daily",
        priority: "0.6",
        lastmod: (row.updated_at || row.start_date || new Date()).toString()
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send("sitemap error: " + (e?.message || e));
  }
};
