import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { grantRole, revokeRole } from "@/lib/staff";

/* /api/staff — the roster, through the console's own door.

   Two methods, both of which the account API will refuse unless the operator is
   an owner; this file only shapes the body and says which screen to redraw. The
   refusal text comes from the API because the API is the one that knows whether
   this is the last owner, and inventing a friendlier sentence here would be
   inventing a fact. */

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    userId?: unknown;
    role?: unknown;
    note?: unknown;
  } | null;

  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const role = typeof body?.role === "string" ? body.role.trim() : "";
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;

  // The role list is not copied in here. The API owns it — it is the same code
  // that enforces it — and a second list in this file is one rename away from
  // refusing a role that exists.
  if (!userId || !role) {
    return NextResponse.json({ error: "An account and a role are both required." }, { status: 400 });
  }

  const result = await grantRole({ userId, role, note });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 422 });
  }

  revalidatePath("/admin/staff");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!userId) return NextResponse.json({ error: "An account is required." }, { status: 400 });

  const result = await revokeRole(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 422 });
  }

  revalidatePath("/admin/staff");
  return NextResponse.json({ ok: true });
}
