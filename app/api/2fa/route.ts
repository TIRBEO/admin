import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { apiSend, errorMessage } from "@/lib/api";

/* POST /api/2fa — the console's door onto the operator's own two-factor.

   The account screen is a server component, so a write needs a route like this
   one to carry the operator's session and CSRF token through lib/api. It does
   not reinterpret the request: the account API dispatches on `body._action`,
   so the body is forwarded whole and the reply handed straight back — including
   the secret, the URI and the recovery codes, which arrive exactly once, at the
   moment they are generated, and are never stored anywhere the console reads. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof (body as { _action?: unknown })._action !== "string") {
    return NextResponse.json({ error: "No 2FA action came with the request." }, { status: 400 });
  }

  const result = await apiSend("/admin/2fa", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return NextResponse.json({ error: errorMessage(result) }, { status: result.status || 502 });
  }

  revalidatePath("/admin/account");
  return NextResponse.json(result.data ?? { ok: true });
}
