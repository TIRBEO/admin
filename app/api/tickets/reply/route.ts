import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { sendReply } from "@/lib/support";

/** POST /api/tickets/reply — answer a request from the panel.
 *
 *  The admin screens are server components, so a write needs one door like
 *  this. It forwards the operator's own session cookie to the account API
 *  (lib/api.ts), which is what makes "who answered this" a fact on the record
 *  rather than a guess from a shared mailbox. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    ref?: unknown;
    to?: unknown;
    subject?: unknown;
    body?: unknown;
    receivedAt?: unknown;
  } | null;

  const ref = typeof body?.ref === "string" ? body.ref.trim() : "";
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  const receivedAt = typeof body?.receivedAt === "string" ? body.receivedAt : undefined;

  if (!ref || !to || !subject) {
    return NextResponse.json({ error: "The reference, the address and the subject are all needed." }, { status: 400 });
  }
  if (text.length < 2) {
    return NextResponse.json({ error: "Write something before sending it." }, { status: 400 });
  }

  const result = await sendReply({ ref, to, subject, body: text, receivedAt });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  /* The queue and the thread both read live data, but the page an operator is
     standing on is already rendered — without this the row would still say
     "open" until they navigated away and back. */
  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ref}`);
  return NextResponse.json({ ok: true });
}
