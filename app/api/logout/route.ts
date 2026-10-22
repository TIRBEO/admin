import { NextResponse } from "next/server";

import { apiRelay } from "@/lib/api";

/** POST /api/logout — end the operator's session in the console.
 *
 *  The API holds the authority (the session row that gets revoked) and the
 *  browser holds the cookies, so this relays both halves: the call goes to the
 *  API with the operator's own session, and whatever the API answered by way of
 *  `Set-Cookie` goes straight back to this browser. A signed-out console that
 *  still paints the operator's name in the top bar is the failure this avoids. */
export async function POST() {
  const { status, setCookie } = await apiRelay("/admin/logout", { method: "POST" });

  if (status === 0) {
    return NextResponse.json(
      { error: "The API never answered, so nothing was revoked. The session is still live." },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ ok: status === 200, signedOutAt: new Date().toISOString() });
  for (const cookie of setCookie) res.headers.append("set-cookie", cookie);
  return res;
}
