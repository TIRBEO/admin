import { CircleCheck, CircleX, HelpCircle, TriangleAlert } from "lucide-react";

import { Field, Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { ago, dateTime, duration } from "@/lib/format";
import { readHealth } from "@/lib/health";

type Params = Record<string, string | string[] | undefined>;

const DOT: Record<string, string> = {
  ok: "bg-success",
  healthy: "bg-success",
  degraded: "bg-warn",
  error: "bg-danger",
  down: "bg-danger",
  "not-configured": "bg-[var(--surface-3)]",
  unknown: "bg-[var(--surface-3)]",
};

const TONE: Record<string, "success" | "warn" | "danger" | "muted"> = {
  ok: "success",
  healthy: "success",
  degraded: "warn",
  error: "danger",
  down: "danger",
};

function dot(status: string | undefined) {
  return DOT[status ?? "unknown"] ?? DOT.unknown;
}

function tone(status: string | undefined) {
  return TONE[status ?? "unknown"] ?? "muted";
}

function StatusIcon({ status }: { status: string | undefined }) {
  if (status === "ok" || status === "healthy") return <CircleCheck size={12} aria-hidden />;
  if (status === "error" || status === "down") return <CircleX size={12} aria-hidden />;
  if (status === "degraded") return <TriangleAlert size={12} aria-hidden />;
  return <HelpCircle size={12} aria-hidden />;
}

export default async function HealthPage({ searchParams }: { searchParams: Promise<Params> }) {
  void await searchParams; // the health screen reads the whole state at once: no filters.
  const load = await readHealth();

  const header = (
    <PageHeader
      title="Health"
      description="Each dependency the platform cannot work without, measured now. A number here is a reading, never a fixed budget — anything the endpoints do not actually compute has been left off."
    />
  );

  if (load.status !== "ready") {
    return (
      <>
        {header}
        <PageState
          load={load}
          rows={4}
          empty="No dependency reported back, which is itself the finding: the probe never ran."
        />
      </>
    );
  }

  const { setup, stats, dash } = load.data;
  const checks = dash.health?.checks ?? {};
  const summary = dash.redis?.summary;
  const now = new Date().toISOString();

  const slowest = dash.queryPerf?.slowest ?? [];
  const worstP95 = Math.max(...slowest.map((q) => q.p95Ms), 1);

  return (
    <>
      {header}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="Overall"
            value={<span className="capitalize">{dash.health?.status ?? "unknown"}</span>}
            hint={`checked ${ago(dash.fetchedAt, now)}`}
            tone={dash.health?.status === "healthy" ? "success" : dash.health?.status === "degraded" ? "warn" : "danger"}
          />
          <Metric label="Process uptime" value={duration(dash.uptime)} hint="the API process this read hit" />
          <Metric
            label="Database"
            value={checks.database?.status === "ok" ? "reached" : setup.dbConnected ? "up" : "down"}
            hint={checks.database?.latencyMs !== undefined ? `${checks.database.latencyMs} ms · SELECT 1` : "no latency reported"}
            tone={checks.database?.status === "ok" ? "success" : "danger"}
          />
          <Metric
            label="Redis clients"
            value={summary ? `${summary.connectedClients}/${summary.totalClients}` : "—"}
            hint={summary && !summary.configured ? "no REDIS_URL set" : "live client census"}
            tone={summary && summary.totalClients > 0 && summary.connectedClients === 0 ? "danger" : "default"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel title="Setup checks" hint="GET /admin/check-setup — can the schema be reached.">
            <dl className="-my-1">
              <Field label="Database connected">
                <Pill tone={setup.dbConnected ? "success" : "danger"}>{setup.dbConnected ? "yes" : "no"}</Pill>
              </Field>
              <Field label="Session table exists">
                <Pill tone={setup.sessionTableExists ? "success" : "danger"}>
                  {setup.sessionTableExists ? "yes" : "no"}
                </Pill>
              </Field>
              <Field label="Setup required">
                <Pill tone={setup.setupRequired ? "warn" : "muted"}>
                  {setup.setupRequired ? "no admin yet" : "an admin exists"}
                </Pill>
              </Field>
              <Field label="Snapshot">{dateTime(dash.fetchedAt)}{dash.cached ? " · from cache" : ""}</Field>
            </dl>
          </Panel>

          <Panel title="Platform counts" hint="GET /admin/stats — counted, not estimated.">
            <dl className="-my-1">
              <Field label="Accounts">{stats.counts.users.toLocaleString()}</Field>
              <Field label="Ledger events">{stats.counts.auditEvents.toLocaleString()}</Field>
              <Field label="Blocklist entries">{stats.counts.blocked.toLocaleString()}</Field>
              <Field label="Administrators">
                {stats.adminUsers.length}
                <span className="ml-1 text-[12px] text-[var(--muted)]">
                  · listed as “admin”; the schema carries one boolean, so no role ladder is shown
                </span>
              </Field>
            </dl>
          </Panel>
        </div>

        <Panel title="Dependency checks" hint="Each is run against the live thing, not assumed.">
          <ul className="flex flex-col divide-y divide-[var(--divider)]">
            <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0">
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot(checks.database?.status)}`} />
              <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--fg)]">Database</span>
              <Pill tone={tone(checks.database?.status)}>
                <StatusIcon status={checks.database?.status} />
                {checks.database?.status ?? "unknown"}
              </Pill>
              <span className="w-20 shrink-0 text-right text-[12px] tabular-nums text-[var(--muted)]">
                {checks.database?.latencyMs === undefined ? "—" : `${checks.database.latencyMs} ms`}
              </span>
            </li>

            <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot(checks.redis?.status)}`} />
              <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--fg)]">Redis (ping)</span>
              <Pill tone={tone(checks.redis?.status)}>
                <StatusIcon status={checks.redis?.status} />
                {checks.redis?.status ?? "unknown"}
              </Pill>
              <span className="w-20 shrink-0 text-right text-[12px] tabular-nums text-[var(--muted)]">
                {checks.redis?.latencyMs === undefined ? "—" : `${checks.redis.latencyMs} ms`}
              </span>
            </li>

            {checks.redisConnections ? (
              <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dot(checks.redisConnections.healthy ? "ok" : "error")}`} />
                <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--fg)]">Redis connections</span>
                <span className="text-[12px] tabular-nums text-[var(--muted)]">
                  {checks.redisConnections.connected ?? 0}/{checks.redisConnections.total ?? 0} connected ·{" "}
                  {checks.redisConnections.reconnects ?? 0} reconnects ·{" "}
                  {checks.redisConnections.failedRequests ?? 0} failed
                </span>
              </li>
            ) : null}

            {checks.delivery ? (
              <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dot(checks.delivery.status)}`} />
                <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--fg)]">
                  Delivery (realtime + push)
                </span>
                <Pill tone={tone(checks.delivery.status)}>
                  <StatusIcon status={checks.delivery.status} />
                  {checks.delivery.status ?? "unknown"}
                </Pill>
                <span className="w-full pl-5 text-[12px] leading-snug text-[var(--muted)]">
                  realtime {checks.delivery.realtime ? "on" : "off"} · push{" "}
                  {checks.delivery.push ? "on" : "off"}
                  {checks.delivery.missingEnvVars?.length
                    ? ` · missing ${checks.delivery.missingEnvVars.join(", ")}`
                    : ""}
                </span>
              </li>
            ) : null}

            {dash.health?.pool ? (
              <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 last:pb-0">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--surface-3)]" />
                <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--fg)]">Connection pool</span>
                <span className="text-[12px] tabular-nums text-[var(--muted)]">
                  {dash.health.pool.idleCount} idle / {dash.health.pool.totalCount} total ·{" "}
                  {dash.health.pool.waitingCount} waiting
                </span>
              </li>
            ) : null}
          </ul>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel
            title="Slowest queries"
            hint="p95 over the process's own sample window — empty until real queries are tracked here"
          >
            {slowest.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                Nothing is tracked in this process yet
                {dash.queryPerf ? ` (${dash.queryPerf.totalTrackedQueries} queries seen)` : ""}. A
                slow-query list has to be measured, not invented, so there is nothing to draw until
                real timings arrive.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {slowest.map((q) => (
                  <li key={q.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                    <span className="truncate font-mono text-[12px] text-[var(--text-2)]">{q.name}</span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {q.p95Ms} ms
                      <span className="ml-2 text-[12px] font-normal text-[var(--muted)]">
                        {q.count.toLocaleString()} ×
                      </span>
                    </span>
                    <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent-solid)]"
                        style={{ width: `${Math.round((q.p95Ms / worstP95) * 100)}%` }}
                      />
                    </div>
                    <span className="col-span-2 text-[11px] tabular-nums text-[var(--text-4)]">
                      avg {q.avgMs} ms · max {q.maxMs} ms
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Block-rate alerts" hint="The rate limiter's own alert history, in this process.">
            <div className="flex items-center gap-2">
              <Pill tone={dash.alerts?.alertTriggered ? "danger" : "muted"}>
                {dash.alerts?.alertTriggered ? "triggered" : "quiet"}
              </Pill>
              <span className="text-[12px] tabular-nums text-[var(--muted)]">
                {dash.alerts?.lastAlertTime
                  ? `last ${ago(dash.alerts.lastAlertTime, now)}`
                  : "no alert in memory"}
              </span>
            </div>
            <ul className="mt-3 flex flex-col divide-y divide-[var(--divider)]">
              {(dash.alerts?.recentAlerts ?? []).map((a) => (
                <li key={a.timestamp} className="py-2 first:pt-0 last:pb-0">
                  <p className="text-[13px] leading-snug text-[var(--fg)]">{a.message}</p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-[var(--muted)]">
                    {dateTime(a.timestamp)} · blocked {a.totalBlocked}/{a.totalHits} ·{" "}
                    {a.blockRate}% over {a.threshold}%
                  </p>
                </li>
              ))}
              {(dash.alerts?.recentAlerts ?? []).length === 0 ? (
                <li className="py-2 text-[13px] text-[var(--muted)]">
                  No block-rate alert has fired in this process window.
                </li>
              ) : null}
            </ul>
          </Panel>
      </div>
    </>
  );
}
