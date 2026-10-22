import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { markNotificationsRead } from "@/lib/notifications";

/** POST /api/notification-read — mark a notice, or the whole inbox, read.
 *
 *  With an `id` it clears one; without one it clears the operator's inbox. Both
 *  are one PUT on the account API; the door exists because the page is a server
 *  component and a write has to come through somewhere that carries the
 *  operator's session and CSRF token. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" && body.id.trim() ? body.id.trim() : undefined;

  const result = await markNotificationsRead(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  revalidatePath("/admin/notifications");
  return NextResponse.json({ ok: true });
}
