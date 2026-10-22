import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { patchPerson } from "@/lib/person";

/** POST /api/people/update — change one account's display name or, for an owner,
 *  what kind of staff it is.
 *
 *  Only the two fields the account door accepts are forwarded. Enforcement is
 *  not here: a ban or a suspension mints a reference code and mails the person,
 *  and that belongs on the action route where the operator has to give a
 *  reason for it.
 *
 *  The role is not validated against a list kept in this file. The role keys are
 *  code server-side and they change; a copy here would be a second authority
 *  that refuses a role the API has. Absent means "leave it alone" and the empty
 *  string means revoke, which is the change an operator reaches for most. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const id = typeof body?.id === "string" && body.id.trim() ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "No account was named." }, { status: 400 });

  const displayName = typeof body?.displayName === "string" && body.displayName.trim()
    ? body.displayName.trim()
    : undefined;

  let adminRole: string | null | undefined;
  if (body?.adminRole === "" || body?.adminRole === null) adminRole = null;
  else if (typeof body?.adminRole === "string" && body.adminRole.trim()) adminRole = body.adminRole.trim();
  else if (body?.adminRole !== undefined) {
    return NextResponse.json({ error: "A role is a name, or nothing at all." }, { status: 400 });
  }

  if (displayName === undefined && adminRole === undefined) {
    return NextResponse.json({ error: "Nothing was changed." }, { status: 400 });
  }

  const result = await patchPerson(id, {
    ...(displayName !== undefined ? { displayName } : {}),
    ...(adminRole !== undefined ? { adminRole } : {}),
  });

  if (!result.ok) {
    const data = result.data as { error?: string } | null;
    return NextResponse.json(
      { error: data?.error ?? `The API answered ${result.status}.` },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  revalidatePath("/admin/people");
  revalidatePath(`/admin/people/${id}`);
  return NextResponse.json({ ok: true, name: result.data?.name ?? null });
}
