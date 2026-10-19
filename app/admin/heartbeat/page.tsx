import Link from "next/link";
import { Activity, KeyRound } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Field, Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { cronSchedules, heartbeat } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, duration } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

export default async function HeartbeatPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const [ping, schedules] = await Promise.all([heartbeat(), cronSchedules()]);
  const load = present(state, { ping, schedules });

  const now = Date.parse(NOW_ISO);
  const overdue = schedules.filter((s) => Date.parse(s.nextRunAt) < now);

  return (
    <>
      <PageHeader
        title="Heartbeat"
        description="A cron job that says it ran. The value is not the ping but the gap: a schedule whose next run is in the past has not reported, whatever it claims."
        state={state}
        params={params}
        actions={
          <Link href="/admin/jobs" className="btn btn-secondary btn-sm">
            Job runs
          </Link>
        }
      />

      <PageState load={load} rows={5} empty="No heartbeat has ever arrived and no schedule is registered, so there is nothing to be late." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Last ping"
                value={ago(load.data.ping.lastPingAt, NOW_ISO)}
                hint={`window ${load.data.ping.windowHours} h`}
                tone={
                  now - Date.parse(load.data.ping.lastPingAt) > 2 * 3_600_000 ? "warn" : "success"
                }
              />
              <Metric
                label="Missed runs"
                value={load.data.ping.missed}
                hint="inside the window"
                tone={load.data.ping.missed > 0 ? "danger" : "success"}
              />
              <Metric
                label="Overdue now"
                value={overdue.length}
                hint="next run already past"
                tone={overdue.length > 0 ? "danger" : "success"}
              />
              <Metric
                label="Schedules"
                value={load.data.schedules.length}
                hint="reporting to this secret"
              />
            </div>

            <Panel title="The ping">
              <dl className="-my-1">
                <Field label="Shared secret">
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound
                      size={12}
                      aria-hidden
                      className={
                        load.data.ping.secretSet
                          ? "text-[var(--success-text)]"
                          : "text-[var(--warn-text)]"
                      }
                    />
                    {load.data.ping.secretSet ? "present" : "not set"}
                  </span>
                </Field>
                <Field label="Window">{duration(load.data.ping.windowHours * 3_600)}</Field>
                <Field label="Endpoint">
                  <code className="text-[12px]">POST /api/admin/heartbeat</code>
                </Field>
                <Field label="Since">
                  <Activity size={12} aria-hidden className="mr-1 inline-block" />
                  {ago(load.data.ping.lastPingAt, NOW_ISO)}
                </Field>
              </dl>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
                The secret is the only credential a cron box needs, which is why it is never printed
                here — presence, not value.
              </p>
            </Panel>
          </div>

          <Panel
            title="Deadlines"
            flush
            hint="Sorted by what is late, not by name: a schedule that is due is the row to read first."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "name", label: "Schedule" },
                  { key: "every", label: "Cadence", hideBelow: "sm" },
                  { key: "last", label: "Last reported" },
                  { key: "next", label: "Due", align: "right" },
                  { key: "misses", label: "Missed 24h", align: "right", hideBelow: "md" },
                ]}
                rows={[...load.data.schedules]
                  .sort((a, b) => Date.parse(a.nextRunAt) - Date.parse(b.nextRunAt))
                  .map((s) => {
                    const late = Date.parse(s.nextRunAt) < now;
                    return {
                      name: <code className="text-[12px] text-[var(--fg)]">{s.name}</code>,
                      every: s.every,
                      last:
                        s.lastRunAt === null ? (
                          <Pill tone="warn">never</Pill>
                        ) : (
                          <span className="text-[12px]">
                            {ago(s.lastRunAt, NOW_ISO)}
                            {s.lastStatus === "failed" ? (
                              <span className="ml-1.5 text-[var(--danger-text)]">failed</span>
                            ) : null}
                          </span>
                        ),
                      next: late ? (
                        <span className="text-[var(--danger-text)]">
                          late by {duration((now - Date.parse(s.nextRunAt)) / 1000)}
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">{ago(s.nextRunAt, NOW_ISO)}</span>
                      ),
                      misses: (
                        <Pill tone={s.misses24h > 0 ? "danger" : "success"}>{s.misses24h}</Pill>
                      ),
                    };
                  })}
                empty="Nothing is scheduled to report in."
              />
            </div>
          </Panel>

          {overdue.length > 0 ? (
            <p className="text-[12px] leading-relaxed text-[var(--danger-text)]">
              {overdue.length} schedule{overdue.length === 1 ? " is" : "s are"} past their next run.
              Either the box did not fire, or it fired and could not reach us — the console cannot
              tell those apart, and neither can a dashboard without this row.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
