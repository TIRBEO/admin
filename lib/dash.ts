import { apiGet } from "@/lib/api";

/** Types for GET /api/admin/dash.
 *
 *  This one endpoint answers most of the panel: it is the whole platform
 *  counted in a single pass, so a dashboard that reads it once and derives
 *  every tile from it can never disagree with itself. Fields are typed as
 *  optional because the endpoint degrades rather than fails — it wraps
 *  each count in a `.catch(() => 0)`, so a missing table shows up as an
 *  absent key, not as an error. */

export type Count = { total?: number; active?: number };

export type Dash = {
  fetchedAt?: string;
  uptime?: number;
  overview?: {
    users?: Count & {
      activeToday?: number;
      newToday?: number;
      newThisWeek?: number;
      newThisMonth?: number;
    };
    notifications?: Count;
    sessions?: Count;
    auditEvents30d?: number;
    securityEventsToday?: number;
    apiKeys?: { active?: number };
    emails?: { total?: number; today?: number; lastHour?: number; failures?: number };
    logins?: { total?: number; today?: number };
    requests?: {
      hits?: number;
      blocked?: number;
      bypassed?: number;
      blockRate?: number;
      trackedQueries?: number;
    };
  };
  tables?: Record<string, number>;
  users?: {
    total?: number;
    active?: number;
    activeToday?: number;
    newToday?: number;
    newThisWeek?: number;
    newThisMonth?: number;
    verifiedEmail?: number;
    verifiedPhone?: number;
    banned?: number;
    suspended?: number;
    scheduledDeletion?: number;
    deleted?: number;
    twoFA?: number;
    mustChange?: number;
    admins?: Array<{ role: string; count: number }>;
    oauth?: { google?: number; github?: number; discord?: number };
  };
  sessions?: { total?: number; active?: number; byStatus?: Array<{ status: string; count: number }> };
  apiKeys?: { total?: number; active?: number; revoked?: number; expired?: number };
  notifications?: { total?: number; unread?: number; byType?: Array<{ type: string; count: number }> };
  security?: {
    total?: number;
    today?: number;
    bySeverity?: Array<{ severity: string; count: number }>;
    topTypes?: Array<{ eventType: string; count: number }>;
  };
  auditInfo?: {
    total30d?: number;
    today?: number;
    bySeverity?: Array<{ severity: string; count: number }>;
  };
  logins?: {
    total?: number;
    today?: number;
    successToday?: number;
    failedToday?: number;
    successRateToday?: number;
    byMethod?: Array<{ method: string; count: number }>;
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
    byStatus?: Array<{ status: string; count: number }>;
    topTemplates?: Array<{ template: string; count: number }>;
  };
  captcha?: {
    challenges?: number;
    solved?: number;
    solvedRate?: number;
    attempts?: number;
    blocks?: number;
    activeBlocks?: number;
    logs?: number;
  };
  push?: { total?: number };
  requests?: {
    totalHits?: number;
    totalBlocked?: number;
    totalBypassed?: number;
    blockRate?: number;
    bypassRate?: number;
    windowStart?: number;
    windowDuration?: number;
    topIps?: Array<{ ip: string; count: number; blocked?: number; lastSeen?: number }>;
    topRoutes?: Array<{ route: string; count: number; blocked?: number; lastSeen?: number }>;
    recentBlocks?: Array<{
      ip?: string;
      route?: string;
      key?: string;
      reason?: string;
      timestamp?: number;
    }>;
  };
  queryPerf?: {
    totalTrackedQueries?: number;
    slowQueryCount?: number;
    slowest?: Array<{ name: string; p95Ms: number; maxMs: number; count: number; avgMs: number }>;
  };
  alerts?: {
    alertTriggered?: boolean;
    lastAlertTime?: number;
    recentAlerts?: Array<{
      timestamp: number;
      blockRate: number;
      threshold: number;
      message: string;
    }>;
  };
  health?: {
    status?: string;
    uptime?: number;
    checks?: Record<string, { status?: string; latencyMs?: number }>;
  };
  redis?: { summary?: Record<string, unknown> };
  series?: Record<string, Array<{ label: string; value: number }>>;
  topActions?: Array<{ action: string; count: number }>;
  recentAudit?: Array<ActivityRow & { actor?: Actor | null }>;
  recentEmails?: Array<{
    id: string;
    toEmail?: string;
    subject?: string;
    eventKey?: string;
    status?: string;
    createdAt?: string;
    openedAt?: string | null;
  }>;
  recentLogins?: Array<{
    id: string;
    eventType?: string;
    ipAddress?: string | null;
    userId?: string | null;
    createdAt?: string;
  }>;
  recentSecurity?: Array<{
    id: string;
    eventType?: string;
    severity?: string;
    ipAddress?: string | null;
    userId?: string | null;
    createdAt?: string;
  }>;
  recentNotifications?: Array<{
    id: string;
    type?: string;
    title?: string;
    isRead?: boolean;
    createdAt?: string;
  }>;
  recentCaptcha?: Array<{
    id: string;
    ipAddress?: string | null;
    reason?: string;
    difficulty?: number;
    blockedAt?: string;
    unblockedAt?: string | null;
  }>;
};

export type Actor = { id?: string; email?: string; name?: string | null };

export type ActivityRow = {
  id?: string;
  userId?: string | null;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  ipAddress?: string | null;
  createdAt?: string;
};

/** Read the platform telemetry. Never throws — callers branch on `ok`. */
export function getDash(days = 14) {
  return apiGet<Dash>(`/admin/dash?days=${days}`);
}