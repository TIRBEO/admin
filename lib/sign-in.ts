import { headers } from "next/headers";

/** Where the operator signs in, and where they land afterwards.
 *
 *  The accounts app owns the session, and the API sets the cookie on the
 *  parent domain (.tirbeo.com), so signing in on accounts.<parent> is what
 *  makes admin.<parent> authenticated — there is no local sign-in form here.
 *  The origin is derived from the live request host so a preview host can
 *  never bake a localhost or a wrong-domain link into production.
 *  `redirect_to` sends the operator back to the page that refused them;
 *  accounts validates it against its own allow-list, and admin.<parent> is
 *  on it. */
export async function signInUrl(fallback = "/admin"): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim() || "http";

  const parent = host.match(/(?:^|\.)(tirbeo\.(?:com|app))$/i)?.[1]?.toLowerCase();
  const isLoopback = /^localhost(:|$)|^127\.0\.0\.1(:|$)/.test(host);

  let accountsBase: string;
  if (parent) accountsBase = `${proto}://accounts.${parent}`;
  else if (isLoopback) accountsBase = "http://localhost:3002";
  else {
    const explicit = process.env.NEXT_PUBLIC_ACCOUNTS_URL?.replace(/\/+$/, "");
    const usable =
      explicit && !(process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(explicit));
    accountsBase = usable ? explicit : "https://accounts.tirbeo.com";
  }

  const returnTo = sameOriginReturn(h.get("referer"), host, proto, fallback);
  return `${accountsBase}/login?redirect_to=${encodeURIComponent(returnTo)}`;
}

/** Back to the page that refused them when that page is this very origin,
 *  otherwise to the safe dashboard fallback. */
function sameOriginReturn(
  referer: string | null,
  host: string,
  proto: string,
  fallback: string,
): string {
  if (!referer) return `${proto}://${host}${fallback}`;
  try {
    const u = new URL(referer);
    const refHost = u.hostname.toLowerCase();
    if (refHost === host || refHost.endsWith(`.${host}`) || host.endsWith(`.${refHost}`)) {
      return `${proto}://${host}${u.pathname}${u.search}`;
    }
  } catch {
    /* not an absolute URL — fall through */
  }
  return `${proto}://${host}${fallback}`;
}
