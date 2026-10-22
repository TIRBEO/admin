import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { saveVerificationLimit } from "@/lib/limits";

/** PUT /api/verification-limits — change how often a method may send a code.
 *
 *  The account API upserts keyed on `method`, so this both edits a stored cap
 *  and creates one for a method that has no row yet. `windowMs` defaults to the
 *  API's own fifteen minutes when it is left out. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    method?: unknown;
    max?: unknown;
    windowMs?: unknown;
  } | null;

  const method = typeof body?.method === "string" ? body.method.trim() : "";
  const max = typeof body?.max === "number" ? body.max : Number.NaN;
  const windowMs = typeof body?.windowMs === "number" ? body.windowMs : undefined;

  if (!method || !Number.isFinite(max) || max < 1) {
    return NextResponse.json({ error: "A method and an attempt count of at least 1 are required." }, { status: 400 });
  }

  const result = await saveVerificationLimit({ method, max, windowMs: windowMs ?? 15 * 60 * 1000 });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  revalidatePath("/admin/limits");
  return NextResponse.json({ ok: true });
}
