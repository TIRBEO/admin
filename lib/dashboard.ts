import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";
import { fetchSecurityScore } from "@/lib/security";

import type {
  AuditEvent,
  CountRow,
  DashSnapshot,
  EmailDelivery,
  HealthCheck,
  SecurityScore,
  SeriesPoint,
  Severity,
  SlowQuery,
  Ticket,
  UserLogin,
} from "@/lib/mock/types";

/* ═══════════════════════════════════════════════════════════════════
   The Overview screen, read from the platform.

   The console draws from two doors: GET /admin/dash for the counters and
   the series, GET /admin/security/score for the posture. Both are real
   queries over the live tables — the numbers on this screen are the
   platform's, not a rehearsal of them.

   The two doors answer in their own words, and this file is the only
   place that knows how they differ: the API counts sessions "active" and
   the console says "active"; the API reports uptime in seconds under
   `uptime`; health checks arrive as a map and the console draws a list.
   Every translation lives here so the page keeps talking the console's
   language and a second screen reading the same door cannot invent its
   own mapping.

   What the API does not answer is left empty rather than invented: a
   number nobody measured is a zero the operator can see is a zero, not a
   figure this file made up to fill a box.
   ═══════════════════════════════════════════════════════════════════ */

type ApiSeries = { label: string; value: number }[];

type ApiDash = {
  fetchedAt?: string;
  uptime?: number;
  overview?: {
    users?: {
      total?: number;
      active?: number;
      activeToday?: number;
      newToday?: number;
      newThisWeek?: number;
      newThisMonth?: number;
    };
    notifications?: { total?: number; unread?: number };
    tickets?: { total?: number; open?: number };
    sessions?: { total?: number; active?: number };
    emails?: { total?: number; today?: number; lastHour?: number; failures?: number };
    logins?: { total?: number; today?: number };
    securityEventsToday?: number;
    requests?: { hits?: number; blocked?: number; bypassed?: number; blockRate?: number };
  };
  tables?: Record<string, number>;
  users?: {
    banned?: number;
    suspended?: number;
    scheduledDeletion?: number;
    deleted?: number;
    twoFA?: number;
    mustChange?: number;
    oauth?: { google?: number; github?: number; discord?: number };
  };
  emails?: {
    total?: number;
    today?: number;
    lastHour?: number;
    failures?: number;
    opened?: number;
    clicked?: number;
    openRate?: number;
    clickRate?: number;
  };
  logins?: {
    total?: number;
    today?: number;
    successToday?: number;
    failedToday?: number;
    successRateToday?: number;
    byMethod?: Array<{ method?: string; count?: number }>;
  };
  push?: { total?: number };
  notifications?: { byType?: Array<{ type?: string; count?: number }> };
  series?: {
    activity?: ApiSeries;
    users?: ApiSeries;
    emails?: ApiSeries;
    logins?: ApiSeries;
    security?: ApiSeries;
  };
  topActions?: Array<{ action?: string; count?: number }>;
  recentAudit?: Array<{
    id: string;
    kind?: string;
    title?: string;
    detail?: string | null;
    severity?: Severity;
    ipAddress?: string | null;
    userId?: string | null;
    createdAt: string;
  }>;
  recentEmails?: Array<{
    id: string;
    toEmail?: string;
    subject?: string;
    eventKey?: string;
    status?: string;
    openedAt?: string | null;
    clickedAt?: string | null;
    createdAt: string;
  }>;
  recentLogins?: Array<{
    id: string;
    eventType?: string;
    kind?: string;
    ipAddress?: string | null;
    userId?: string | null;
    createdAt: string;
  }>;
  recentSecurity?: Array<{
    id: string;
    eventType?: string;
    kind?: string;
    severity?: Severity;
    ipAddress?: string | null;
    userId?: string | null;
    createdAt: string;
  }>;
  alerts?: {
    recentAlerts?: Array<{
      timestamp?: number;
      blockRate?: number;
      threshold?: number;
      totalHits?: number;
      totalBlocked?: number;
      message?: string;
    }>;
  };
  health?: {
    status?: string;
    checks?: Record<string, { status?: string; latencyMs?: number | null }>;
    redis?: { configured?: boolean; keys?: number; memoryBytes?: number | null; latencyMs?: number | null };
    pool?: { total?: number; idle?: number; inUse?: number; waiting?: number };
    version?: string;
  };
  queryPerf?: { slowest?: SlowQuery[] };
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function series(points: ApiSeries | undefined): SeriesPoint[] {
  if (!Array.isArray(points)) return [];
  return points.map((p) => ({ label: p.label ?? "", value: num(p.value) }));
}

function counts(rows: Array<{ label?: string; count?: number }> | undefined, fallback: string): CountRow[] {
  if (!Array.isArray(rows)) return [{ label: fallback, value: 0 }];
  return rows.map((r) => ({ label: r.label ?? fallback, value: num(r.count) }));
}

function healthChecks(
  raw: Record<string, { status?: string; latencyMs?: number | null; error?: string; code?: string }> | undefined,
): HealthCheck[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).map(([name, check]) => ({
    name,
    status: check?.status ?? "unknown",
    latencyMs: typeof check?.latencyMs === "number" ? check.latencyMs : null,
    detail: check?.error ?? check?.code ?? "",
  }));
}

function toAudit(rows: ApiDash["recentAudit"]): AuditEvent[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    id: r.id,
    actorId: r.userId ?? "system",
    action: r.kind ?? "activity",
    title: r.title ?? r.kind ?? "Activity",
    targetType: "activity",
    targetId: r.id,
    severity: (r.severity ?? "info") as Severity,
    ipAddress: r.ipAddress ?? null,
    metadata: {},
    createdAt: r.createdAt,
  }));
}

function toEmails(rows: ApiDash["recentEmails"]): EmailDelivery[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    id: r.id,
    jobId: null,
    userId: null,
    toEmail: r.toEmail ?? "",
    eventKey: r.eventKey ?? "",
    event: r.eventKey ?? "",
    category: "",
    subject: r.subject ?? "(no subject)",
    status: r.status ?? "unknown",
    provider: null,
    providerId: null,
    messageId: null,
    openedAt: r.openedAt ?? null,
    clickedAt: r.clickedAt ?? null,
    createdAt: r.createdAt,
  }));
}

function toLogins(rows: ApiDash["recentLogins"]): UserLogin[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId ?? "",
    method: (r.eventType ?? r.kind ?? "unknown") as UserLogin["method"],
    success: true,
    ipAddress: r.ipAddress ?? null,
    userAgent: null,
    location: null,
    createdAt: r.createdAt,
  }));
}

/** The dash door's alerts are rate-limit block alerts; the console draws
    them as things that need attention, which is what they are. */
function toAlerts(dash: ApiDash): DashSnapshot["alerts"] {
  const recent = dash.alerts?.recentAlerts;
  if (!Array.isArray(recent)) return [];
  return recent.map((a, i) => ({
    id: `block-rate-${a.timestamp ?? i}`,
    severity: (num(a.blockRate) > num(a.threshold) ? "critical" : "warning") as Severity,
    title: "Request block rate is high",
    detail: a.message ?? "Requests are being blocked above the configured threshold.",
    at: new Date(a.timestamp ?? Date.now()).toISOString(),
  }));
}

function toSnapshot(dash: ApiDash): DashSnapshot {
  const users = dash.overview?.users ?? {};
  const total = num(users.total);
  const banned = num(dash.users?.banned);
  const suspended = num(dash.users?.suspended);
  const deletionPending = num(dash.users?.scheduledDeletion);
  const deleted = num(dash.users?.deleted);
  const held = banned + suspended + deletionPending + deleted;

  return {
    fetchedAt: dash.fetchedAt ?? new Date().toISOString(),
    uptimeSeconds: num(dash.uptime),
    overview: {
      users: {
        total,
        active: num(users.active),
        activeToday: num(users.activeToday),
        newToday: num(users.newToday),
        newThisWeek: num(users.newThisWeek),
        newThisMonth: num(users.newThisMonth),
      },
      emails: {
        total: num(dash.emails?.total),
        today: num(dash.emails?.today),
        lastHour: num(dash.emails?.lastHour),
        failures: num(dash.emails?.failures),
        opened: num(dash.emails?.opened),
        clicked: num(dash.emails?.clicked),
        openRate: num(dash.emails?.openRate),
        clickRate: num(dash.emails?.clickRate),
      },
      logins: {
        total: num(dash.logins?.total),
        today: num(dash.logins?.today),
        successToday: num(dash.logins?.successToday),
        failedToday: num(dash.logins?.failedToday),
        successRateToday: num(dash.logins?.successRateToday),
      },
      sessions: {
        total: num(dash.overview?.sessions?.total),
        active: num(dash.overview?.sessions?.active),
      },
      securityEventsToday: num(dash.overview?.securityEventsToday),
      notifications: {
        total: num(dash.overview?.notifications?.total),
        unread: num(dash.overview?.notifications?.unread),
      },
      tickets: {
        total: num(dash.overview?.tickets?.total),
        open: num(dash.overview?.tickets?.open),
      },
      push: { total: num(dash.push?.total) },
      twoFA: num(dash.users?.twoFA),
      mustChangePw: num(dash.users?.mustChange),
      banned,
      suspended,
      deletionPending,
      requests: {
        hits: num(dash.overview?.requests?.hits),
        blocked: num(dash.overview?.requests?.blocked),
        bypassed: num(dash.overview?.requests?.bypassed),
        blockRate: num(dash.overview?.requests?.blockRate),
      },
    },
    tables: Object.entries(dash.tables ?? {}).map(([name, rows]) => ({ name, rows: num(rows) })),
    series: {
      users: series(dash.series?.users),
      activity: series(dash.series?.activity),
      emails: series(dash.series?.emails),
      logins: series(dash.series?.logins),
      security: series(dash.series?.security),
      signups: series(dash.series?.users),
    },
    breakdowns: {
      usersByStatus: [
        { label: "Active", value: Math.max(0, total - held) },
        { label: "Banned", value: banned },
        { label: "Suspended", value: suspended },
        { label: "Deletion pending", value: deletionPending },
        { label: "Deleted", value: deleted },
      ],
      loginsByMethod: counts(dash.logins?.byMethod, "unknown"),
      emailsByStatus: [],
      notificationsByType: counts(dash.notifications?.byType, "other"),
      activityTopKinds: counts(dash.topActions, "activity"),
      oauth: [
        { label: "Google", value: num(dash.users?.oauth?.google) },
        { label: "GitHub", value: num(dash.users?.oauth?.github) },
        { label: "Discord", value: num(dash.users?.oauth?.discord) },
      ],
    },
    recents: {
      audit: toAudit(dash.recentAudit),
      logins: toLogins(dash.recentLogins),
      security: (dash.recentSecurity ?? []).map((r) => ({
        id: r.id,
        eventType: r.eventType ?? r.kind ?? "unknown",
        severity: (r.severity ?? "info") as Severity,
        ipAddress: r.ipAddress ?? null,
        userAgent: null,
        userId: r.userId ?? null,
        createdAt: r.createdAt,
        ref: r.id.slice(0, 8),
      })),
      emails: toEmails(dash.recentEmails),
      tickets: [] as Ticket[],
      notifications: [],
    },
    alerts: toAlerts(dash),
    health: {
      status: (dash.health?.status ?? "unknown") as "ok" | "degraded" | "down" | "unknown",
      fetchedAt: dash.fetchedAt ?? new Date().toISOString(),
      uptimeSeconds: num(dash.uptime),
      version: dash.health?.version ?? "—",
      checks: healthChecks(dash.health?.checks),
      redis: {
        configured: Boolean(dash.health?.redis?.configured),
        keys: num(dash.health?.redis?.keys),
        memoryBytes: dash.health?.redis?.memoryBytes ?? null,
        latencyMs: dash.health?.redis?.latencyMs ?? null,
      },
      pool: {
        total: num(dash.health?.pool?.total),
        idle: num(dash.health?.pool?.idle),
        inUse: num(dash.health?.pool?.inUse),
        waiting: num(dash.health?.pool?.waiting),
      },
    },
    slowest: dash.queryPerf?.slowest ?? [],
  };
}

export async function readDashboard(): Promise<Load<{ snapshot: DashSnapshot; score: SecurityScore }>> {
  const [dash, score] = await Promise.all([
    apiGet<ApiDash>("/admin/dash?days=14"),
    fetchSecurityScore(),
  ]);

  if (!dash.ok) return apiFailure(dash);
  if (!dash.data) return { status: "error", message: "The API answered with no snapshot in it." };

  return {
    status: "ready",
    data: {
      snapshot: toSnapshot(dash.data),
      // The score is a second door. If it is the one that failed, the screen
      // still has its counters — losing the whole overview because a posture
      // query was refused would be a worse answer than showing the posture as
      // unmeasured.
      score: score ?? {
        score: 0,
        threatLevel: "low",
        factors: [],
        stats: {
          totalUsers: 0,
          usersWith2FA: 0,
          activeSessions: 0,
          revokedSessions: 0,
          blockedIPs: 0,
          blockedUsers: 0,
        },
        topIPs: [],
        topEventTypes: [],
        recentCritical: [],
      },
    },
  };
}
