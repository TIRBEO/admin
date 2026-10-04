import { apiGet } from "@/lib/api";
import { Card, Stat, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { ago, duration } from "@/lib/format";

/* GET /api/admin/rate-limits returns three things at once: the live metrics
   window (`metrics`, held in the running process and reset every
   METRICS_WINDOW_MS), the configured budgets (`config`), and any alerts the
   block-rate watcher has raised (`alerts`). The window is process-local —
   after a restart it is empty, which is a fact about the measurement and
   not about the traffic. */

type Metric = { count?: number; blocked?: number; lastSeen?: number };
type Metrics = {
  totalHits?: number;
  totalBlocked?: number;
  totalBypassed?: number;
  blockRate?: number;
  bypassRate?: number;
  windowStart?: number;
  windowDuration?: number;
  topIps?: Array<Metric & { ip: string }>;
  topRoutes?: Array<Metric & { route: string }>;
  recentBlocks?: Array<{ ip?: string; route?: string; key?: string; reason?: string; timestamp?: number }>;
};
type Config = {
  routeLimits?: Record<string, number>;
  rateLimitEnabled?: boolean;
  rateLimitPerMinute?: number;
  adminRoleMultipliers?: Record<string, number>;
  blockRateAlertThreshold?: number;
  blockRateAlertEnabled?: boolean;
  blockRateAlertCooldown?: number;
};
type Alerts = {
  recentAlerts?: Array<{ timestamp: number; blockRate: number; threshold: number; message: string }>;
  alertTriggered?: boolean;
};

type Payload = { metrics?: Metrics; config?: Config; alerts?: Alerts };

export default async function RateLimitsPage() {
  const res = await apiGet<Payload>("/admin/rate-limits");
  if (!res.ok) return <Failure result={res} what="the rate limiter metrics" />;

  const m = res.data?.metrics ?? {};
  const c = res.data?.config ?? {};
  const alerts = res.data?.alerts ?? {};

  const windowStart = m.windowStart ?? 0;
  const windowEnd = windowStart + (m.windowDuration ?? 0);
  const measuring = windowStart > 0 && (m.totalHits ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Rate limiting" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Blocked"
          value={m.totalBlocked ?? 0}
          hint={`${m.blockRate ?? 0}% of ${m.totalHits ?? 0} requests in the window`}
        />
        <Stat
          label="Bypassed"
          value={m.totalBypassed ?? 0}
          hint={`${m.bypassRate ?? 0}% allowed past the limiter by role`}
        />
        <Stat
          label="Budget"
          value={`${c.rateLimitPerMinute ?? "—"}/min`}
          hint={
            c.rateLimitEnabled === false
              ? "Limiter disabled"
              : "Per address, before role multipliers"
          }
        />
        <Stat
          label="Block-rate alert"
          value={
            <Badge tone={alerts.alertTriggered ? "danger" : "ok"}>
              {alerts.alertTriggered ? "latched" : "clear"}
            </Badge>
          }
          hint={
            c.blockRateAlertEnabled === false
              ? "Watcher disabled"
              : `Fires above ${c.blockRateAlertThreshold ?? "—"}%`
          }
        />
      </section>

      {!measuring ? (
        <State
          title="The metrics window is empty"
          body={`These counters live in the API process and reset on restart${
            windowStart ? ` — the current window opened ${ago(new Date(windowStart))}` : ""
          }. An empty window is not evidence of no traffic.`}
        />
      ) : (
        <p className="text-[12px] text-[var(--tb-text-muted)]">
          Window {ago(new Date(windowStart))} ·{" "}
          {windowEnd ? `closes ${ago(new Date(windowEnd))}` : "length unreported"} ·{" "}
          {duration((m.windowDuration ?? 0) / 1000)}
        </p>
      )}

      {(alerts.recentAlerts ?? []).length > 0 ? (
        <Card title="Alerts" description="Raised by the block-rate watcher on its own.">
          <DataTable
            columns={["When", "Block rate", "Threshold", "Message"]}
            empty="No alerts."
            rows={(alerts.recentAlerts ?? []).map((a) => ({
              When: ago(new Date(a.timestamp)),
              "Block rate": `${a.blockRate}%`,
              Threshold: `${a.threshold}%`,
              Message: a.message,
            }))}
          />
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Busiest addresses" description="By request count in the window.">
          <DataTable
            columns={["IP", "Requests", "Blocked", "Last seen"]}
            empty="No addresses have hit the limiter this window."
            rows={(m.topIps ?? []).map((i) => ({
              IP: <span className="font-mono text-[12px]">{i.ip}</span>,
              Requests: i.count ?? 0,
              Blocked: i.blocked ?? 0,
              "Last seen": i.lastSeen ? ago(new Date(i.lastSeen)) : "—",
            }))}
          />
        </Card>

        <Card title="Busiest routes" description="By request count in the window.">
          <DataTable
            columns={["Route", "Requests", "Blocked", "Last seen"]}
            empty="No routes have hit the limiter this window."
            rows={(m.topRoutes ?? []).map((r) => ({
              Route: <span className="font-mono text-[12px]">{r.route}</span>,
              Requests: r.count ?? 0,
              Blocked: r.blocked ?? 0,
              "Last seen": r.lastSeen ? ago(new Date(r.lastSeen)) : "—",
            }))}
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Route budgets"
          description="Compiled into the limiter. A service-to-service route is set high deliberately."
        >
          <DataTable
            columns={["Route", "Per window"]}
            empty="No per-route budgets are compiled in."
            rows={Object.entries(c.routeLimits ?? {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([route, limit]) => ({
                Route: <span className="font-mono text-[12px]">{route}</span>,
                "Per window": limit,
              }))}
          />
        </Card>

        <Card
          title="Role multipliers"
          description="What an administrator's own traffic is scaled by."
        >
          <DataTable
            columns={["Role", "Multiplier"]}
            empty="No role multipliers are configured."
            rows={Object.entries(c.adminRoleMultipliers ?? {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([role, mult]) => ({
                Role: <Badge tone="accent">{role}</Badge>,
                Multiplier: `×${mult}`,
              }))}
          />
        </Card>
      </div>
    </div>
  );
}