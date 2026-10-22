import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { removeBlock } from "@/lib/blocklist";

/** DELETE /api/blocklist/unblock — lift one block.
 *
 *  The account API addresses a block by (targetType, targetId) — there is no
 *  row id — so the door takes those two and passes them through, forwarding
 *  the operator's session so the removal is written to the audit trail as
 *  theirs. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    targetType?: unknown;
    targetId?: unknown;
  } | null;

  const targetType = typeof body?.targetType === "string" ? body.targetType.trim() : "";
  const targetId = typeof body?.targetId === "string" ? body.targetId.trim() : "";

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Both the target type and the target are required." }, { status: 400 });
  }

  const result = await removeBlock({ targetType, targetId });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  revalidatePath("/admin/blocklist");
  return NextResponse.json({ ok: true });
}
