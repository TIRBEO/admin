import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { ActivityEvent, OnlineUser, Severity } from "@/lib/types";

/** The Activity screen's one read: GET /api/admin/activity.
 *
 *  The ledger is `activity_events`, and everything that happens to an account
 *  lands there — a sign-in, a password change, and now the admin alerts the
 *  mailers send, so an operator watching this screen sees the alert at the
 *  moment it fires rather than when the inbox catches up.
 *
 *  The door answers in its own words: rows come back as `logs`, presence as
 *  `onlineUsers`, and every row carries the short `ref` an operator quotes.
 *  That translation happens here and nowhere else, so a second screen reading
 *  the same ledger cannot invent its own mapping. */

type ApiLog = {
  id: string;
  userId: string | null;
  kind: string;
  title: string;
  detail: string | null;
  severity: Severity;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  ref: string;
};

type ApiOnline = {
  user: { id: string; email: string; name: string | null; photoUrl: string | null } | null;
  lastUsedAt: string | null;
};

type ApiActivity = { logs?: ApiLog[]; onlineUsers?: ApiOnline[] };

export type ActivityFilter = {
  severity: Severity | "";
  limit: number;
};

function toEvent(row: ApiLog): ActivityEvent {
  return {
    id: row.id,
    userId: row.userId ?? null,
    kind: row.kind,
    title: row.title,
    detail: row.detail ?? null,
    severity: row.severity,
    ipAddress: row.ipAddress ?? null,
    userAgent: row.userAgent ?? null,
    createdAt: row.createdAt,
    ref: row.ref ?? row.id.slice(0, 8),
  };
}

function toOnline(row: ApiOnline): OnlineUser | null {
  if (!row.user) return null;
  if (!row.lastUsedAt) return null;
  return {
    userId: row.user.id,
    at: row.lastUsedAt,
    path: null,
  };
}

export async function readActivity(
  filter: ActivityFilter,
): Promise<Load<{ events: ActivityEvent[]; online: OnlineUser[] }>> {
  const params = new URLSearchParams({ limit: String(filter.limit) });
  if (filter.severity) params.set("severity", filter.severity);

  const result = await apiGet<ApiActivity>(`/admin/activity?${params.toString()}`);

  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.logs)) {
    return { status: "error", message: "The API answered with no ledger in it." };
  }

  const events = result.data.logs.map(toEvent);
  const online = (result.data.onlineUsers ?? [])
    .map(toOnline)
    .filter((o): o is OnlineUser => o !== null);

  if (events.length === 0) return { status: "empty" };
  return { status: "ready", data: { events, online } };
}

/** Three refusals, three sentences — the same reading the People screen uses,
 *  because an operator who is told "something went wrong" learns nothing. */
