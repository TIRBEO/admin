import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { sendBroadcast } from "@/lib/notifications";

/** POST /api/notification-broadcast — send a product update.
 *
 *  A local door like the reply box: it forwards the operator's session to the
 *  account API's broadcast endpoint. The API decides who is eligible and
 *  refuses an audience too large for one request, so nothing is sent and a
 *  refusal is what this door reports back — it does not retry or half-send. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    message?: unknown;
    ctaUrl?: unknown;
    ctaLabel?: unknown;
  } | null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const ctaUrl = typeof body?.ctaUrl === "string" ? body.ctaUrl.trim() : "";
  const ctaLabel = typeof body?.ctaLabel === "string" ? body.ctaLabel.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "A broadcast needs a title." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "A broadcast needs a message." }, { status: 400 });
  }

  const result = await sendBroadcast({ title, message, ctaUrl, ctaLabel });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  revalidatePath("/admin/notifications");
  return NextResponse.json({ ok: true, sent: result.sent, failed: result.failed, notSent: result.notSent, total: result.total });
}
