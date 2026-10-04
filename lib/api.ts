/** Server-side calls to the Tirbeo API.
 *
 * Every admin page reads through here so that: the origin lives in one
 * place, the operator's own session is what proves they are allowed to
 * read, a non-2xx becomes a typed error rather than a blank screen,
 * and an expired session says so instead of rendering zeros.
 *
 * The session matters more than it looks. The API authenticates admin
 * routes from the httpOnly `__session` cookie. A server component has no
 * browser to send it for us, so without the forwarding below every page
 * renders the same 401 — the panel looks broken while the API is fine. */

import { cookies } from "next/headers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://api.tirbeo.com");

/** The cookie the API reads the session from, and the double-submit
 *  companion every state-changing request has to echo back. */
const SESSION_COOKIE = "__session";
const CSRF_COOKIE = "__csrf";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** True when the caller is not (or no longer) an admin. */
  get isUnauthorised(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
};

/** Turn the incoming request's cookies into the ones the API will accept. */
async function authHeaders(
  method: string,
): Promise<Record<string, string>> {
  const jar = await cookies();
  const headers: Record<string, string> = {};

  const session = jar.get(SESSION_COOKIE)?.value;
  if (session) headers.Cookie = `${SESSION_COOKIE}=${session}`;

  // Reads need nothing else. Writes are cookie-authed too, so the API
  // requires the CSRF cookie to come back in a header — otherwise a page
  // on any origin could ride this session.
  if (method !== "GET" && method !== "HEAD") {
    const csrf = jar.get(CSRF_COOKIE)?.value;
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  return headers;
}

/** Call the API, mapping every outcome onto ApiResult — never throwing. */
export async function apiSend<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
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
      // Admin data is per-request truth: never serve it from a cache.
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
    // The API being down is a normal state for this page, not an exception:
    // an operator should read "cannot reach the API", not a stack trace.
    return { ok: false, status: 0, data: null };
  }
}

export function apiGet<T>(path: string, init: RequestInit = {}) {
  return apiSend<T>(path, { ...init, method: "GET" });
}

export function apiPost<T>(path: string, body: unknown) {
  return apiSend<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body: unknown) {
  return apiSend<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Pull the first human-readable message out of an unknown API payload. */
export function errorMessage(result: ApiResult<unknown>): string {
  if (result.status === 0) return "Cannot reach the API.";
  const d = result.data as { error?: unknown } | null;
  if (d && typeof d.error === "string" && d.error) return d.error;
  return `Request failed (${result.status}).`;
}

/** Read a number out of an untrusted payload, or null. Admin dashboards
 *  show a dash rather than a zero when a figure is genuinely absent, so a
 *  missing field and a real 0 never look the same. */
export function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Read a count out of a possibly-missing group, defaulting to 0. */
export function countOf(v: unknown): number {
  return num(v) ?? 0;
}