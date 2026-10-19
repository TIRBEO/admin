import { CircleCheck, CircleX, HelpCircle, TriangleAlert } from "lucide-react";

import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { present, readState } from "@/lib/load-state";
import { health, slowQueries } from "@/lib/mock";
import { NOW_ISO } from "@/lib/mock/world";
import { ago, bytes, duration } from "@/lib/format";

import type { HealthCheck } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

export default async function HealthPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const state = readState(params);
  const [snapshot, slowest] = await Promise.all([health(), slowQueries()]);
  const load = present(state, snapshot);

  const worstP95 = Math.max(...slowest.map((q) => q.p95Ms), 1);

  const dot = {
    ok: "bg-success",
    degraded: "bg-warn",
    down: "bg-danger",
    unknown: "bg-surface-3",
  } as const;

  return (
    <>
      <PageHeader
        title="Health"
        description="Each dependency the platform cannot work without, and what it answered last."
        state={state}
        params={params}
      />

      <PageState
        load={load}
        rows={4}
        empty="No dependency reported back, which is itself the finding: the probe never ran."
      />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric
              label="Overall"
              value={<span className="capitalize">{load.data.status}</span>}
              hint={`checked ${ago(load.data.fetchedAt, NOW_ISO)}`}
              tone={load.data.status === "ok" ? "success" : load.data.status === "down" ? "danger" : "warn"}
            />
            <Metric label="Uptime" value={duration(load.data.uptimeSeconds)} hint={`build ${load.data.version}`} />
            <Metric
              label="Pool in use"
              value={`${load.data.pool.inUse}/${load.data.pool.total}`}
              hint={`${load.data.pool.waiting} waiting`}
              tone={load.data.pool.waiting > 0 ? "warn" : "default"}
            />
            <Metric
              label="Redis keys"
              value={load.data.redis.keys.toLocaleString()}
              hint={
                load.data.redis.memoryBytes === null
                  ? "not configured"
                  : `${bytes(load.data.redis.memoryBytes)} held`
              }
            />
          </div>

          <Panel title="Checks" hint="A check that never answered is worse than one that failed.">
            <ul className="flex flex-col divide-y divide-[var(--divider)]">
              {load.data.checks.map((c: HealthCheck) => (
                <li key={c.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot[c.status as keyof typeof dot] ?? dot.unknown}`} />
                  <span className="min-w-0 flex-1 text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                    {c.name}
                  </span>
                  <Pill
                    tone={
                      c.status === "ok"
                        ? "success"
                        : c.status === "degraded"
                          ? "warn"
                          : c.status === "down"
                            ? "danger"
                            : "muted"
                    }
                  >
                    {c.status === "ok" ? (
                      <CircleCheck size={12} aria-hidden />
                    ) : c.status === "down" ? (
                      <CircleX size={12} aria-hidden />
                    ) : c.status === "degraded" ? (
                      <TriangleAlert size={12} aria-hidden />
                    ) : (
                      <HelpCircle size={12} aria-hidden />
                    )}
                    {c.status}
                  </Pill>
                  <span className="w-16 shrink-0 text-right text-[12px] tabular-nums text-[var(--muted)]">
                    {c.latencyMs === null ? "—" : `${c.latencyMs} ms`}
                  </span>
                  <p className="w-full pl-5 text-[12px] leading-snug text-[var(--muted)]">{c.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Slowest queries"
            hint="p95 over the last window — the number that hides an N+1"
          >
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
          </Panel>
        </>
      )}
    </>
  );
}
