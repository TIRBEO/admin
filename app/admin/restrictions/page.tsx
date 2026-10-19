import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listRestrictions, restrictionState } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateOnly, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { RestrictionSeverity } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const SEVERITIES: RestrictionSeverity[] = ["notice", "warning", "strike"];

const SEVERITY_TONE: Record<RestrictionSeverity, "muted" | "warn" | "danger"> = {
  notice: "muted",
  warning: "warn",
  strike: "danger",
};

export default async function RestrictionsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const raw = params.severity;
  const severity = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const rows = await listRestrictions({ severity });
  const load = present(state, rows);

  const active = rows.filter((r) => restrictionState(r) !== "expired");
  const unread = rows.filter((r) => !r.readAt);

  return (
    <>
      <PageHeader
        title="Restrictions"
        description="What the platform has told a person they may not do, how long it lasts, and whether they have read it."
        state={state}
        params={params}
      />

      <Panel>
        <form action="/admin/restrictions" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Severity</span>
          <select
            name="severity"
            defaultValue={severity}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Every severity</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {severity ? (
            <a href="/admin/restrictions" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={6} empty="Nobody is restricted under that severity." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Restrictions" value={rows.length} hint="in this filter" />
            <Metric
              label="Still biting"
              value={active.length}
              hint={`${rows.length - active.length} already expired`}
              tone={active.length > 0 ? "warn" : "success"}
            />
            <Metric
              label="Unread"
              value={unread.length}
              hint="issued, never acknowledged"
              tone={unread.length > 0 ? "danger" : "success"}
            />
            <Metric
              label="Strikes"
              value={rows.filter((r) => r.severity === "strike").length}
              hint="the step before a ban"
              tone={rows.some((r) => r.severity === "strike") ? "danger" : "default"}
            />
          </div>

          <Panel
            title="Every restriction"
            flush
            hint="An expired restriction with no record of being lifted is a bookkeeping bug, not a person's problem."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "person", label: "Person" },
                  { key: "what", label: "What" },
                  { key: "severity", label: "Severity", hideBelow: "sm" },
                  { key: "state", label: "State" },
                  { key: "ends", label: "Ends", align: "right", hideBelow: "md" },
                  { key: "read", label: "Read", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((r) => {
                  const st = restrictionState(r);
                  return {
                    person: (
                      <Link
                        href={`/admin/people/${r.userId}`}
                        className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                      >
                        {r.userId}
                      </Link>
                    ),
                    what: (
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[var(--fg)]">{r.title}</span>
                        <span className="text-[11px] text-[var(--muted)]">
                          <code>{r.guideline}</code>
                          {r.detail ? ` · ${r.detail}` : ""}
                        </span>
                      </span>
                    ),
                    severity: <Pill tone={SEVERITY_TONE[r.severity]}>{r.severity}</Pill>,
                    state: (
                      <Pill tone={st === "active" ? "warn" : st === "permanent" ? "danger" : "muted"}>
                        {st}
                      </Pill>
                    ),
                    ends: r.endsAt ? (
                      <span title={dateTime(r.endsAt)}>{dateOnly(r.endsAt)}</span>
                    ) : (
                      "no end"
                    ),
                    read: r.readAt ? ago(r.readAt, NOW_ISO) : <span className="text-[var(--danger-text)]">unread</span>,
                  };
                })}
                empty="Nobody is restricted."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
