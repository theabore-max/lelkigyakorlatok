// api/health.js
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    const started = Date.now();

    // (opcionális) token-védelem: ha beállítasz HEALTH_TOKEN-t, kérni fogja a ?token=...-t
    if (process.env.HEALTH_TOKEN) {
      const token = req.query?.token;
      if (token !== process.env.HEALTH_TOKEN) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
    }

    const env = {
      hasUrl: !!process.env.SUPABASE_URL,
      hasRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // Supabase reachability (1 sor lekérése, nem count – gyors)
    let db = { ok: false };
    if (env.hasUrl && env.hasRoleKey) {
      try {
        const sb = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );
        const { data, error } = await sb.from("events").select("id").limit(1);
        db.ok = !error;
        db.sample = data?.length ?? 0; // 0 vagy 1
        if (error) db.error = error.message;
      } catch (e) {
        db.ok = false;
        db.error = String(e);
      }
    } else {
      db.ok = false;
      db.error = "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";
    }

    // ingest modul betöltése
    let ingest = {};
    try {
      const mod = await import("../ingest.mjs");
      const fn = mod.runIngest || mod.default;
      ingest.loaded = true;
      ingest.hasRunIngest = typeof fn === "function";
    } catch (e) {
      ingest.loaded = false;
      ingest.error = String(e);
    }

    const ok = env.hasUrl && env.hasRoleKey && db.ok && ingest.loaded && ingest.hasRunIngest;

    return res.status(ok ? 200 : 500).json({
      ok,
      env,
      db,
      ingest,
      version: process.env.VERCEL_GIT_COMMIT_SHA || null,
      time: new Date().toISOString(),
      duration_ms: Date.now() - started,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
};
