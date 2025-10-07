// api/ingest.js
module.exports = async (req, res) => {
  try {
    // --- auth token (opcionális) ---
    if (process.env.CRON_TOKEN) {
      const token = req.query?.token;
      if (token !== process.env.CRON_TOKEN) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
    }

    const dry = req.query?.dry === "1";

    console.log("[/api/ingest] start", { dry, ts: new Date().toISOString() });

    // --- ESM modul betöltése a gyökérből ---
    const mod = await import("../ingest.mjs");
    console.log("[/api/ingest] module exports:", Object.keys(mod));

    const runIngest = mod.runIngest || mod.default;
    if (typeof runIngest !== "function") {
      throw new Error("runIngest export not found in ingest.mjs");
    }

    const result = await runIngest({ dry });
    console.log("[/api/ingest] done", { ts: new Date().toISOString() });

    return res.status(200).json(result ?? { ok: true, note: "empty result" });
  } catch (e) {
    console.error("[/api/ingest] error", e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
};
