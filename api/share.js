// api/share.js
const { createClient } = require("@supabase/supabase-js");

// Alapok
const BASE = process.env.CANONICAL_BASE || "https://lelkigyakorlatok.vercel.app";
const OG_FALLBACK = "https://kibgskyyevsighwtkqcf.supabase.co/storage/v1/object/public/event-images/og/og_1.jpg";

// Előnyben a SERVICE_ROLE (csak szerveren fut!)
// Ha nincs, visszaesünk az anon kulcsra.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY;

const esc = (s = "") =>
  s.replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
const strip = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const truncate = (s = "", n = 240) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// Supabase public képhez OG méret + cache buster
function ogSized(url) {
  if (!url) return OG_FALLBACK;
  let u = url;
  if (u.includes("/storage/v1/object/public/")) {
    const sep = u.includes("?") ? "&" : "?";
    u = `${u}${sep}width=1200&height=630&resize=cover&quality=85`;
  }
  // cache-buster a scraper felé (ne újratöltsön képet, de új OG képet vegyen fel)
  const sep2 = u.includes("?") ? "&" : "?";
  return `${u}${sep2}fbv=${Date.now() % 100000}`;
}

module.exports = async (req, res) => {
  try {
    const { id } = req.query || {};
    if (!id) return notFound(res);

    const shareUrl = `${BASE}/api/share?id=${encodeURIComponent(String(id))}`;
    const redirectTarget = `${BASE}/?e=${encodeURIComponent(String(id))}`;
    const noRedirect = String(req.query?.noredirect || "") === "1";
    const debug = String(req.query?.debug || "") === "1";

    // Supabase kliens (service role-t használunk, ha van)
    let row = null;
    let envInfo = { hasUrl: !!SUPABASE_URL, hasService: !!SERVICE_ROLE, hasAnon: !!ANON_KEY };

    if (SUPABASE_URL && (SERVICE_ROLE || ANON_KEY)) {
      const sb = createClient(SUPABASE_URL, SERVICE_ROLE || ANON_KEY);
      const { data, error } = await sb
        .from("events")
        .select("id,title,description,location,start_date,image_url,poster_url")
        .eq("id", id)
        .single();
      if (!error) row = data || null;
    }

    // DEBUG mód: JSON visszaadása
    if (debug) {
      const baseImg = row?.poster_url || row?.image_url || OG_FALLBACK;
      return res.status(200).json({
        ok: true,
        id,
        env: envInfo,
        found: !!row,
        row,
        built: {
          title: buildTitle(row),
          description: truncate(strip(buildDescSource(row)), 240),
          image: ogSized(baseImg),
          url: shareUrl,
          redirectTarget,
        },
      });
    }

    // OG felépítése
    const title = buildTitle(row);
    const description = truncate(strip(buildDescSource(row)), 240);
    const baseImg = row?.poster_url || row?.image_url || OG_FALLBACK;
    const image = ogSized(baseImg);

    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600"); // 10 perc

    return sendHtml(res, row ? 200 : 404, ogHtml({
      title,
      description,
      url: shareUrl,   // og:url → ezt adtuk meg a sharernek
      image,
      redirectTarget,
      noRedirect,
      // opcionális, ha van app id-d
      fbAppId: process.env.FB_APP_ID || "",
    }));
  } catch (e) {
    // Ha bármi gáz, adjunk legalább korrekt OG-t fallbackkel
    return notFound(res);
  }
};

function buildTitle(row) {
  if (!row) return "Lelkigyakorlat nem található";
  const base = row.title || "Lelkigyakorlat";
  const date = row.start_date
    ? new Date(row.start_date).toLocaleDateString("hu-HU", { year:"numeric", month:"long", day:"numeric" })
    : "";
  const place = row.location ? ` • ${row.location}` : "";
  return date ? `${base} — ${date}${place}` : base;
}

function buildDescSource(row) {
  if (!row) return "Lehet, hogy az esemény már nem elérhető.";
  const date = row.start_date
    ? new Date(row.start_date).toLocaleDateString("hu-HU", { year:"numeric", month:"long", day:"numeric" })
    : "";
  const place = row.location ? ` • ${row.location}` : "";
  return (row.description || (date ? `${date}${place}` : "")) || "";
}

function ogHtml({ title, description, url, image, redirectTarget, noRedirect, fbAppId }) {
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
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:alt" content="Lelkigyakorlat illusztráció">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="hu_HU">
${fbAppId ? `<meta property="fb:app_id" content="${esc(fbAppId)}">` : ""}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">

<!-- debug help (nem látszik az előnézetben) -->
<!-- ${esc(image)} -->
</head>
<body>
  <noscript><p>Megnyitás: <a href="${esc(redirectTarget || BASE)}">${esc(redirectTarget || BASE)}</a></p></noscript>
  ${noRedirect ? "" : `<script>location.replace("${esc((redirectTarget || BASE)).replace(/"/g,'\\"')}");</script>`}
</body>
</html>`;
}

function sendHtml(res, status, html) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}

function notFound(res) {
  const url = BASE + "/";
  const redirectTarget = BASE + "/";
  return sendHtml(res, 404, ogHtml({
    title: "Lelkigyakorlat nem található",
    description: "Lehet, hogy az esemény már nem elérhető.",
    url,
    image: OG_FALLBACK,
    redirectTarget,
    noRedirect: false,
    fbAppId: process.env.FB_APP_ID || "",
  }));
}
