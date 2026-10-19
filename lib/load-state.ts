/* Every screen in this build is fed by fixtures, so there is no request to
   fail, no latency to wait on and no empty table to reach by chance. Rather
   than invent a data layer to fake those states, a page reads which one it
   should draw off the URL: `?state=error`. That keeps the branches real,
   reviewable and linkable, and costs nothing to delete once fetches return.
   See page-header.tsx for the dev-only pills that write this param. */

export type LoadState = "ready" | "loading" | "empty" | "error";

export type Load<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

const STATES: LoadState[] = ["ready", "loading", "empty", "error"];

/** Next gives searchParams as possibly-arrayed strings; the first value wins. */
export function readState(
  searchParams: Record<string, string | string[] | undefined>,
): LoadState {
  const raw = searchParams.state;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return STATES.includes(value as LoadState) ? (value as LoadState) : "ready";
}

/** Ready fixtures behind whichever branch the URL asks for. */
export function present<T>(
  state: LoadState,
  data: T,
  opts?: { empty?: boolean; message?: string },
): Load<T> {
  switch (state) {
    case "loading":
      return { status: "loading" };
    case "error":
      return { status: "error", message: opts?.message ?? MOCK_ERROR };
    case "empty":
      return { status: "empty" };
    default:
      return isEmpty(data, opts?.empty) ? { status: "empty" } : { status: "ready", data };
  }
}

function isEmpty(data: unknown, explicit?: boolean) {
  if (explicit !== undefined) return explicit;
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items: unknown }).items;
    return Array.isArray(items) && items.length === 0;
  }
  return false;
}

/** The static error copy a screen shows when the API is not behind it. */
export const MOCK_ERROR =
  "Nothing to fetch: this console is UI-only, so a real request cannot fail here yet.";
