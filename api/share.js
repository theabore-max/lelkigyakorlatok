// api/share.js
const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BASE = "https://lelkigyakorlatok.vercel.app";

const esc = (s="") => s.replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));

module.exports = async (req, res) => {
  const { id } = req.query;
  let title = "Katolikus lelkigyakorlat";
  let description = "Friss katolikus lelkigyakorlatok egy helyen.";
  let image = `${BASE}/og.jpg`;
  let url = `${BASE}/share/${encodeURIComponent(id || "")}`;

  if (id && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await supabase
      .from("events")
      .select("title,description,location,start_date,image_url")
      .eq("id", id)
      .single();

    if (data) {
      title = data.title || title;
      const date = data.start_date
        ? new Date(data.start_date).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })
        : "";
      const place = data.location ? ` • ${data.location}` : "";
      description = (date ? `${date}${place}. ` : "") + (data.description || description);
      if (data.image_url) image = data.image_url;
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<html lang="hu"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Katolikus lelkigyakorlat-kereső">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="hu_HU">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body>
  <p>Megnyitás: <a href="${BASE}/">lelkigyakorlatok.vercel.app</a></p>
</body></html>`);
};
