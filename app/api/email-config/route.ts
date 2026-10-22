import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { saveEmailConfig } from "@/lib/email-config";

/** PUT /api/email-config — save the mail provider settings.
 *
 *  The screen is a server component, so the write needs one door like this:
 *  it forwards the operator's session to the account API and revalidates the
 *  config page so the roles table and the "key set" word reflect the save
 *  rather than the operator's memory of pressing it.
 *
 *  Secret fields arrive blank when an operator does not intend to change them.
 *  `saveEmailConfig` treats a blank as "keep the stored value", so this door
 *  never has to see — or send back — a key to avoid erasing one. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const str = (key: string) => {
    const v = body?.[key];
    return typeof v === "string" ? v : "";
  };

  const provider = str("provider").trim();
  const fromEmail = str("fromEmail").trim();

  if (!provider) {
    return NextResponse.json({ error: "A provider must be named." }, { status: 400 });
  }
  if (!fromEmail) {
    return NextResponse.json({ error: "The default sender address cannot be empty." }, { status: 400 });
  }

  const result = await saveEmailConfig({
    provider,
    apiKey: str("apiKey"),
    smtpHost: str("smtpHost"),
    smtpPort: str("smtpPort"),
    smtpUser: str("smtpUser"),
    smtpPass: str("smtpPass"),
    fromEmail,
    fromName: str("fromName"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  revalidatePath("/admin/email/config");
  return NextResponse.json({ ok: true });
}
