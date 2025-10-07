// api/ingest.js
export default async function handler(req, res) {
  try {
    // opcionális védelem: token a query-ben
    if (process.env.CRON_TOKEN) {
      const token = req.query?.token;
      if (token !== process.env.CRON_TOKEN) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
    }

    const dry = req.query?.dry === "1";

    // ingest.js az ESM; dinamikus importtal húzzuk be
    const { runIngest } = await import("../ingest.js");
    const result = await runIngest({ dry });

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
