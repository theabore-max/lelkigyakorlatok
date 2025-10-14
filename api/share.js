// api/share.js
const { createClient } = require("@supabase/supabase-js");

const BASE = process.env.CANONICAL_BASE || "https://lelkigyakorlatok.vercel.app";
const OG_FALLBACK = "https://kibgskyyevsighwtkqcf.supabase.co/storage/v1/object/public/event-images/og/og_1.jpg";

const SUPABASE_URL   = process.env.SUPABASE_URL;
const SERVICE_ROLE   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY       = process.env.SUPABASE_ANON_KEY;
const FB_APP_ID      = process.env.FB_APP_ID || "";

const esc = (s = "") =>
  String(s || "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
const strip = (html = "") => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const truncate = (s = "", n = 240) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function ogSized(url) {
  if (!url) return OG_FALLBACK;
  let u = url;
  if (u.includes("/storage/v1/object/public/")) {
    const sep = u.includes("?") ? "&" : "?";
    u = `${u}${sep}width=1200&height=630&resize=cover&quality=85`;
  }
  const sep2 = u.includes("?") ? "&" : "?";
  return `${u}${sep2}fbv=${Date.now() % 100000}`;
}

module.exports = async (req, res) => {
  try {
    const { id } = req.query || {};
    if (!id) return sendNotFound(res);

    const shareUrl = `${BASE}/api/share?id=${encodeURIComponent(String(id))}`;
    const redirectTarget = `${BASE}/?e=${encodeURIComponent(String(id))}`;
    const noRedirect = String(req.query?.noredirect || "") === "1";
    const debug = String(req.query?.debug || "") === "1";
    const list = String(req.query?.list || "") === "1";

    // Supabase kliens
    const key = SERVICE_ROLE || ANON_KEY || "";
    const envInfo = {
      hasUrl: !!SUPABASE_URL,
      hasService: !!SERVICE_ROLE,
      hasAnon: !!ANON_KEY,
      // safe preview: csak pár karakter ellenőrzéshez
      keyPreview: key ? `${key.slice(0, 6)}…${key.slice(-4)}` : ""
    };
    const sb = (SUPABASE_URL && key) ? createClient(SUPABASE_URL, key) : null;

    // ---- listázó debug: projectRef + első 10 rekord ----
    if (debug && sb && list) {
      const pr = (SUPABASE_URL || "").match(/https:\/\/([^.]+)\.supabase\.co/);
      const projectRef = pr ? pr[1] : "(unknown)";
      const { data: sample, error: listErr } = await sb
        .from("events")
        .select("id,title")
        .order("id", { ascending: true })
        .limit(10);
      return res.status(200).json({ ok: true, projectRef, env: envInfo, listErr, sample });
    }

    // ---- egy rekord olvasása: NEM single(), hanem tömb ----
    let row = null, selErr = null;
    if (sb) {
      let q = sb
        .from("events")
        .select("id,title,description,location,start_date,image_url,poster_url")
        .limit(1);

      if (/^\d+$/.test(String(id))) {
        q = q.eq("id", Number(id));     // int8 → szám
      } else {
        q = q.eq("id", String(id));     // UUID/slug esetén
      }

      const { data, error } = await q;
      selErr = error || null;
      row = Array.isArray(data) && data.length ? data[0] : null;
    }

    // ---- DEBUG: konkrét rekord helyzetének kiírása ----
    if (debug) {
      const baseImg = row?.poster_url || row?.image_url || OG_FALLBACK;
      return res.status(200).json({
        ok: true,
        id,
        env: envInfo,
        found: !!row,
        selErr,
        row,
        built: {
          title: buildTitle(row),
          description: truncate(strip(buildDescSource(row)), 240),
          image: ogSized(baseImg),
          url: shareUrl,
          redirectTarget,
        }
      });
    }

    // ---- OG felépítése + válasz ----
    const title = buildTitle(row);
    const description = truncate(strip(buildDescSource(row)), 240);
    const baseImg = row?.poster_url || row?.image_url || OG_FALLBACK;
    const image = ogSized(baseImg);

    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600");
    return sendHtml(res, 200, ogHtml({
      title,
      description,
      url: shareUrl,
      image,
      redirectTarget,
      noRedirect,
      fbAppId: FB_APP_ID,
      envForDebugComment: envInfo // csak HTML-kommentben hagyjuk ott, preview-hoz
    }));
  } catch (e) {
    return sendNotFound(res);
  }
};

function buildTitle(row) {
  if (!row) return "Lelkigyakorlat nem található";
  const base = row.title || "Lelkigyakorlat";
  const date = row.start_date
    ? new Date(row.start_date).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })
    : "";
  const place = row.location ? ` • ${row.location}` : "";
  return date ? `${base} — ${date}${place}` : base;
}

function buildDescSource(row) {
  if (!row) return "Lehet, hogy az esemény már nem elérhető.";
  const date = row.start_date
    ? new Date(row.start_date).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })
    : "";
  const place = row.location ? ` • ${row.location}` : "";
  return (row.description || (date ? `${date}${place}` : "")) || "";
}

function ogHtml({ title, description, url, image, redirectTarget, noRedirect, fbAppId, envForDebugComment }) {
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
</head>
<body>
  <noscript><p>Megnyitás: <a href="${esc(redirectTarget || BASE)}">${esc(redirectTarget || BASE)}</a></p></noscript>
  ${noRedirect ? "" : `<script>location.replace("${esc((redirectTarget || BASE)).replace(/"/g,'\\"')}");</script>`}
  <!-- env debug (nem jelenik meg preview-ban): ${esc(JSON.stringify(envForDebugComment))} -->
</body>
</html>`;
}

function sendHtml(res, status, html) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}

function sendNotFound(res) {
  const url = BASE + "/";
  const redirectTarget = BASE + "/";
  return sendHtml(res, 200, ogHtml({
    title: "Lelkigyakorlat nem található",
    description: "Lehet, hogy az esemény már nem elérhető.",
    url,
    image: ogSized(OG_FALLBACK),
    redirectTarget,
    noRedirect: false,
    fbAppId: FB_APP_ID,
    envForDebugComment: {}
  }));
}

