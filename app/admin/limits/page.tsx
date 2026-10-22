import { Gauge } from "lucide-react";

import { VerificationLimitForm } from "@/components/verification-limit-form";
import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { ago, dateTime, duration } from "@/lib/format";
import { readRateLimits, readVerificationLimits } from "@/lib/limits";
import { can } from "@/lib/permissions";

/* Two doors behind one screen. Each is drawn only if it answered, so a failure
   on the live limiter does not blank the stored caps beside it (or vice versa). */
export default async function LimitsPage() {
  const mayEdit = await can("limits.manage");
  const [rate, caps] = await Promise.all([readRateLimits(), readVerificationLimits()]);
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Limits"
        description="Two different things with one name: the live rate limiter counting requests in this process, and the stored caps on how often a person may be sent a code. The limiter is in-memory and per-process — its window opens fresh when the process restarts."
      />

      {rate.status === "ready" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Requests" value={rate.data.metrics.totalHits.toLocaleString()} hint="counted by this process" />
            <Metric
              label="Blocked"
              value={rate.data.metrics.totalBlocked.toLocaleString()}
              hint={`${rate.data.metrics.blockRate}% of traffic`}
              tone={rate.data.metrics.blockRate > 5 ? "danger" : "warn"}
            />
            <Metric
              label="Bypassed"
              value={rate.data.metrics.totalBypassed.toLocaleString()}
              hint={`${rate.data.metrics.bypassRate}% · trusted paths, not failures`}
            />
            <Metric
              label="Window"
              value={rate.data.metrics.windowDuration ? duration(rate.data.metrics.windowDuration / 1000) : "—"}
              hint={
                rate.data.metrics.windowStart
                  ? `opened ${ago(rate.data.metrics.windowStart, now)}`
                  : "no window open"
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Busiest IPs" hint="Hits this process has counted, highest first.">
              <DataTable
                columns={[
                  { key: "ip", label: "IP" },
                  { key: "count", label: "Hits", align: "right" },
                  { key: "blocked", label: "Blocked", align: "right", hideBelow: "sm" },
                  { key: "seen", label: "Last seen", align: "right", hideBelow: "md", nowrap: true },
                ]}
                rows={rate.data.metrics.topIps.slice(0, 10).map((x) => ({
                  ip: <code className="text-[12px]">{x.ip}</code>,
                  count: x.count,
                  blocked: x.blocked,
                  seen: x.lastSeen ? <span title={dateTime(x.lastSeen)}>{ago(x.lastSeen, now)}</span> : null,
                }))}
                empty="No IP has been counted yet."
              />
            </Panel>

            <Panel title="Busiest routes" hint="Request paths ranked by volume.">
              <DataTable
                columns={[
                  { key: "route", label: "Route" },
                  { key: "count", label: "Hits", align: "right" },
                  { key: "blocked", label: "Blocked", align: "right", hideBelow: "sm" },
                ]}
                rows={rate.data.metrics.topRoutes.slice(0, 10).map((x) => ({
                  route: <code className="text-[12px]">{x.route}</code>,
                  count: x.count,
                  blocked: x.blocked,
                }))}
                empty="No route has been counted yet."
              />
            </Panel>
          </div>

          <Panel title="Recent refusals" hint={`The last ${rate.data.metrics.recentBlocks.length} requests this limiter blocked.`}>
            <ul className="divide-y divide-[var(--divider)]">
              {rate.data.metrics.recentBlocks.slice(0, 10).map((b, i) => (
                <li key={`${b.ip}-${b.timestamp}-${i}`} className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <code className="text-[var(--fg)]">{b.ip}</code>
                    <code className="truncate text-[var(--muted)]">{b.route}</code>
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--muted)]">
                    {b.timestamp ? ago(b.timestamp, now) : "—"}
                  </span>
                </li>
              ))}
              {rate.data.metrics.recentBlocks.length === 0 ? (
                <li className="py-2 text-[13px] text-[var(--muted)]">Nothing has been refused in this window.</li>
              ) : null}
            </ul>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Limiter config"
              hint="What the platform is enforcing right now — read from the limiter, not set here."
              action={
                <Pill tone={rate.data.config.rateLimitEnabled ? "success" : "muted"}>
                  <Gauge size={12} aria-hidden />
                  {rate.data.config.rateLimitEnabled === false ? "disabled" : "enabled"}
                </Pill>
              }
            >
              <p className="mb-2 text-[13px] text-[var(--text-2)]">
                {rate.data.config.rateLimitPerMinute != null
                  ? `${rate.data.config.rateLimitPerMinute} requests/minute baseline.`
                  : "No baseline rate reported."}
              </p>
              <div className="flex flex-col gap-1.5">
                {rate.data.config.routeLimits.length > 0 ? (
                  <ul className="divide-y divide-[var(--divider)] text-[12px]">
                    {rate.data.config.routeLimits.map((r) => (
                      <li key={r.route} className="flex items-center justify-between gap-3 py-1">
                        <code className="truncate text-[var(--muted)]">{r.route}</code>
                        <span className="shrink-0 tabular-nums text-[var(--fg)]">{r.limit}/min</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-[var(--muted)]">No per-route ceilings set.</p>
                )}
              </div>
              {rate.data.config.adminRoleMultipliers.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--divider)] pt-3">
                  {rate.data.config.adminRoleMultipliers.map((m) => (
                    <Pill key={m.role} tone="muted">
                      {m.role} ×{m.multiplier}
                    </Pill>
                  ))}
                </div>
              ) : null}
            </Panel>

            <Panel title="Block-rate alerts" hint="The limiter's own warning when refusals run high.">
              <p className="text-[13px] text-[var(--text-2)]">
                {rate.data.alerts.alertTriggered ? (
                  <Pill tone="danger">alerting now</Pill>
                ) : (
                  <Pill tone="success">quiet</Pill>
                )}
                {rate.data.config.blockRateAlertThreshold != null ? (
                  <span className="ml-2 text-[12px] text-[var(--muted)]">
                    threshold {rate.data.config.blockRateAlertThreshold}%
                    {rate.data.config.blockRateAlertEnabled === false ? " · alerts off" : ""}
                  </span>
                ) : null}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {rate.data.alerts.recentAlerts.slice(0, 5).map((al, i) => (
                  <li key={`${al.timestamp}-${i}`} className="border-b border-[var(--divider)] pb-2 last:border-0">
                    <p className="text-[12.5px] text-[var(--fg)]">{al.message}</p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-[var(--muted)]">
                      {al.timestamp ? ago(al.timestamp, now) : "—"} · {al.totalBlocked}/{al.totalHits} blocked
                    </p>
                  </li>
                ))}
                {rate.data.alerts.recentAlerts.length === 0 ? (
                  <li className="text-[13px] text-[var(--muted)]">The block rate has not crossed its threshold.</li>
                ) : null}
              </ul>
            </Panel>
          </div>
        </>
      ) : (
        <PageState load={rate} rows={6} empty="The limiter has not counted a request." />
      )}

      {caps.status === "ready" ? (
        <Panel title="Verification caps" flush hint="Stored, not cached: changing one changes what the next code request allows.">
          <div className="px-4 py-1">
            <DataTable
              columns={[
                { key: "method", label: "Method" },
                { key: "max", label: "Attempts", align: "right" },
                { key: "window", label: "Window", align: "right", hideBelow: "sm", nowrap: true },
                { key: "changed", label: "Changed", align: "right", hideBelow: "lg" },
                { key: "edit", label: "", align: "right", width: "24ch" },
              ]}
              rows={caps.data.map((c) => ({
                method: <code className="text-[12px]">{c.method}</code>,
                max: c.max,
                window: duration(c.windowMs / 1000),
                changed: <span title={dateTime(c.updatedAt)}>{ago(c.updatedAt, new Date().toISOString())}</span>,
                edit: mayEdit ? <VerificationLimitForm method={c.method} max={c.max} windowMs={c.windowMs} /> : null,
              }))}
              empty="No verification method is capped."
            />
          </div>
        </Panel>
      ) : (
        <PageState
          load={caps}
          rows={4}
          empty="No verification method is capped — the platform is on its defaults."
        />
      )}
    </>
  );
}
