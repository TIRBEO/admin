import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { decideAppeal } from "@/lib/appeals";

/** PUT /api/appeals/decide — rule on an appeal from the panel.
 *
 *  The queue is a server component, so a write needs a door. It forwards the
 *  operator's own session to the account API (lib/api.ts), which is what makes
 *  the verdict, the audit event and the notification to the account all happen
 *  in one place rather than being remembered by hand. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    decision?: unknown;
  } | null;

  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const decision = typeof body?.decision === "string" ? body.decision.trim() : "";

  // The API accepts only these two verdicts; "pending" is an unanswered
  // appeal's state, not something an operator can file.
  if (!id || (decision !== "upheld" && decision !== "overturned")) {
    return NextResponse.json({ error: "An appeal id and a verdict (upheld or overturned) are required." }, { status: 400 });
  }

  const result = await decideAppeal({ id, decision });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  // The row an operator is standing on has already rendered; without this the
  // appeal would still read "pending" until they navigate away and back.
  revalidatePath("/admin/appeals");
  return NextResponse.json({ ok: true, restrictionLifted: result.restrictionLifted });
}
