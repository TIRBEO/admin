import { apiFailure, apiGet, apiSend } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { VerificationLimit } from "@/lib/types";

/* The Limits screen reads two doors that share one name.

   GET /admin/rate-limits is the live limiter — what this process has counted
   since its window opened, which IPs and routes hit hardest, and the config
   behind it. Its timestamps are epoch milliseconds, not ISO strings; the page's
   formatters take both, so they are kept as numbers here rather than rewritten.

   GET /admin/verification-limits is the stored caps on how often a person may
   be sent a code. Rows match VerificationLimit exactly, so they pass through.

   Everything the old fixture screen printed that these endpoints do not return
   — live buckets, per-key budget ceilings, the "Over budget" tally, a
   "queries tracked" counter — is gone. There is no endpoint behind them, so
   there is no number on the screen for them either. */

// ── rate limits ──────────────────────────────────────────────────────────

type ApiMetrics = {
  totalHits?: number;
  totalBlocked?: number;
  totalBypassed?: number;
  blockRate?: number;
  bypassRate?: number;
  topIps?: Array<{ ip: string; count?: number; blocked?: number; lastSeen?: number }>;
  topRoutes?: Array<{ route: string; count?: number; blocked?: number }>;
  recentBlocks?: Array<{ ip: string; route: string; timestamp?: number }>;
  recentBypasses?: Array<{ ip: string; route: string; userId?: string | null; timestamp?: number }>;
  windowStart?: number;
  windowDuration?: number;
};

type ApiConfig = {
  routeLimits?: Record<string, number>;
  rateLimitEnabled?: boolean;
  rateLimitPerMinute?: number;
  adminRoleMultipliers?: Record<string, number>;
  blockRateAlertThreshold?: number;
  blockRateAlertEnabled?: boolean;
  blockRateAlertCooldown?: number;
};

type ApiAlerts = {
  recentAlerts?: Array<{
    timestamp?: number;
    blockRate?: number;
    threshold?: number;
    totalHits?: number;
    totalBlocked?: number;
    message?: string;
  }>;
  lastAlertTime?: number;
  alertTriggered?: boolean;
};

type ApiRateLimits = { metrics?: ApiMetrics; config?: ApiConfig; alerts?: ApiAlerts };

export type RateLimitsSnapshot = {
  metrics: {
    totalHits: number;
    totalBlocked: number;
    totalBypassed: number;
    blockRate: number;
    bypassRate: number;
    topIps: Array<{ ip: string; count: number; blocked: number; lastSeen: number | null }>;
    topRoutes: Array<{ route: string; count: number; blocked: number }>;
    recentBlocks: Array<{ ip: string; route: string; timestamp: number | null }>;
    recentBypasses: Array<{ ip: string; route: string; userId: string | null; timestamp: number | null }>;
    windowStart: number | null;
    windowDuration: number | null;
  };
  config: {
    routeLimits: Array<{ route: string; limit: number }>;
    rateLimitEnabled: boolean | null;
    rateLimitPerMinute: number | null;
    adminRoleMultipliers: Array<{ role: string; multiplier: number }>;
    blockRateAlertThreshold: number | null;
    blockRateAlertEnabled: boolean | null;
    blockRateAlertCooldown: number | null;
  };
  alerts: {
    recentAlerts: Array<{
      timestamp: number | null;
      blockRate: number;
      threshold: number;
      totalHits: number;
      totalBlocked: number;
      message: string;
    }>;
    lastAlertTime: number | null;
    alertTriggered: boolean;
  };
};

const n = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function toSnapshot(raw: ApiRateLimits): RateLimitsSnapshot {
  const m = raw.metrics ?? {};
  const c = raw.config ?? {};
  const a = raw.alerts ?? {};
  return {
    metrics: {
      totalHits: n(m.totalHits),
      totalBlocked: n(m.totalBlocked),
      totalBypassed: n(m.totalBypassed),
      blockRate: n(m.blockRate),
      bypassRate: n(m.bypassRate),
      topIps: (m.topIps ?? []).map((x) => ({
        ip: x.ip,
        count: n(x.count),
        blocked: n(x.blocked),
        lastSeen: typeof x.lastSeen === "number" ? x.lastSeen : null,
      })),
      topRoutes: (m.topRoutes ?? []).map((x) => ({ route: x.route, count: n(x.count), blocked: n(x.blocked) })),
      recentBlocks: (m.recentBlocks ?? []).map((x) => ({
        ip: x.ip,
        route: x.route,
        timestamp: typeof x.timestamp === "number" ? x.timestamp : null,
      })),
      recentBypasses: (m.recentBypasses ?? []).map((x) => ({
        ip: x.ip,
        route: x.route,
        userId: x.userId ?? null,
        timestamp: typeof x.timestamp === "number" ? x.timestamp : null,
      })),
      windowStart: typeof m.windowStart === "number" ? m.windowStart : null,
      windowDuration: typeof m.windowDuration === "number" ? m.windowDuration : null,
    },
    config: {
      routeLimits: Object.entries(c.routeLimits ?? {}).map(([route, limit]) => ({ route, limit: n(limit) })),
      rateLimitEnabled: typeof c.rateLimitEnabled === "boolean" ? c.rateLimitEnabled : null,
      rateLimitPerMinute: typeof c.rateLimitPerMinute === "number" ? c.rateLimitPerMinute : null,
      adminRoleMultipliers: Object.entries(c.adminRoleMultipliers ?? {}).map(([role, multiplier]) => ({
        role,
        multiplier: n(multiplier),
      })),
      blockRateAlertThreshold: typeof c.blockRateAlertThreshold === "number" ? c.blockRateAlertThreshold : null,
      blockRateAlertEnabled: typeof c.blockRateAlertEnabled === "boolean" ? c.blockRateAlertEnabled : null,
      blockRateAlertCooldown: typeof c.blockRateAlertCooldown === "number" ? c.blockRateAlertCooldown : null,
    },
    alerts: {
      recentAlerts: (a.recentAlerts ?? []).map((x) => ({
        timestamp: typeof x.timestamp === "number" ? x.timestamp : null,
        blockRate: n(x.blockRate),
        threshold: n(x.threshold),
        totalHits: n(x.totalHits),
        totalBlocked: n(x.totalBlocked),
        message: x.message ?? "",
      })),
      lastAlertTime: typeof a.lastAlertTime === "number" && a.lastAlertTime > 0 ? a.lastAlertTime : null,
      alertTriggered: a.alertTriggered === true,
    },
  };
}

export async function readRateLimits(): Promise<Load<RateLimitsSnapshot>> {
  const result = await apiGet<ApiRateLimits>("/admin/rate-limits");
  if (!result.ok) return apiFailure(result);
  if (!result.data?.metrics) {
    return { status: "error", message: "The API answered with no rate-limit metrics in it." };
  }
  return { status: "ready", data: toSnapshot(result.data) };
}

// ── verification limits ──────────────────────────────────────────────────

type ApiVerification = { limits?: VerificationLimit[] };

export async function readVerificationLimits(): Promise<Load<VerificationLimit[]>> {
  const result = await apiGet<ApiVerification>("/admin/verification-limits");
  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.limits)) {
    return { status: "error", message: "The API answered with no verification caps in it." };
  }
  const rows = result.data.limits ?? [];
  return rows.length === 0 ? { status: "empty" } : { status: "ready", data: rows };
}

export type WriteResult = { ok: true } | { ok: false; message: string };

/** Update one verification cap. The door's PUT is an upsert keyed on `method`,
 *  so an existing row is edited in place and a new method creates its cap. */
export async function saveVerificationLimit(input: {
  method: string;
  max: number;
  windowMs: number;
}): Promise<WriteResult> {
  const result = await apiSend<{ error?: string }>("/admin/verification-limits", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method: input.method, max: input.max, windowMs: input.windowMs }),
  });
  if (!result.ok) return { ok: false, message: apiFailure(result).message };
  return { ok: true };
}
