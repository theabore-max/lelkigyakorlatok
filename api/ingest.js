// api/ingest.js
module.exports = async (req, res) => {
  try {
    if (process.env.CRON_TOKEN) {
      const token = req.query?.token;
      if (token !== process.env.CRON_TOKEN) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
      }
    }

    const dry = req.query?.dry === "1";

    const mod = await import("../ingest.mjs");
    const runIngest = mod.runIngest || mod.default;
    if (typeof runIngest !== "function") {
      throw new Error("runIngest export not found");
    }

    const result = await runIngest({ dry });
    const payload = result ?? { ok: true, note: "empty result" };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(payload));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: String(e) }));
  }
};
