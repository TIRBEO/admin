import { apiGet, apiFailure, type ApiResult } from "@/lib/api";
import type { Load } from "@/lib/load-state";
import { readOpenRequests, type OpenRequests } from "@/lib/support-summary";

import type { CountRow, SeriesPoint, Severity } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════
   The Overview screen, read from the platform.

   This screen is the one an operator opens when something is wrong, so every
   number on it has to be a measurement the platform actually took. The route
   behind GET /admin/dash answers a very large object, and a great deal of it is
   hardcoded in the route itself — table entries that resolve to `Promise.resolve(0)`,
   series that are always empty, `recent*` lists that are always empty, and a
   `topTemplates` that groups on one column while reading another. Drawing any of
   those would tell an operator "nobody used this today" about a thing that was
   never measured. That is the one lie this console cannot tell, so those fields
   are dropped and simply never appear — no empty panel, no decorative zero.

   What is kept is only what the route computes against a live table:
   the account / security / login / notification / email counts, the five series
   that come back from a real day-bucket query, the top event kinds, the newest
   real ledger rows, uptime, and the block-rate alerts the limiter actually raised.

   The other two doors — the helpdesk queue and the security posture — are read
   separately and reported with their own success or failure, so a queue that
   refuses does not blank the counters that did answer. */

// ── the dash door, as it actually arrives ──────────────────────────────────

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

type ApiSeries = Array<{ label?: string; value?: number }>;

type ApiDash = {
  fetchedAt?: string;
  uptime?: number;
  overview?: {
    users?: { total?: number; active?: number; newToday?: number; newThisWeek?: number };
    notifications?: { total?: number; unread?: number };
    securityEventsToday?: number;
  };
  // The email total lives here: the route's own `emails.total` reads a table key
  // (`emailLog`) that is never populated, so the count nobody defined would be a
  // zero. `tables.emailDelivery` is the genuine `email_deliveries.count()`.
  tables?: { emailDelivery?: number };
  users?: {
    banned?: number;
    suspended?: number;
    scheduledDeletion?: number;
    deleted?: number;
    twoFA?: number;
    oauth?: { google?: number; github?: number; discord?: number };
  };
  logins?: { today?: number; failedToday?: number; successRateToday?: number };
  emails?: {
    today?: number;
    lastHour?: number;
    failures?: number;
    byStatus?: Array<{ status?: string; count?: number }>;
  };
  notifications?: { byType?: Array<{ type?: string; count?: number }> };
  series?: {
    activity?: ApiSeries;
    users?: ApiSeries;
    emails?: ApiSeries;
    logins?: ApiSeries;
    notifications?: ApiSeries;
  };
  topActions?: Array<{ action?: string; count?: number }>;
  recentAudit?: Array<{
    id: string;
    kind?: string;
    title?: string;
    severity?: Severity;
    ipAddress?: string | null;
    createdAt: string;
    actor?: { email?: string | null; name?: string | null } | null;
    user?: { email?: string | null; profile?: { name?: string | null } | null } | null;
  }>;
  recentEmails?: Array<{
    id: string;
    toEmail?: string;
    subject?: string;
    eventKey?: string;
    status?: string;
    createdAt: string;
  }>;
  recentLogins?: Array<{
    id: string;
    kind?: string;
    eventType?: string;
    ipAddress?: string | null;
    userId?: string | null;
    createdAt: string;
  }>;
  recentSecurity?: Array<{
    id: string;
    kind?: string;
    eventType?: string;
    severity?: Severity;
    ipAddress?: string | null;
    userId?: string | null;
    createdAt: string;
  }>;
  recentNotifications?: Array<{
    id: string;
    type?: string;
    title?: string;
    isRead?: boolean;
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
};

// ── what the screen draws ──────────────────────────────────────────────────

export type LiveNumbers = {
  accountsTotal: number;
  accountsActiveWeek: number;
  newToday: number;
  newThisWeek: number;
  signinsToday: number;
  signinFailuresToday: number;
  emailsToday: number;
  emailsLastHour: number;
  securityEventsToday: number;
  notificationsTotal: number;
  notificationsUnread: number;
};

export type RecentAudit = {
  id: string;
  kind: string;
  title: string;
  severity: Severity;
  ipAddress: string | null;
  actor: string;
  createdAt: string;
};

export type RecentLogin = {
  id: string;
  kind: string;
  userId: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type RecentEvent = {
  id: string;
  kind: string;
  severity: Severity;
  userId: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type RecentEmail = {
  id: string;
  toEmail: string;
  subject: string;
  eventKey: string;
  status: string;
  createdAt: string;
};

export type RecentNotice = {
  id: string;
  type: string;
  title: string;
  isRead: boolean;
  createdAt: string;
};

export type DashAlert = {
  id: string;
  message: string;
  at: string;
  blockRate: number;
  threshold: number;
  totalBlocked: number;
};

export type Core = {
  fetchedAt: string;
  days: number;
  uptimeSeconds: number;
  live: LiveNumbers;
  accountsHeld: number;
  accountsByStatus: CountRow[];
  oauth: CountRow[];
  twoFA: number;
  emailStatus: CountRow[];
  emailTotal: number;
  noticeTypes: CountRow[];
  series: {
    activity: SeriesPoint[];
    users: SeriesPoint[];
    emails: SeriesPoint[];
    logins: SeriesPoint[];
    notifications: SeriesPoint[];
  };
  topActions: CountRow[];
  alerts: DashAlert[];
  recentAudit: RecentAudit[];
  recentLogins: RecentLogin[];
  recentEvents: RecentEvent[];
  recentEmails: RecentEmail[];
  recentNotices: RecentNotice[];
};

// ── the security door ──────────────────────────────────────────────────────

export type MeasuredFactor = {
  name: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "critical";
  description: string;
};

export type ScoreSummary = {
  factors: MeasuredFactor[];
  measuredScore: number;
  measuredMax: number;
  stats: {
    totalUsers: number;
    usersWith2FA: number;
    activeSessions: number;
    revokedSessions: number;
    blockedIPs: number;
    blockedUsers: number;
  };
  topIPs: Array<{ ip: string; count: number; lastSeen: string | null }>;
  topEventTypes: Array<{ type: string; count: number }>;
  recentCritical: Array<{
    id: string;
    kind: string;
    ipAddress: string | null;
    actor: string | null;
    createdAt: string;
  }>;
};

/* The posture door reports only what a query produced. It used to add five
 * factors of which three were literals in the handler (`passwordScore = 18`,
 * "Assuming strong password policy"), and this screen had to know that and
 * filter them out by name. The route now sends `measured` and a separately
 * labelled `unmeasured`, so the allowlist is gone: whatever arrives is counted. */
type ApiFactor = {
  name?: string;
  score?: number;
  maxScore?: number;
  status?: MeasuredFactor["status"];
  observed?: number;
  detail?: string;
};

type ApiScore = {
  windowDays?: number;
  measured?: ApiFactor[];
  unmeasured?: Array<{ name?: string; why?: string }>;
  counts?: {
    totalUsers?: number;
    usersWith2FA?: number;
    activeSessions?: number;
    revokedSessions?: number;
    blockedIPs?: number;
    blockedUsers?: number;
    criticalLastWindow?: number;
  };
  busiestIPs?: Array<{ ip?: string; count?: number; lastSeen?: string | null }>;
  eventKinds?: Array<{ type?: string; count?: number }>;
  recentCritical?: Array<{
    id: string;
    kind?: string;
    eventType?: string;
    ipAddress?: string | null;
    createdAt: string;
    user?: { email?: string | null; name?: string | null } | null;
  }>;
};

function readScore(result: ApiResult<ApiScore>): Load<ScoreSummary> {
  if (!result.ok) return apiFailure(result);
  if (!result.data) return { status: "error", message: "The API answered with no posture in it." };
  const raw = result.data;

  const factors: MeasuredFactor[] = (raw.measured ?? []).map((f) => ({
    name: str(f.name),
    score: num(f.score),
    maxScore: num(f.maxScore),
    status: f.status ?? "warning",
    description: str(f.detail),
  }));

  return {
    status: "ready",
    data: {
      factors,
      measuredScore: factors.reduce((sum, f) => sum + f.score, 0),
      measuredMax: factors.reduce((sum, f) => sum + f.maxScore, 0),
      stats: {
        totalUsers: num(raw.counts?.totalUsers),
        usersWith2FA: num(raw.counts?.usersWith2FA),
        activeSessions: num(raw.counts?.activeSessions),
        revokedSessions: num(raw.counts?.revokedSessions),
        blockedIPs: num(raw.counts?.blockedIPs),
        blockedUsers: num(raw.counts?.blockedUsers),
      },
      // `lastSeen` is the row's own timestamp now, so it is kept: an address
      // that has not been seen in three weeks is a different lead from one that
      // was seen a minute ago.
      topIPs: (raw.busiestIPs ?? []).map((p) => ({
        ip: str(p.ip) || "not recorded",
        count: num(p.count),
        lastSeen: p.lastSeen ?? null,
      })),
      topEventTypes: (raw.eventKinds ?? []).map((t) => ({
        type: str(t.type) || "unknown",
        count: num(t.count),
      })),
      recentCritical: (raw.recentCritical ?? []).map((e) => ({
        id: e.id,
        kind: e.eventType ?? e.kind ?? "unknown",
        ipAddress: e.ipAddress ?? null,
        actor: e.user?.name ?? e.user?.email ?? null,
        createdAt: e.createdAt,
      })),
    },
  };
}

// ── the dash door → the screen's shape ─────────────────────────────────────

function series(points: ApiSeries | undefined): SeriesPoint[] {
  if (!Array.isArray(points)) return [];
  return points.map((p) => ({ label: str(p.label), value: num(p.value) }));
}

function counts<T extends { count?: number }>(
  rows: T[] | undefined,
  label: (row: T) => string,
): CountRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({ label: label(r) || "unknown", value: num(r.count) }));
}

function severity(v: unknown): Severity {
  return v === "warning" || v === "error" || v === "critical" ? v : "info";
}

function toCore(dash: ApiDash, days: number): Core {
  const users = dash.overview?.users ?? {};
  const banned = num(dash.users?.banned);
  const suspended = num(dash.users?.suspended);
  const deletion = num(dash.users?.scheduledDeletion);
  const deleted = num(dash.users?.deleted);
  const total = num(users.total);
  const held = banned + suspended + deletion + deleted;

  return {
    fetchedAt: str(dash.fetchedAt) || new Date().toISOString(),
    days,
    uptimeSeconds: num(dash.uptime),
    live: {
      accountsTotal: total,
      accountsActiveWeek: num(users.active),
      newToday: num(users.newToday),
      newThisWeek: num(users.newThisWeek),
      signinsToday: num(dash.logins?.today),
      signinFailuresToday: num(dash.logins?.failedToday),
      emailsToday: num(dash.emails?.today),
      emailsLastHour: num(dash.emails?.lastHour),
      securityEventsToday: num(dash.overview?.securityEventsToday),
      notificationsTotal: num(dash.overview?.notifications?.total),
      notificationsUnread: num(dash.overview?.notifications?.unread),
    },
    accountsHeld: held,
    // Every slice here is a computed status count; "Active" is the remainder of
    // the computed total, never a placeholder.
    accountsByStatus: [
      { label: "Active", value: Math.max(0, total - held) },
      { label: "Banned", value: banned },
      { label: "Suspended", value: suspended },
      { label: "Deletion pending", value: deletion },
      { label: "Deleted", value: deleted },
    ],
    oauth: [
      { label: "Google", value: num(dash.users?.oauth?.google) },
      { label: "GitHub", value: num(dash.users?.oauth?.github) },
      { label: "Discord", value: num(dash.users?.oauth?.discord) },
    ],
    twoFA: num(dash.users?.twoFA),
    emailStatus: counts(dash.emails?.byStatus, (r) => str(r.status)),
    emailTotal: num(dash.tables?.emailDelivery),
    noticeTypes: counts(dash.notifications?.byType, (r) => str(r.type)),
    // `series.security` is the same unfiltered activity query as `series.activity`,
    // and tickets/submissions/incidents/media are always empty — only these five
    // are distinct, real day-bucket queries.
    series: {
      activity: series(dash.series?.activity),
      users: series(dash.series?.users),
      emails: series(dash.series?.emails),
      logins: series(dash.series?.logins),
      notifications: series(dash.series?.notifications),
    },
    topActions: counts(dash.topActions, (r) => str(r.action)),
    alerts: (dash.alerts?.recentAlerts ?? []).map((a, i) => ({
      id: `block-rate-${a.timestamp ?? i}`,
      message: str(a.message) || "Request block rate is above the configured threshold.",
      at: new Date(a.timestamp ?? Date.now()).toISOString(),
      blockRate: num(a.blockRate),
      threshold: num(a.threshold),
      totalBlocked: num(a.totalBlocked),
    })),
    recentAudit: (dash.recentAudit ?? []).map((r) => ({
      id: r.id,
      kind: str(r.kind) || "activity",
      title: str(r.title) || str(r.kind) || "Activity",
      severity: severity(r.severity),
      ipAddress: r.ipAddress ?? null,
      actor: r.actor?.name ?? r.actor?.email ?? r.user?.profile?.name ?? r.user?.email ?? "system",
      createdAt: r.createdAt,
    })),
    recentLogins: (dash.recentLogins ?? []).map((r) => ({
      id: r.id,
      kind: str(r.eventType ?? r.kind) || "sign-in",
      userId: r.userId ?? null,
      ipAddress: r.ipAddress ?? null,
      createdAt: r.createdAt,
    })),
    recentEvents: (dash.recentSecurity ?? []).map((r) => ({
      id: r.id,
      kind: str(r.eventType ?? r.kind) || "event",
      severity: severity(r.severity),
      userId: r.userId ?? null,
      ipAddress: r.ipAddress ?? null,
      createdAt: r.createdAt,
    })),
    recentEmails: (dash.recentEmails ?? []).map((r) => ({
      id: r.id,
      toEmail: str(r.toEmail),
      subject: str(r.subject) || "(no subject)",
      eventKey: str(r.eventKey),
      status: str(r.status) || "unknown",
      createdAt: r.createdAt,
    })),
    recentNotices: (dash.recentNotifications ?? []).map((r) => ({
      id: r.id,
      type: str(r.type) || "notice",
      title: str(r.title) || "(untitled)",
      isRead: Boolean(r.isRead),
      createdAt: r.createdAt,
    })),
  };
}

// ── the one read the screen makes ──────────────────────────────────────────

export type Dashboard = {
  core: Core;
  score: Load<ScoreSummary>;
  requests: Load<OpenRequests>;
};

/** Clamp to the window the route will actually serve (7–90 days). */
function windowDays(raw: number | undefined): number {
  if (!raw || !Number.isFinite(raw)) return 14;
  return Math.min(90, Math.max(7, Math.round(raw)));
}

export async function readDashboard(
  days: number,
): Promise<Load<Dashboard>> {
  const window = windowDays(days);
  const [dash, score, requests] = await Promise.all([
    apiGet<ApiDash>(`/admin/dash?days=${window}`),
    apiGet<ApiScore>("/admin/security/score"),
    readOpenRequests(6),
  ]);

  // The dash door is the backbone; if it fails the whole screen has no numbers.
  if (!dash.ok) return apiFailure(dash);
  if (!dash.data) return { status: "error", message: "The API answered with no snapshot in it." };

  // The other two doors report themselves: a refused queue or posture leaves
  // its panel as an error, but never drags the counters that did answer down.
  return {
    status: "ready",
    data: {
      core: toCore(dash.data, window),
      score: readScore(score),
      requests,
    },
  };
}
