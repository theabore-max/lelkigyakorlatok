// ingest.mjs
export async function runIngest({ dry = false } = {}) {
  return { dry, rssCount: 0, bizCount: 0, prepared: 0, unique: 0, written: 0 };
}
export default runIngest;