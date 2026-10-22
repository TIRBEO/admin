import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { Page, SecurityEventRow, SecurityScore, Severity } from "@/lib/mock/types";

/* ═══════════════════════════════════════════════════════════════════
   The Security events screen, read from the platform.

   GET /admin/security/events is the ledger itself — every anomaly the
   platform noticed, newest first — and GET /admin/security/score is the
   same ledger read as one number. Both are live: this is the screen an
   operator opens because something is wrong, so a rehearsed list of events
   would be worse than no list at all.

   The console's own vocabulary is kept here. The door says `eventType` and
   `page`/`limit`; the console says `type` and `perPage`. The translation
   lives in this file so the page keeps talking the console's language.
   ═══════════════════════════════════════════════════════════════════ */

type ApiEvent = {
  id: string;
  userId: string | null;
  kind?: string;
  eventType?: string;
  title?: string | null;
  detail?: string | null;
  severity?: Severity;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

type ApiList = {
  events?: ApiEvent[];
  total?: number;
  page?: number;
  limit?: number;
};

export type SecurityFilter = {
  severity: Severity | "";
  type: string;
  q: string;
  page: number;
};

const PER_PAGE = 50;

function toRow(row: ApiEvent): SecurityEventRow {
  return {
    id: row.id,
    userId: row.userId ?? null,
    eventType: row.eventType ?? row.kind ?? "unknown",
    severity: (row.severity ?? "info") as Severity,
    ipAddress: row.ipAddress ?? null,
    userAgent: row.userAgent ?? null,
    createdAt: row.createdAt,
  };
}

export async function readSecurityEvents(
  filter: SecurityFilter,
): Promise<Load<Page<SecurityEventRow>>> {
  const params = new URLSearchParams({
    page: String(filter.page),
    limit: String(PER_PAGE),
  });
  if (filter.severity) params.set("severity", filter.severity);
  if (filter.type) params.set("eventType", filter.type);
  if (filter.q) params.set("q", filter.q);

  const result = await apiGet<ApiList>(`/admin/security/events?${params.toString()}`);

  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.events)) {
    return { status: "error", message: "The API answered with no events in it." };
  }

  const data = result.data;
  const rows = data.events ?? [];
  const page: Page<SecurityEventRow> = {
    items: rows.map(toRow),
    total: data.total ?? rows.length,
    page: data.page ?? filter.page,
    perPage: data.limit ?? PER_PAGE,
  };
  return page.items.length === 0 ? { status: "empty" } : { status: "ready", data: page };
}

type ApiScore = {
  score?: number;
  threatLevel?: SecurityScore["threatLevel"];
  factors?: SecurityScore["factors"];
  stats?: Partial<SecurityScore["stats"]>;
  topIPs?: SecurityScore["topIPs"];
  topEventTypes?: SecurityScore["topEventTypes"];
  recentCritical?: Array<{
    id: string;
    severity?: Severity;
    kind?: string;
    eventType?: string;
    ipAddress?: string | null;
    createdAt: string;
  }>;
};

/** The posture score. `null` means the door did not answer — the caller
 *  draws "not measured" rather than a zero, because a zero score and an
 *  unanswered question are not the same thing. */
export async function fetchSecurityScore(): Promise<SecurityScore | null> {
  const result = await apiGet<ApiScore>("/admin/security/score");
  if (!result.ok || !result.data) return null;
  const raw = result.data;
  return {
    score: typeof raw.score === "number" ? raw.score : 0,
    threatLevel: raw.threatLevel ?? "low",
    factors: raw.factors ?? [],
    stats: {
      totalUsers: raw.stats?.totalUsers ?? 0,
      usersWith2FA: raw.stats?.usersWith2FA ?? 0,
      activeSessions: raw.stats?.activeSessions ?? 0,
      revokedSessions: raw.stats?.revokedSessions ?? 0,
      blockedIPs: raw.stats?.blockedIPs ?? 0,
      blockedUsers: raw.stats?.blockedUsers ?? 0,
    },
    topIPs: raw.topIPs ?? [],
    topEventTypes: raw.topEventTypes ?? [],
    recentCritical: (raw.recentCritical ?? []).map((r) => ({
      id: r.id,
      userId: null,
      eventType: r.eventType ?? r.kind ?? "unknown",
      severity: (r.severity ?? "critical") as Severity,
      ipAddress: r.ipAddress ?? null,
      userAgent: null,
      createdAt: r.createdAt,
    })),
  };
}

