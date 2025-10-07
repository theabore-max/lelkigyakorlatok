// api/ingest.js
module.exports = async (req, res) => {
  try {
    // opcionális védelem
    if (process.env.CRON_TOKEN) {
      const token = req.query?.token;
      if (token !== process.env.CRON_TOKEN) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
    }

    const dry = req.query?.dry === "1";

    // Dinamikus import (ESM modul a gyökérből)
    const mod = await import("../ingest.mjs");
    const runIngest = mod.runIngest || mod.default;
    if (typeof runIngest !== "function") {
      throw new Error("runIngest export not found");
    }

    const result = await runIngest({ dry });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
};
