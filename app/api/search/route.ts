import { NextResponse } from "next/server";

import { apiSend } from "@/lib/api";

/** GET /api/search?q= — the console's global search, relayed.
 *
 *  The account API owns who may read it, so this door forwards the operator's
 *  own session rather than the console keeping a second index that would
 *  always be a moment out of date. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ users: [] });

  const result = await apiSend<{ users?: unknown[] }>(`/admin/search?q=${encodeURIComponent(q)}`);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.data && "error" in result.data ? result.data.error : "The API refused the search." },
      { status: result.status || 502 },
    );
  }
  return NextResponse.json({ users: result.data?.users ?? [] });
}
