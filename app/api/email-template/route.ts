import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { editTemplate } from "@/lib/email-templates";

/** PUT /api/email-template — save a template's subject and body.
 *
 *  The screen is a server component, so a write needs one door like this. It
 *  forwards the operator's own session to the account API, then revalidates
 *  the templates page so the facts printed above the editor (subject, updated
 *  time, slot list) reflect the saved body rather than the operator's memory
 *  of pressing save. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    subject?: unknown;
    htmlBody?: unknown;
  } | null;

  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject : "";
  const htmlBody = typeof body?.htmlBody === "string" ? body.htmlBody : "";

  if (!id) {
    return NextResponse.json({ error: "No template was named to edit." }, { status: 400 });
  }
  if (!subject.trim()) {
    return NextResponse.json({ error: "A mail needs a subject." }, { status: 400 });
  }
  if (!htmlBody.trim()) {
    return NextResponse.json({ error: "The body is empty — there would be nothing to send." }, { status: 400 });
  }

  const result = await editTemplate({ id, subject, htmlBody });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  revalidatePath("/admin/email/templates");
  return NextResponse.json({ ok: true });
}
