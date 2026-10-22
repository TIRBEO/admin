/** Server-side calls to the Tirbeo API.
 *
 * Every wired admin page reads through here so that the origin lives in one
 * place, the operator's own session is what proves they may read, and a
 * non-2xx arrives as a typed result rather than a blank screen.
 *
 * The session matters more than it looks. The API authenticates admin routes
 * from the httpOnly `__session` cookie, and a server component has no browser
 * to send it for us — without the forwarding below every page renders the
 * same 401 while the API is perfectly fine. */

import { cookies } from "next/headers";

import type { LoadError } from "@/lib/load-state";

/** The API refuses a cookie-authed write that does not echo `__csrf` back in
 *  a header, so both names belong here and nowhere else. */
const SESSION_COOKIE = "__session";
const CSRF_COOKIE = "__csrf";

const API_URL = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  // A loopback value is a development setting. Ignoring it outside development
  // is what keeps a preview build from calling (or redirecting to) localhost.
  const loopback = !!fromEnv && /localhost|127\.0\.0\.1/.test(fromEnv);
  if (loopback && process.env.NODE_ENV !== "development") return "https://api.tirbeo.com";
  return (
    fromEnv ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://api.tirbeo.com")
  );
})();

export type ApiResult<T> = {
  ok: boolean;
  /** 0 means the request never got an answer — the API is down or unreachable,
      which is a different problem from a refusal and reads differently. */
  status: number;
  data: T | null;
};

async function authHeaders(method: string): Promise<Record<string, string>> {
  const jar = await cookies();
  const headers: Record<string, string> = {};

  const session = jar.get(SESSION_COOKIE)?.value;
  if (session) headers.Cookie = `${SESSION_COOKIE}=${session}`;

  // Reads need nothing else. Writes are cookie-authed too, so the CSRF cookie
  // has to come back as a header or any other origin could ride this session.
  if (method !== "GET" && method !== "HEAD") {
    const csrf = jar.get(CSRF_COOKIE)?.value;
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  return headers;
}

/** Call the API. Never throws: an operator should read "cannot reach the API",
 *  not a stack trace. */
export async function apiSend<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const method = init.method ?? "GET";
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...init,
      method,
      headers: {
        Accept: "application/json",
        ...(await authHeaders(method)),
        ...(init.headers ?? {}),
      },
      // Admin data is per-request truth — never served from a cache.
      cache: "no-store",
    });

    const text = await res.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = null;
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export function apiGet<T>(path: string, init: RequestInit = {}) {
  return apiSend<T>(path, { ...init, method: "GET" });
}

/** The API's answer with its headers intact — for the one call whose reply has
 *  to reach the browser. Logout clears a session by `Set-Cookie`, and the
 *  attributes (domain, path, secure) are the API's decision; re-typing them
 *  here would make this a second place they can be gotten wrong. */
export async function apiRelay(path: string, init: RequestInit = {}): Promise<{ status: number; setCookie: string[] }> {
  const method = init.method ?? "GET";
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...init,
      method,
      headers: { ...(await authHeaders(method)), ...(init.headers ?? {}) },
      cache: "no-store",
    });
    return { status: res.status, setCookie: res.headers.getSetCookie() };
  } catch {
    return { status: 0, setCookie: [] };
  }
}

/** The first human-readable message in an unknown API payload. */
export function errorMessage(result: ApiResult<unknown>): string {
  if (result.status === 0) return "Cannot reach the API.";
  const d = result.data as { error?: unknown } | null;
  if (d && typeof d.error === "string" && d.error) return d.error;
  return `The API answered ${result.status}.`;
}

/** A failed read, in the shape a screen draws.
 *
 *  The three failures an operator actually hits are told apart on purpose:
 *  the API being unreachable, the operator being signed out, and the operator
 *  being signed in as somebody whose role does not cover this screen each need
 *  a different fix, and a screen that shows them all as "error" sends people to
 *  the wrong one.
 *
 *  For a refusal the API's own sentence is used rather than one written here.
 *  The guard knows which permission was missing and the role it belongs to;
 *  this file knows neither, and guessing "you are not an admin" for a Moderator
 *  who asked for a staff screen tells the operator something untrue. */
export function apiFailure(result: ApiResult<unknown>): LoadError {
  const fromApi = (result.data as { error?: unknown } | null)?.error;
  const refusal = typeof fromApi === "string" && fromApi.trim() ? fromApi.trim() : null;

  const message =
    result.status === 0
      ? "The API never answered. It is either stopped or this host cannot reach it."
      : result.status === 401
        ? "The API refused this read because no session came with the request."
        : result.status === 403
          ? (refusal ?? "This account is staff, but its role does not cover this screen.")
          : (refusal ?? `The API answered ${result.status}.`);

  const reason =
    result.status === 0
      ? "unreachable"
      : result.status === 401
        ? "signed-out"
        : result.status === 403
          ? "not-permitted"
          : undefined;

  return { status: "error", message, reason };
}
