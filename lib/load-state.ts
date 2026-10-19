/* A screen can be waiting, legitimately empty, or failed — and the three need
   drawing, because a table that renders nothing cannot tell an operator
   whether the filter matched nobody or the API never answered.

   `?state=` still drives those branches on the screens fed by fixtures: with
   no request to fail, the URL is the only honest way to reach an error. A
   wired screen drops it and reports what actually happened instead. See
   page-header.tsx for the dev-only pills that write the param. */

import type { ReactNode } from "react";

export type LoadState = "ready" | "loading" | "empty" | "error";

/** Which kind of failure this is. A signed-out operator, an operator who is
    not an admin, and an API that never answered are three different problems
    with three different fixes, so the screen gets to say which one it is
    showing rather than guessing from the message text. */
export type FailureReason = "signed-out" | "not-admin" | "unreachable";

export type LoadError = {
  status: "error";
  message: string;
  reason?: FailureReason;
  action?: ReactNode;
};

export type Load<T> =
  | { status: "loading" }
  | { status: "empty" }
  | LoadError
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
