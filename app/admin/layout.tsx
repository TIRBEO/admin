import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell, type Operator } from "@/components/admin-shell";
import { readMe } from "@/lib/permissions";
import { signInUrl } from "@/lib/sign-in";

/* The door, not the decoration.

   Every screen below this one asks the API for permission and draws a refusal
   when it is not granted. That is correct but not enough: an operator who has
   not signed in would still be handed the whole console — rail, header, the
   names of every section — around a page full of "no". The layout is the one
   place that can decide whether this console should be on the screen at all,
   so it decides, and an unauthenticated visitor is sent to accounts instead.

   `/admin/me` is the only read here because it answers both questions at once:
   401 there means nobody is signed in, 403 means somebody is who is not staff.
   A refused layout is drawn without the shell for the same reason the signed-out
   one is: chrome is what makes a page look like it belongs to you.

   The permission set travels with the identity because the rail is drawn from
   it. It is the same answer the pages get from `lib/permissions.ts`, and that
   read is request-cached, so asking here costs nothing extra. */

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const me = await readMe();

  // 401 — no session reached the API. Send them to accounts and come back here.
  if (me.status === 401) redirect(await signInUrl("/admin"));

  // Somebody signed in but the API answered with something else: the account is
  // not staff (403), the API is down (0), or it said no for a reason we can
  // show. None of those belong in the console.
  if (!me.ok || !me.data?.email || !me.data?.role) {
    return (
      <Refusal
        status={me.status}
        email={me.data?.email ?? null}
        signInHref={me.status === 0 ? null : await signInUrl("/admin")}
      />
    );
  }

  const operator: Operator = {
    id: me.data.id,
    email: me.data.email,
    name: me.data.name ?? null,
    role: me.data.role.label,
    purpose: me.data.role.purpose,
    permissions: me.data.permissions ?? {},
  };

  return <AdminShell operator={operator}>{children}</AdminShell>;
}

/* Three failures, three different fixes, and only one of them is "sign in".
 * Telling them apart is the whole point: an operator who is told to sign in
 * when the API is stopped will sign in again and again. */
function Refusal({
  status,
  email,
  signInHref,
}: {
  status: number;
  email: string | null;
  signInHref: string | null;
}) {
  const signedInButNotStaff = status === 403 || (!!email && status !== 0);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-md rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-7 shadow-[var(--shadow-plate)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-4)]">
          Tirbeo Console
        </p>
        <h1 className="mt-3 text-[19px] font-bold tracking-[-0.02em] text-[var(--fg)]">
          {signedInButNotStaff ? "This account is not staff" : "The console cannot confirm you"}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
          {signedInButNotStaff ? (
            <>
              {email} is signed in, but the console only opens for an account an
              owner has granted a role. Somebody with that power needs to add
              you; signing in again will not change it.
            </>
          ) : status === 0 ? (
            <>
              The API did not answer, so nothing here can be shown as yours. It is
              either stopped or this host cannot reach it — the console is not the
              part that is down.
            </>
          ) : (
            <>
              The console could not establish who is reading, and it will not show you
              staff data it cannot attribute to anybody. Start at the sign-in page
              below.
            </>
          )}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link href="/" className="btn btn-quiet btn-sm">
            Try again
          </Link>
          {signInHref ? (
            <Link href={signInHref} className="btn btn-primary btn-sm">
              Sign in at accounts
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
