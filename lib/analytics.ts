import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { Severity } from "@/lib/types";

/** The Analytics screen's one read: GET /api/admin/analytics.
 *
 *  Everything the door answers is a query over the live tables inside a fixed
 *  30-day window, and that window is the door's decision rather than ours — so
 *  every figure on the screen carries it. A number from a screen that does not
 *  say over what period it was counted is a number nobody can compare.
 *
 *  Two fields the door returns are deliberately not read here. `totalMedia` is
 *  a literal `0` in the handler, and `auditByResult` reports the same count
 *  three times over with a `failure` arm that is hardcoded to zero — printing
 *  either as a measurement would tell an operator something had been counted
 *  when it had only been written down. What is left is real: how many accounts
 *  exist, how many arrive per day, what the ledger mostly records, and the
 *  newest rows in it.
 *
 *  `usersByDay` and `activityByDay` are a `groupBy` on the timestamp column
 *  itself, not on a day, so the door hands back one row per distinct instant —
 *  almost always a count of one. Bucketing them into calendar days happens here
 *  and nowhere else; it adds nothing up that the door did not report. */

const WINDOW_DAYS = 30;

type ApiActor = { id?: string; email?: string; name?: string | null } | null;

type ApiLedgerRow = {
  id: string;
  userId: string | null;
  kind: string;
  title: string;
  detail: string | null;
  severity: Severity;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  /** The same `user` relation under another name, flattened by the handler. */
  actor?: ApiActor;
  user?: { id?: string; email?: string; name?: string | null } | null;
};

type ApiStamped = { createdAt: string; _count?: { createdAt?: number } };

type ApiAnalytics = {
  totalUsers?: number;
  adminUsers?: number;
  newToday?: number;
  totalNotifications?: number;
  auditByResult?: { total?: number };
  topActions?: Array<{ action?: string; count?: number }>;
  recentAudit?: ApiLedgerRow[];
  usersByDay?: ApiStamped[];
  activityByDay?: ApiStamped[];
};

export type DayCount = {
  /** The UTC calendar day this bucket covers, e.g. 2026-10-05. */
  day: string;
  label: string;
  count: number;
};

export type LedgerRow = {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  severity: Severity;
  ipAddress: string | null;
  createdAt: string;
  /** Whose account the row is about. The door gives no reference code for a
      ledger row, so this is the only handle there is — and it is a link, not
      a string to quote. */
  personId: string | null;
  personLabel: string;
};

export type AnalyticsSnapshot = {
  windowDays: number;
  accounts: { total: number; admins: number; newToday: number };
  notifications: number;
  /** Ledger rows in the window. The door's own `auditByResult.total`. */
  ledgerRows: number;
  topActions: Array<{ action: string; count: number }>;
  recent: LedgerRow[];
  signupsByDay: DayCount[];
  activityByDay: DayCount[];
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function rows<T>(v: T[] | undefined): T[] {
  return Array.isArray(v) ? v : [];
}

/** Bucket the door's per-instant rows into days.
 *
 *  UTC, on both sides: the door computed its 30-day window on the server clock,
 *  and a label rendered in the reader's timezone would move a row into the day
 *  before or after the one its count belongs to. */
function byDay(raw: ApiStamped[] | undefined): DayCount[] {
  const buckets = new Map<string, number>();
  for (const row of rows(raw)) {
    const at = typeof row.createdAt === "string" ? row.createdAt : "";
    const day = at.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    buckets.set(day, (buckets.get(day) ?? 0) + Math.max(1, num(row._count?.createdAt)));
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, count]) => ({
      day,
      count,
      label: new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
      }),
    }));
}

function actorName(row: ApiLedgerRow): string | null {
  return row.actor?.name ?? row.user?.name ?? null;
}

function toLedger(row: ApiLedgerRow): LedgerRow {
  const email = row.actor?.email ?? row.user?.email ?? null;
  return {
    id: row.id,
    kind: row.kind,
    title: row.title ?? row.kind,
    detail: row.detail ?? null,
    severity: (row.severity ?? "info") as Severity,
    ipAddress: row.ipAddress ?? null,
    createdAt: row.createdAt,
    personId: row.userId ?? row.actor?.id ?? row.user?.id ?? null,
    personLabel: actorName(row) ?? email ?? row.userId ?? "system",
  };
}

export async function readAnalytics(): Promise<Load<AnalyticsSnapshot>> {
  const result = await apiGet<ApiAnalytics>("/admin/analytics");

  if (!result.ok) return apiFailure(result);
  if (!result.data) return { status: "error", message: "The API answered with no snapshot in it." };

  const d = result.data;
  return {
    status: "ready",
    data: {
      windowDays: WINDOW_DAYS,
      accounts: {
        total: num(d.totalUsers),
        admins: num(d.adminUsers),
        newToday: num(d.newToday),
      },
      notifications: num(d.totalNotifications),
      ledgerRows: num(d.auditByResult?.total),
      topActions: rows(d.topActions).map((a) => ({ action: a.action ?? "unknown", count: num(a.count) })),
      recent: rows(d.recentAudit).map(toLedger),
      signupsByDay: byDay(d.usersByDay),
      activityByDay: byDay(d.activityByDay),
    },
  };
}
