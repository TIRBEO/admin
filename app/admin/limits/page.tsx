import { Gauge } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { rateLimitMetrics, verificationLimits } from "@/lib/mock";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";
import { ago, duration } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

export default async function LimitsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const [metrics, caps] = await Promise.all([rateLimitMetrics(), verificationLimits()]);
  const load = present(state, { metrics, caps });

  return (
    <>
      <PageHeader
        title="Limits"
        description="Two different things with one name: the live rate limiter spending its budget right now, and the stored caps on how often a person may be sent a code."
        state={state}
        params={params}
      />

      <PageState load={load} rows={6} empty="No limiter has reported a bucket and no cap is stored." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric
              label="Requests"
              value={metrics.totalHits.toLocaleString()}
              hint="counted by this process"
            />
            <Metric
              label="Blocked"
              value={metrics.totalBlocked.toLocaleString()}
              hint={`${metrics.blockRate}% of traffic`}
              tone={metrics.blockRate > 5 ? "danger" : "warn"}
            />
            <Metric
              label="Bypassed"
              value={metrics.totalBypassed.toLocaleString()}
              hint="trusted paths, not failures"
            />
            <Metric
              label="Over budget"
              value={metrics.buckets.filter((b) => b.used > b.limit).length}
              hint="buckets past their ceiling"
              tone={metrics.buckets.some((b) => b.used > b.limit) ? "danger" : "success"}
            />
          </div>

          <Panel
            title="Live buckets"
            hint="A limiter is per-key in Redis; the window says what the number is counted against."
            action={
              <Pill tone="muted">
                <Gauge size={12} aria-hidden />
                {metrics.trackedQueries} queries tracked
              </Pill>
            }
          >
            <ul className="flex flex-col gap-3">
              {metrics.buckets.map((b) => {
                const pct = Math.round((b.used / Math.max(1, b.limit)) * 100);
                const over = b.used > b.limit;
                return (
                  <li key={b.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <code className="truncate text-[12px] text-[var(--fg)]">{b.key}</code>
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">{b.window}</span>
                    </span>
                    <span
                      className={`text-[12px] tabular-nums ${over ? "text-[var(--danger-text)]" : "text-[var(--muted)]"}`}
                    >
                      {b.used}/{b.limit}
                      {b.blocked > 0 ? ` · ${b.blocked} blocked` : ""}
                    </span>
                    <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className={`h-full rounded-full ${over ? "bg-danger" : "bg-[var(--accent-solid)]"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="col-span-2 text-[11px] tabular-nums text-[var(--text-4)]">
                      window resets {ago(b.resetAt, NOW_ISO)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel
            title="Verification caps"
            flush
            hint="Stored, not cached: changing one changes what the next code request allows."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "method", label: "Method" },
                  { key: "max", label: "Attempts", align: "right" },
                  { key: "window", label: "Window", align: "right", hideBelow: "sm" },
                  { key: "rate", label: "Cost", align: "right", hideBelow: "md" },
                  { key: "changed", label: "Changed", align: "right", hideBelow: "lg" },
                  { key: "edit", label: "", align: "right", width: "7ch" },
                ]}
                rows={caps.map((c) => ({
                  method: <code className="text-[12px]">{c.method}</code>,
                  max: c.max,
                  window: duration(c.windowMs / 1000),
                  rate: `${(c.max / (c.windowMs / 3_600_000)).toFixed(1)} / h`,
                  changed: ago(c.updatedAt, NOW_ISO),
                  edit: (
                    <button type="button" className="btn btn-secondary btn-sm" disabled title={MOCK_ERROR}>
                      Edit
                    </button>
                  ),
                }))}
                empty="No verification method is capped."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
