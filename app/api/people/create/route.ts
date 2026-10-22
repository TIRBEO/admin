import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { createAccount } from "@/lib/person";

/** POST /api/people/create — provision an account from the console.
 *
 *  The reply is forwarded whole, because the temporary password the API hands
 *  back exists only in this response: it is hashed on the way in and never
 *  stored in a readable form, so a door that dropped it would leave the
 *  operator with an account nobody can sign into. Nothing here logs it either.
 *
 *  A refusal carries the API's own sentence and its own status. "This Tirbeo
 *  username is already taken" is a fact about one field, and the operator who
 *  reads it knows which field to change. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const text = (key: string) => {
    const v = body?.[key];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };

  const payload = {
    email: text("email"),
    username: text("username"),
    name: text("name"),
    recoveryEmail: text("recoveryEmail"),
    adminRole: body?.adminRole === null ? null : text("adminRole"),
    sendEmail: typeof body?.sendEmail === "boolean" ? body.sendEmail : true,
  };

  if (!payload.email && !payload.username) {
    return NextResponse.json(
      { error: "An email or a Tirbeo username is required." },
      { status: 400 },
    );
  }

  const result = await createAccount(payload);

  if (!result.ok) {
    const data = result.data as { error?: string } | null;
    return NextResponse.json(
      { error: data?.error ?? `The API answered ${result.status}.` },
      // The API's refusal is the informative one; anything else (an unreachable
      // API, a redirect) is a bad gateway from this door's point of view.
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  revalidatePath("/admin/people");
  return NextResponse.json(result.data ?? {}, { status: 201 });
}
