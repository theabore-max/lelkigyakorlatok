// app/api/ingest/route.js
// Next.js App Router (ESM). Vercel Cronból GET-tel hívható.
// Query: ?dry=1 → próba, nem ír DB-be

import { NextResponse } from "next/server";
import { runIngest } from "../../../ingest.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const dry = searchParams.get("dry") === "1";

  try {
    const result = await runIngest({ dry });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
