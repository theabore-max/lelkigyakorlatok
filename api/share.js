// api/share.js
const { createClient } = require("@supabase/supabase-js");

// Állítható alapértékek
const BASE = process.env.CANONICAL_BASE || "https://lelkigyakorlatok.vercel.app";
// <<< FIX: statikus OG fallback kép, amit kértél
const OG_FALLBACK = "https://kibgskyyevsighwtkqcf.supabase.co/storage/v1/object/public/event-images/og/og_1.jpg";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const esc = (s = "") =>
  s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
const strip = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const truncate = (s = "", n = 240) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// Supabase kép URL-hez OG méret (1200x630)
function ogSized(url) {
  if (!url) return OG_FALLBACK;
  // csak Supabase public storage URL-re illesztünk transform paramétert
  if (url.includes("/storage/v1/object/public/")) {
    const hasQuery = url.includes("?");
    return `${url}${hasQuery ? "&" : "?"}width=1200&height=630&resize=cover&quality=85`;
  }
  return url;
}

module.exports = async (req, res) => {
  try {
    const { id } = req.query || {};
    if (!id) return notFound(res);

    // Ha nincs SB konfig, adjunk általános OG-t (ne dőljön el)
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const url = `${BASE}/share/${encodeURIComponent(String(id))}`;
      return sendHtml(res, 200, ogHtml({
        title: "Lelkigyakorlat",
        description: "Katolikus lelkigyakorlatok egy helyen.",
        url,
        image: OG_FALLBACK,
      }));
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from("events")
      .select("id,title,description,location,start_date,image_url,poster_url")
      .eq("id", id)
      .single();

    if (error || !data) return notFound(res);

    const date = data.start_date
      ? new Date(data.start_date).toLocaleDateString("hu-HU", { year:"numeric", month:"long", day:"numeric" })
      : "";
    const place = data.location ? ` • ${data.location}` : "";
    const title = data.title || "Lelkigyakorlat";
    const descSrc = (date ? `${date}${place}. ` : "") + (data.description || "");
    const description = truncate(strip(descSrc), 240);

    // <<< FIX: kép prioritás + OG méretezés + fallback a megadott URL-re
    const baseImg = data.poster_url || data.image_url || OG_FALLBACK;
    const image = ogSized(baseImg);

    const url = `${BASE}/share/${encodeURIComponent(String(id))}`;
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600"); // 10 perc
    return sendHtml(res, 200, ogHtml({ title, description, url, image }));
  } catch {
    return notFound(res);
  }
};

function ogHtml({ title, description, url, image }) {
  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Katolikus lelkigyakorlat-kereső">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="Lelkigyakorlat illusztráció">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="hu_HU">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head>
<body>
  <noscript><p>Megnyitás: <a href="${esc(url)}">${esc(url)}</a></p></noscript>
  <script>location.replace("${esc(url).replace(/"/g,'\\"')}");</script>
</body>
</html>`;
}

function sendHtml(res, status, html) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}

function notFound(res) {
  return sendHtml(res, 404, ogHtml({
    title: "Lelkigyakorlat nem található",
    description: "Lehet, hogy az esemény már nem elérhető.",
    url: BASE + "/",
    image: OG_FALLBACK,
  }));
}
