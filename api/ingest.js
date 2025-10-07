// api/ingest.js
module.exports = async (req, res) => {
  try {
    if (process.env.CRON_TOKEN) {
      const token = req.query?.token;
      if (token !== process.env.CRON_TOKEN) {
        return res.status(401).json({ ok:false, error:"unauthorized" });
      }
    }

    const dry = req.query?.dry === "1";
    const src = req.query?.src || "all"; // rss | biz | all
    const limit = Number.parseInt(req.query?.limit) || undefined;
    const rssLimitPerFeed = Number.parseInt(req.query?.rssLimitPerFeed) || undefined;

    const mod = await import("../ingest.mjs");
    const runIngest = mod.runIngest || mod.default;

    const result = await runIngest({ dry, src, limit, rssLimitPerFeed });
    return res.status(200).json(result ?? { ok:true, note:"empty result" });
  } catch (e) {
    console.error("[/api/ingest] error:", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || String(e),
      details: e?.details || e?.hint || e?.code || e?.response?.data || null
    });
  }
};