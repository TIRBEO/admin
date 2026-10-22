import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

/* What the platform can prove about itself right now.

   Three reads, each answering a different question:
   - GET /admin/check-setup   — can the schema be reached, and is setup pending?
   - GET /admin/stats         — how many accounts, ledger rows and blocks exist.
   - GET /admin/dash?days=14  — the runtime slices: uptime, health, redis,
                                query performance and the block-rate alerts.

   The dash is a big payload and most of it is platform counters that belong to
   the dashboard, not this screen. Only the health-relevant slices are lifted
   here. Every one of them is measured at request time from live process state
   (`process.uptime`, a `SELECT 1`, a Redis client census, an in-memory query
   store, the rate limiter's own alert history). Nothing on this screen is a
   constant dressed as a measurement, and the fields the old screen invented —
   a build version, latency budgets, per-service pings, a Redis key count — have
   no source at all, so they are gone. */

type Setup = {
  dbConnected: boolean;
  sessionTableExists: boolean;
  setupRequired: boolean;
};

type Stats = {
  counts: { users: number; auditEvents: number; blocked: number };
  adminUsers: Array<{ id: string; email: string; name: string | null }>;
};

type HealthChecks = {
  database?: { status?: string; latencyMs?: number };
  redis?: { status?: string; latencyMs?: number };
  redisConnections?: {
    configured?: boolean;
    total?: number;
    connected?: number;
    reconnects?: number;
    failedRequests?: number;
    healthy?: boolean;
  };
  delivery?: {
    status?: string;
    realtime?: boolean;
    push?: boolean;
    missingEnvVars?: string[];
  };
};

type DashBody = {
  fetchedAt: string;
  cached: boolean;
  uptime: number;
  health: {
    status?: string;
    timestamp?: string;
    uptime?: number;
    checks?: HealthChecks;
    pool?: { totalCount: number; idleCount: number; waitingCount: number } | null;
  };
  redis: {
    summary: {
      configured: boolean;
      totalClients: number;
      connectedClients: number;
      totalReconnects: number;
      totalFailedRequests: number;
    };
  };
  queryPerf: {
    totalTrackedQueries: number;
    totalSamples: number;
    slowest: Array<{ name: string; p95Ms: number; maxMs: number; count: number; avgMs: number }>;
  };
  alerts: {
    alertTriggered: boolean;
    lastAlertTime: number;
    recentAlerts: Array<{
      timestamp: number;
      blockRate: number;
      threshold: number;
      totalHits: number;
      totalBlocked: number;
      message: string;
    }>;
  };
};

export type HealthView = {
  setup: Setup;
  stats: Stats;
  dash: DashBody;
};

export async function readHealth(): Promise<Load<HealthView>> {
  const [setup, stats, dash] = await Promise.all([
    apiGet<Setup>("/admin/check-setup"),
    apiGet<Stats>("/admin/stats"),
    apiGet<DashBody>("/admin/dash?days=14"),
  ]);

  if (!setup.ok || !setup.data) return apiFailure(setup);
  if (!stats.ok || !stats.data) return apiFailure(stats);
  if (!dash.ok || !dash.data) return apiFailure(dash);

  return {
    status: "ready",
    data: { setup: setup.data, stats: stats.data, dash: dash.data },
  };
}
