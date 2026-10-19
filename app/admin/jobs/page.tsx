import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { cronSchedules, listJobs } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, duration } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

const STATUSES = ["queued", "running", "succeeded", "failed", "skipped"];

const STATUS_TONE: Record<string, "success" | "warn" | "danger" | "muted" | "accent"> = {
  queued: "muted",
  running: "accent",
  succeeded: "success",
  failed: "danger",
  skipped: "warn",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const status = one("status") ?? "";
  const name = one("name") ?? "";

  const [runs, schedules] = await Promise.all([listJobs({ status, name }), cronSchedules()]);
  const load = present(state, { runs, schedules });

  const failed = runs.filter((j) => j.status === "failed");

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Background work the platform ran, or was meant to run. content/jobs answers 501 today, so both halves of this screen are a brief."
        unwired
        state={state}
        params={params}
        actions={
          <Link href="/admin/heartbeat" className="btn btn-secondary btn-sm">
            Heartbeat
          </Link>
        }
      />

      <PageState load={load} rows={6} empty="No run record and no schedule: nothing has been asked to happen in the background." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Runs" value={runs.length} hint="in this view" />
            <Metric
              label="Failed"
              value={failed.length}
              hint="the work never landed"
              tone={failed.length > 0 ? "danger" : "success"}
            />
            <Metric
              label="Running now"
              value={runs.filter((j) => j.status === "running").length}
              hint="long work is normal; stuck work is not"
            />
            <Metric
              label="Schedules"
              value={schedules.length}
              hint={`${schedules.filter((s) => s.misses24h > 0).length} missed in 24 h`}
              tone={schedules.some((s) => s.misses24h > 0) ? "warn" : "success"}
            />
          </div>

          <Panel title="Schedules" flush hint="A schedule that never reports is indistinguishable from one that finished instantly — hence the deadline.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "name", label: "Schedule" },
                  { key: "pattern", label: "Cron", hideBelow: "md" },
                  { key: "every", label: "Due", hideBelow: "sm" },
                  { key: "last", label: "Last run" },
                  { key: "next", label: "Next", align: "right", hideBelow: "lg" },
                  { key: "misses", label: "Missed 24h", align: "right" },
                ]}
                rows={schedules.map((s) => ({
                  name: (
                    <span className="flex min-w-0 flex-col">
                      <code className="truncate text-[12px] text-[var(--fg)]">{s.name}</code>
                      <span className="text-[11px] text-[var(--muted)]">
                        timeout {duration(s.timeoutSecs)}
                      </span>
                    </span>
                  ),
                  pattern: <code className="text-[12px] text-[var(--muted)]">{s.pattern}</code>,
                  every: s.every,
                  last:
                    s.lastRunAt === null ? (
                      <Pill tone="warn">never</Pill>
                    ) : (
                      <Pill tone={s.lastStatus === "failed" ? "danger" : s.lastStatus === "running" ? "accent" : "success"}>
                        {s.lastStatus} · {ago(s.lastRunAt, NOW_ISO)}
                      </Pill>
                    ),
                  next: ago(s.nextRunAt, NOW_ISO),
                  misses: (
                    <span className={s.misses24h > 0 ? "text-[var(--danger-text)]" : undefined}>
                      {s.misses24h}
                    </span>
                  ),
                }))}
                empty="No schedule is registered."
              />
            </div>
          </Panel>

          <Panel>
            <form action="/admin/jobs" method="get" className="flex flex-wrap items-center gap-2">
              <span className="sr-only">Schedule</span>
              <select
                name="name"
                defaultValue={name}
                className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Every schedule</option>
                {schedules.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="sr-only">Status</span>
              <select
                name="status"
                defaultValue={status}
                className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Any outcome</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary btn-sm h-9">
                Apply
              </button>
              {name || status ? (
                <a href="/admin/jobs" className="btn btn-quiet btn-sm h-9">
                  Reset
                </a>
              ) : null}
            </form>
          </Panel>

          <Panel title="Runs" flush>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "name", label: "Schedule" },
                  { key: "status", label: "Status" },
                  { key: "detail", label: "What it did", hideBelow: "md" },
                  { key: "attempt", label: "Try", align: "right", hideBelow: "sm" },
                  { key: "took", label: "Took", align: "right", hideBelow: "lg" },
                  { key: "started", label: "Started", align: "right" },
                ]}
                rows={runs.map((j) => ({
                  name: <code className="text-[12px]">{j.name}</code>,
                  status: <Pill tone={STATUS_TONE[j.status] ?? "muted"}>{j.status}</Pill>,
                  detail: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[var(--text-2)]">{j.detail ?? "—"}</span>
                      {j.error ? (
                        <span className="truncate text-[11px] text-[var(--danger-text)]">{j.error}</span>
                      ) : null}
                    </span>
                  ),
                  attempt: j.attempt,
                  took: duration(j.durationMs / 1000),
                  started: ago(j.startedAt, NOW_ISO),
                }))}
                empty="No run matches this filter."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
