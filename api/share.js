// api/share.js  (Vercel Serverless Function, CommonJS)
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // csak olvasunk, elég az anon key

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    let title = "Katolikus lelkigyakorlat";
    let description = "Friss katolikus lelkigyakorlatok egy helyen.";
    let image = "https://lelkigyakorlatok.vercel.app/og.jpg";
    let url = "https://lelkigyakorlatok.vercel.app/";

    if (id && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await supabase
        .from("events")
        .select("id,title,description,location,start_date,end_date,image_url")
        .eq("id", id)
        .single();

      if (!error && data) {
        title = data.title || title;
        const place = data.location ? ` • ${data.location}` : "";
        const dates = data.start_date
          ? new Date(data.start_date).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })
          : "";
        description = (dates ? `${dates}${place}. ` : "") + (data.description || description);
        if (data.image_url) image = data.image_url;
        url = `https://lelkigyakorlatok.vercel.app/share/${encodeURIComponent(id)}`;
      }
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(description)}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Katolikus lelkigyakorlat-kereső">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
</head>
<body>
  <!-- Botok az OG-tageket olvassák; felhasználónak adjunk egy linket az appra -->
  <p>Megnyitás: <a href="https://lelkigyakorlatok.vercel.app/">lelkigyakorlatok.vercel.app</a></p>
</body>
</html>`);
  } catch (e) {
    res.status(500).send("Share page error");
  }
};
