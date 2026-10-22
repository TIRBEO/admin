import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { runPersonAction, type PersonAction } from "@/lib/person";

/** POST /api/people/action — ban, unban, suspend or unsuspend one account.
 *
 *  Four doors would be four files that differ only in a word, so the action is
 *  named in the body and checked against the list the API actually has. The
 *  operator's own session is what the account API authenticates, which is what
 *  makes "who did this" a row on the trail rather than a shared credential. */
const ACTIONS: PersonAction[] = ["ban", "unban", "suspend", "unsuspend"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const id = typeof body?.id === "string" && body.id.trim() ? body.id.trim() : "";
  const action = typeof body?.action === "string" ? body.action : "";

  if (!id || !ACTIONS.includes(action as PersonAction)) {
    return NextResponse.json({ error: "An account and one of the four actions are needed." }, { status: 400 });
  }

  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined;
  const days = Number(body?.days);
  // The API clamps a suspension to 1–365 days; anything outside that here would
  // be sent as no duration at all, which is an indefinite suspension — a
  // heavier decision than the number in the box suggests.
  const duration = Number.isFinite(days) && days >= 1 && days <= 365 ? Math.floor(days) : undefined;

  const result = await runPersonAction(id, action as PersonAction, { reason, days: duration });

  if (!result.ok) {
    const data = result.data as { error?: string } | null;
    return NextResponse.json(
      { error: data?.error ?? `The API answered ${result.status}.` },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  revalidatePath("/admin/people");
  revalidatePath(`/admin/people/${id}`);
  return NextResponse.json({ ok: true, until: result.data?.until ?? null });
}
