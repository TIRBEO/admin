import { ChartNoAxesCombined, ShieldCheck } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { analytics } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { dateTime } from "@/lib/format";

import type { CountRow, SeriesPoint } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const view = await analytics();
  const load = present(state, view, {
    message: "The telemetry store answers one aggregate query; it either groups or it times out.",
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Traffic the platform can actually attribute, and the consent coverage that decides how much of it is usable."
        state={state}
        params={params}
      />

      <PageState
        load={load}
        rows={6}
        empty={`No telemetry inside the last ${view.rangeDays} days — either nothing was viewed or consent coverage is too low to report any of it.`}
      />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric
              label="Page views"
              value={sum(view.traffic).toLocaleString()}
              hint={`across ${view.rangeDays} days`}
            />
            <Metric
              label="Visits"
              value={sum(view.visits).toLocaleString()}
              hint={`${Math.round(sum(view.visits) / view.rangeDays)} a day`}
            />
            <Metric
              label="Signups"
              value={sum(view.signups).toLocaleString()}
              hint={`${view.funnel[view.funnel.length - 1]?.rate ?? 0}% still active at 7 days`}
            />
            <Metric
              label="Consent rate"
              value={`${view.consent.rate}%`}
              hint={`${view.consent.consented} of ${view.consent.total} accounts`}
              tone={view.consent.rate >= 80 ? "success" : "warn"}
            />
          </div>

          <Panel
            title={`Traffic, last ${view.rangeDays} days`}
            hint={`as of ${dateTime(view.fetchedAt)}`}
          >
            <div className="flex flex-col gap-6">
              <Series label="Page views" points={view.traffic} />
              <Series label="Visits" points={view.visits} tone="success" />
              <Series label="Signups" points={view.signups} tone="quiet" />
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel
              title="Most viewed pages"
              flush
              hint="Paths on the public app, not console routes."
            >
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "path", label: "Path" },
                    { key: "views", label: "Views", align: "right" },
                    { key: "share", label: "Share", align: "right", hideBelow: "sm" },
                  ]}
                  rows={view.topPages.map((p) => ({
                    path: <code className="text-[12px]">{p.path}</code>,
                    views: p.views.toLocaleString(),
                    share: `${Math.round((p.views / Math.max(1, view.topPages[0]?.views ?? 1)) * 100)}%`,
                  }))}
                  empty="No page has been viewed inside the range."
                />
              </div>
            </Panel>

            <Panel title="Signup funnel">
              <ol className="flex flex-col gap-3">
                {view.funnel.map((step, i) => (
                  <li key={step.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] text-[var(--text-2)]">{step.label}</span>
                      <span className="text-[13px] font-semibold tabular-nums">
                        {step.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent-solid)]"
                          /* Each bar is this step's share of the step above it,
                             so a leak is visible where it happens. */
                          style={{ width: `${Math.max(3, step.rate)}%`, opacity: 1 - i * 0.13 }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-[var(--muted)]">
                        {step.rate}%
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Panel title="Referrers">
              <Breakdown rows={view.referrers} />
            </Panel>
            <Panel title="Devices">
              <Breakdown rows={view.devices} />
            </Panel>
            <Panel title="Countries">
              <Breakdown rows={view.countries} />
            </Panel>
          </div>

          <Panel
            title="Consent"
            hint="Everything above is drawn from the accounts that opted in."
            action={
              <Pill tone={view.consent.rate >= 80 ? "success" : "warn"}>
                <ShieldCheck size={12} aria-hidden />
                {view.consent.rate}% covered
              </Pill>
            }
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-[13px] text-[var(--text-2)]">
                <ChartNoAxesCombined size={14} aria-hidden />
                {view.consent.consented} consented · {view.consent.total - view.consent.consented}{" "}
                not
              </span>
              <div className="flex flex-wrap gap-2">
                {view.consent.byPurpose.map((p) => (
                  <span
                    key={p.label}
                    className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[12px] text-[var(--text-2)]"
                  >
                    {p.label} · <span className="tabular-nums font-medium">{p.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}

function sum(points: SeriesPoint[]): number {
  return points.reduce((t, p) => t + p.value, 0);
}

/** A labelled sparkline. The three series are on one screen at wildly
    different magnitudes, so each scales to its own peak and says so. */
function Series({
  label,
  points,
  tone = "accent",
}: {
  label: string;
  points: SeriesPoint[];
  tone?: "accent" | "success" | "quiet";
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const fill = {
    accent: "var(--accent-solid)",
    success: "var(--success)",
    quiet: "var(--text-4)",
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium uppercase tracking-[0.05em] text-[var(--muted)]">
          {label}
        </span>
        <span className="text-[13px] tabular-nums text-[var(--text-2)]">
          peak {max.toLocaleString()} · {points[points.length - 1]?.label}
        </span>
      </div>
      <div
        className="flex h-20 items-end gap-1"
        role="img"
        aria-label={`${label} daily series`}
      >
        {points.map((p) => (
          <div
            key={p.label}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: `${Math.max(3, Math.round((p.value / max) * 100))}%`,
              background: fill,
              opacity: 0.78,
            }}
            title={`${p.label}: ${p.value.toLocaleString()}`}
          />
        ))}
      </div>
    </div>
  );
}

function Breakdown({ rows }: { rows: CountRow[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((t, r) => t + r.value, 0) || 1;
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13px] text-[var(--text-2)]">{r.label}</span>
          <span className="text-[13px] tabular-nums text-[var(--muted)]">
            {Math.round((r.value / total) * 100)}%
          </span>
          <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent-solid)]"
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
