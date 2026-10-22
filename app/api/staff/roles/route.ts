import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { saveDelta } from "@/lib/staff";

/* POST /api/staff/roles — replace one role's permission delta.

   The body is `{ role, grant, revoke }` and both lists go over every time,
   because a merge would leave a permission ticking away in the stored value
   after somebody unticked it. Which keys are real, and whether this operator
   may write the owner's row at all, is the API's call: it refuses an unrecognised
   permission rather than dropping it, and that refusal is what comes back here. */

function list(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((p): p is string => typeof p === "string" && !!p.trim()).map((p) => p.trim()))];
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    role?: unknown;
    grant?: unknown;
    revoke?: unknown;
  } | null;

  const role = typeof body?.role === "string" ? body.role.trim() : "";
  if (!role) return NextResponse.json({ error: "A role is required." }, { status: 400 });

  const grant = list(body?.grant);
  const revoke = list(body?.revoke);
  const both = grant.filter((p) => revoke.includes(p));
  if (both.length) {
    // A permission listed twice is not "granted and revoked" in some order —
    // it is a form submitted with two boxes ticked. The API would resolve it as
    // revoked, so the screen says so instead of writing it quietly.
    return NextResponse.json(
      { error: `“${both.join(", ")}” is ticked as both granted and revoked. Pick one.` },
      { status: 400 },
    );
  }

  const result = await saveDelta({ role, grant, revoke });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 422 });
  }

  revalidatePath("/admin/staff");
  return NextResponse.json({ ok: true });
}
