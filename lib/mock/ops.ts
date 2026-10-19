/* Operations: health, the runtime's own numbers, cron and its misses,
   maintenance state, the activity ledger, the audit trail — and the two
   big endpoint-shaped views (dashboard, analytics) built from all of it. */

import type {
  ActivityEvent,
  AnalyticsOverview,
  AuditEvent,
  CronSchedule,
  DashSnapshot,
  HealthSnapshot,
  IncidentBanner,
  JobRun,
  MaintenanceState,
  OnlineUser,
  SeriesPoint,
  SlowQuery,
} from "./types";
import { HOUR, NOW, daysAgo, hoursAgo, ip, minsAgo, ref, rng } from "./world";
import { emailDeliveries, emailJobs } from "./email";
import { logins, notifications, pushSubscriptions, security, sessions, users } from "./users";
import { appeals, blocklist, restrictions, securityEvents } from "./safety";
import { tickets } from "./support";

export const health: HealthSnapshot = {
  status: "degraded",
  fetchedAt: new Date(NOW).toISOString(),
  uptimeSeconds: 1_284_500,
  version: "2026.10.14-2",
  /* One non-ok row on purpose: a health screen where everything is green
     cannot show whether a degraded state is legible. */
  checks: [
    { name: "PostgreSQL", status: "ok", latencyMs: 4, detail: "transaction pool 8/20 in use" },
    { name: "Redis", status: "ok", latencyMs: 1, detail: "limiter and session cache warm" },
    { name: "Email provider", status: "degraded", latencyMs: 940, detail: "3 jobs retried in the last hour" },
    { name: "Object storage", status: "ok", latencyMs: 61, detail: "signed URLs valid 15 min" },
    { name: "Turnstile", status: "ok", latencyMs: 120, detail: "site key and secret present" },
    { name: "Push provider", status: "unknown", latencyMs: null, detail: "no subscription used in 24 h" },
  ],
  redis: { configured: true, keys: 18_402, memoryBytes: 96_000_000, latencyMs: 1 },
  pool: { total: 20, idle: 12, inUse: 8, waiting: 0 },
};

export const slowQueries: SlowQuery[] = (
  [
    ["activity_events_by_severity_created", 1_204, 38, 210, 1_180],
    ["users_group_created_at", 8_402, 12, 84, 640],
    ["email_deliveries_group_status", 2_180, 22, 140, 910],
    ["user_sessions_by_user", 30_188, 3, 18, 220],
    ["blocklist_unique_lookup", 4_410, 5, 26, 180],
  ] as const
).map(([name, count, avgMs, p95Ms, maxMs]) => ({ name, count, avgMs, p95Ms, maxMs }));

const CRON: Array<[string, string, string, number]> = [
  ["digest-weekly", "0 9 * * 1", "Mondays 09:00", 240],
  ["prune-expired-sessions", "*/15 * * * *", "Every 15 min", 30],
  ["email-queue-drain", "* * * * *", "Every minute", 50],
  ["purge-deletion-pending", "30 3 * * *", "Daily 03:30", 120],
  ["push-prune-stale", "0 * * * *", "Hourly", 60],
  ["client-error-window", "*/5 * * * *", "Every 5 min", 20],
  ["media-sweep-orphaned", "15 2 * * *", "Daily 02:15", 300],
];

export const cronSchedules: CronSchedule[] = CRON.map(([name, pattern, every, timeoutSecs], i) => {
  const r = rng(25000 + i);
  /* A missed run is only interesting beside the deadline it missed: the
     screen shows both, or an operator cannot tell late from never. */
  const stale = i === 4;
  return {
    name,
    pattern,
    every,
    lastRunAt: stale ? hoursAgo(31) : minsAgo(r.int(2, 90)),
    lastStatus: stale ? "failed" : i === 2 ? "running" : "ok",
    nextRunAt: stale ? "2026-10-18T00:00:00.000Z" : minsAgo(-r.int(1, 55)),
    misses24h: stale ? 2 : r.chance(0.2) ? 1 : 0,
    timeoutSecs,
  };
});

export const jobRuns: JobRun[] = Array.from({ length: 26 }, (_, i) => {
  const r = rng(26000 + i);
  const schedule = r.pick(CRON);
  const status = r.pick(["succeeded", "succeeded", "succeeded", "failed", "skipped", "running"]);
  const startedAt = minsAgo(i * 27 + r.int(0, 20));
  return {
    id: `job_${1000 + i}`,
    name: schedule[0],
    status,
    durationMs: r.int(120, schedule[3] * 1000),
    attempt: status === "failed" ? r.int(1, 3) : 1,
    detail:
      schedule[0] === "email-queue-drain"
        ? `${emailJobs.filter((j) => j.status === "queued").length} jobs still queued`
        : schedule[0] === "prune-expired-sessions"
          ? `${sessions.filter((s) => s.status === "expired").length} sessions pruned`
          : `sample run ${i + 1}`,
    error: status === "failed" ? r.pick(["deadline exceeded after 30s", "connection reset by peer"]) : null,
    startedAt,
    finishedAt: status === "running" ? null : startedAt,
  };
});

export const maintenance: MaintenanceState = {
  enabled: false,
  message: "Tirbeo is being upgraded. It should be back within the hour.",
  startedAt: null,
  endsAt: null,
  blockSignIn: true,
  allowAdmins: true,
  updatedAt: daysAgo(6),
  updatedBy: users[0]!.id,
};

export const incidentBanners: IncidentBanner[] = [
  {
    id: "inc_100",
    severity: "warning",
    title: "Email delivery is slow",
    message: "The provider is retrying; messages may arrive up to 20 minutes late.",
    startedAt: hoursAgo(3),
    resolvedAt: null,
  },
  {
    id: "inc_101",
    severity: "info",
    title: "Scheduled maintenance complete",
    message: "Database moved to the new pool on 14 Oct.",
    startedAt: daysAgo(4),
    resolvedAt: daysAgo(3),
  },
];

/** The live feed's definition of online: a session used in the last 5 min,
    exactly as /api/admin/activity computes it. */
export const onlineUsers: OnlineUser[] = users
  .filter((u) => u.lastActiveAt && NOW - Date.parse(u.lastActiveAt) < 5 * 60 * 60 * 1000)
  .slice(0, 9)
  .map((u, i) => ({
    userId: u.id,
    at: u.lastActiveAt!,
    path: ["/", "/settings/profile", "/u/sample_c", "/help"][i % 4]!,
  }));

/* ── the ledger ───────────────────────────────────────────────────────
   activity_events is one table for user activity, security and audit; the
   console splits it by kind prefix, so the fixtures do too. */

const USER_KINDS: Array<[string, string]> = [
  ["profile.companyName.updated", "Company name updated"],
  ["profile.bio.updated", "Bio updated"],
  ["profile.photo.updated", "Profile photo updated"],
  ["security.password.updated", "Password changed"],
  ["security.2fa.enabled", "Two-factor enabled"],
  ["consent.analytics.granted", "Analytics consent given"],
  ["account.deactivation.paused", "Account deactivated"],
  ["data.export.requested", "Data export requested"],
  ["user.username.changed", "Handle changed"],
  ["auth.session.revoked", "A device signed out"],
];

export const activityEvents: ActivityEvent[] = Array.from({ length: 90 }, (_, i) => {
  const r = rng(27000 + i);
  const [kind, title] = r.pick(USER_KINDS);
  const owner = r.chance(0.92) ? users[r.int(0, users.length - 1)]! : null;
  const id = `aud_${10_000 + i}`;
  return {
    id,
    userId: owner?.id ?? null,
    kind,
    title,
    detail: r.chance(0.5) ? `Sample detail for ${title.toLowerCase()}.` : null,
    severity: r.pick(["info", "info", "info", "warning", "error"]),
    ipAddress: ip(2000 + i),
    userAgent: r.pick([
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/605.1.15",
    ]),
    createdAt: minsAgo(i * 23 + r.int(0, 20)),
    ref: ref(id),
  };
});

/** Console actions — who changed what. Actor is always an operator. */
const ADMIN_ACTIONS: Array<[string, string, string]> = [
  ["admin.user.status.set", "user", "Account status changed"],
  ["admin.user.level.set", "user", "Access level changed"],
  ["admin.restriction.created", "restriction", "Restriction issued"],
  ["admin.appeal.decided", "appeal", "Appeal decided"],
  ["admin.block.added", "blocklist", "Address blocked"],
  ["admin.block.removed", "blocklist", "Block lifted"],
  ["admin.verification_limit.updated", "verification_limit", "Verification cap changed"],
  ["admin.email.template.updated", "email_template", "Email template saved"],
  ["admin.maintenance.toggled", "maintenance", "Maintenance mode changed"],
  ["admin.broadcast.sent", "broadcast", "Broadcast sent"],
  ["admin.password.changed", "operator", "Operator password changed"],
];

export const auditEvents: AuditEvent[] = Array.from({ length: 44 }, (_, i) => {
  const r = rng(28000 + i);
  const [action, targetType, title] = r.pick(ADMIN_ACTIONS);
  const actor = r.pick(users.filter((u) => u.isAdmin));
  const target =
    targetType === "user"
      ? users[r.int(0, users.length - 1)]!.id
      : targetType === "restriction"
        ? restrictions[r.int(0, restrictions.length - 1)]!.id
        : targetType === "appeal"
          ? appeals[r.int(0, appeals.length - 1)]!.id
          : targetType === "email_template"
            ? `tpl_${100 + r.int(0, 9)}`
            : `${targetType}_${r.int(100, 120)}`;
  return {
    id: `adm_${1000 + i}`,
    actorId: actor.id,
    action,
    title,
    targetType,
    targetId: target,
    severity: r.pick(["info", "info", "warning", "error"]),
    ipAddress: ip(3000 + i),
    metadata:
      targetType === "user"
        ? { from: "active", to: r.pick(["restricted", "suspended", "banned"]) }
        : { note: `Sample console action ${i + 1}` },
    createdAt: minsAgo(i * 47 + r.int(0, 40)),
  };
});

/* ── the two big views ──────────────────────────────────────────────── */

/** A day-bucketed series ending at NOW, the way the API's bucketOf() builds
    one. Deterministic per seed, so a chart's shape survives a rebuild. */
function series(days: number, seed: number, base: number, spread: number): SeriesPoint[] {
  const r = rng(seed);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(NOW - (days - 1 - i) * 24 * HOUR);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      /* A weekend dip, because a chart that is pure noise teaches you
         nothing about whether the axis is readable. */
      value: Math.max(0, Math.round(base + r.int(-spread, spread) - (d.getDay() % 6 === 0 ? base * 0.3 : 0))),
    };
  });
}

const DAYS = 14;

export const dash: DashSnapshot = {
  fetchedAt: new Date(NOW).toISOString(),
  uptimeSeconds: health.uptimeSeconds,
  overview: {
    users: {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      activeToday: users.filter((u) => u.lastActiveAt && NOW - Date.parse(u.lastActiveAt) < 24 * HOUR).length,
      newToday: 3,
      newThisWeek: 11,
      newThisMonth: 29,
    },
    emails: {
      total: emailDeliveries.length,
      today: emailDeliveries.filter((d) => NOW - Date.parse(d.createdAt) < 24 * HOUR).length,
      lastHour: emailDeliveries.filter((d) => NOW - Date.parse(d.createdAt) < HOUR).length,
      failures: emailDeliveries.filter((d) => d.status === "failed" || d.status === "bounced").length,
      opened: emailDeliveries.filter((d) => d.openedAt).length,
      clicked: emailDeliveries.filter((d) => d.clickedAt).length,
      openRate: Math.round(
        (emailDeliveries.filter((d) => d.openedAt).length / Math.max(1, emailDeliveries.length)) * 100,
      ),
      clickRate: Math.round(
        (emailDeliveries.filter((d) => d.clickedAt).length / Math.max(1, emailDeliveries.length)) * 100,
      ),
    },
    logins: {
      total: logins.length,
      today: logins.filter((l) => NOW - Date.parse(l.createdAt) < 24 * HOUR).length,
      successToday: logins.filter((l) => l.success && NOW - Date.parse(l.createdAt) < 24 * HOUR).length,
      failedToday: logins.filter((l) => !l.success && NOW - Date.parse(l.createdAt) < 24 * HOUR).length,
      successRateToday: Math.round(
        (logins.filter((l) => l.success).length / Math.max(1, logins.length)) * 100,
      ),
    },
    sessions: {
      total: sessions.length,
      active: sessions.filter((s) => s.status === "active").length,
    },
    securityEventsToday: securityEvents.filter((e) => NOW - Date.parse(e.createdAt) < 24 * HOUR).length,
    notifications: {
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
    },
    tickets: { total: tickets.length, open: tickets.filter((t) => t.status === "open").length },
    push: { total: pushSubscriptions.length },
    twoFA: security.filter((x) => x.totpEnabled).length,
    mustChangePw: security.filter((x) => x.mustChangePw).length,
    banned: users.filter((u) => u.status === "banned").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    deletionPending: users.filter((u) => u.status === "deletion_pending").length,
    requests: {
      hits: 412_880,
      blocked: 3_164,
      bypassed: 1_207,
      blockRate: 0.77,
    },
  },
  tables: ([
    ["users", users.length],
    ["user_sessions", sessions.length],
    ["email_jobs", emailJobs.length],
    ["email_deliveries", emailDeliveries.length],
    ["email_templates", 10],
    ["activity_events", activityEvents.length],
    ["security_events", securityEvents.length],
    ["blocklist", blocklist.length],
    ["user_restrictions", restrictions.length],
    ["user_appeals", appeals.length],
    ["notifications", notifications.length],
    ["push_subscriptions", pushSubscriptions.length],
    ["data_export_requests", 9],
    ["identities", users.length],
  ] as Array<[string, number]>).map(([name, rows]) => ({ name, rows })),
  series: {
    users: series(DAYS, 31000, 4, 3),
    signups: series(DAYS, 31001, 3, 2),
    activity: series(DAYS, 31002, 120, 40),
    emails: series(DAYS, 31003, 64, 22),
    logins: series(DAYS, 31004, 48, 18),
    security: series(DAYS, 31005, 9, 6),
  },
  breakdowns: {
    usersByStatus: (
      ["active", "restricted", "banned", "suspended", "deactivated", "deletion_pending", "deleted"] as const
    )
      .map((label) => ({ label, value: users.filter((u) => u.status === label).length }))
      .filter((row) => row.value > 0),
    loginsByMethod: [...new Set(logins.map((l) => l.method))].map((method) => ({
      label: method,
      value: logins.filter((l) => l.method === method).length,
    })),
    emailsByStatus: [...new Set(emailDeliveries.map((d) => d.status))].map((status) => ({
      label: status,
      value: emailDeliveries.filter((d) => d.status === status).length,
    })),
    notificationsByType: [...new Set(notifications.map((n) => n.type))].map((type) => ({
      label: type,
      value: notifications.filter((n) => n.type === type).length,
    })),
    activityTopKinds: [...new Set(activityEvents.map((a) => a.kind))]
      .map((kind) => ({ label: kind, value: activityEvents.filter((a) => a.kind === kind).length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    oauth: [
      { label: "Google", value: 14 },
      { label: "GitHub", value: 6 },
      { label: "Discord", value: 2 },
    ],
  },
  recents: {
    audit: auditEvents.slice(0, 8),
    logins: logins.slice(0, 8),
    security: securityEvents.slice(0, 8),
    emails: emailDeliveries.slice(0, 8),
    tickets: tickets.slice(0, 5),
    notifications: notifications.slice(0, 6),
  },
  alerts: [
    {
      id: "alr_100",
      severity: "critical",
      title: "Email provider retrying",
      detail: `${emailJobs.filter((j) => j.status === "failed").length} jobs past their last attempt`,
      at: hoursAgo(2),
    },
    {
      id: "alr_101",
      severity: "warning",
      title: "Cron missed its deadline",
      detail: "push-prune-stale has not reported for 31 hours",
      at: hoursAgo(7),
    },
    {
      id: "alr_102",
      severity: "info",
      title: "Scheduled maintenance ended",
      detail: "Database pool moved; no operator action needed",
      at: daysAgo(3),
    },
  ],
  health,
  slowest: slowQueries,
};

export const analytics: AnalyticsOverview = {
  fetchedAt: new Date(NOW).toISOString(),
  rangeDays: DAYS,
  traffic: series(DAYS, 32000, 2_400, 600),
  visits: series(DAYS, 32001, 900, 240),
  signups: series(DAYS, 32002, 4, 3),
  topPages: [
    ["/", 1_840],
    ["/pricing", 612],
    ["/help/articles/export", 488],
    ["/signup", 344],
    ["/u/sample_a", 260],
    ["/waitlist", 128],
  ].map(([path, views]) => ({ path: path as string, views: views as number })),
  referrers: [
    { label: "Direct", value: 1_204 },
    { label: "news.ycombinator.com", value: 402 },
    { label: "twitter.com", value: 318 },
    { label: "google.com", value: 288 },
    { label: "tirbeo.test/landing", value: 96 },
  ],
  devices: [
    { label: "Desktop", value: 1_420 },
    { label: "Mobile", value: 1_088 },
    { label: "Tablet", value: 172 },
  ],
  countries: [
    { label: "Bangladesh", value: 640 },
    { label: "United States", value: 512 },
    { label: "Germany", value: 344 },
    { label: "India", value: 268 },
    { label: "Brazil", value: 140 },
  ],
  /* Consent coverage is the number that decides whether anything above is
     usable, so it is on the same screen rather than a separate one. */
  consent: {
    total: users.length,
    consented: users.filter((_, i) => i % 4 !== 0).length,
    rate: Math.round((users.filter((_, i) => i % 4 !== 0).length / users.length) * 100),
    byPurpose: [
      { label: "analytics", value: 18 },
      { label: "marketing", value: 6 },
      { label: "personalization", value: 11 },
    ],
  },
  funnel: [
    { label: "Landing view", count: 2_400, rate: 100 },
    { label: "Started signup", count: 344, rate: 14 },
    { label: "Verified email", count: 268, rate: 78 },
    { label: "Completed onboarding", count: 201, rate: 75 },
    { label: "Active after 7 days", count: 128, rate: 64 },
  ],
};
