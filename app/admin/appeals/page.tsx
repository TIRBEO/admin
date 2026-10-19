import Link from "next/link";
import { Hourglass } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listAppeals } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { AppealDecision } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const DECISIONS: AppealDecision[] = ["pending", "upheld", "overturned"];

const TONE: Record<string, "warn" | "danger" | "success" | "muted"> = {
  pending: "warn",
  upheld: "danger",
  overturned: "success",
};

export default async function AppealsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const raw = params.decision;
  const decision = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const rows = await listAppeals({ decision: decision as AppealDecision | "" });
  const load = present(state, rows);

  const waiting = rows.filter((a) => !a.decision || a.decision === "pending");

  return (
    <>
      <PageHeader
        title="Appeals"
        description="A person asking for a restriction to be lifted. Every row here is a decision somebody owes them, and an overturn costs nothing but pride."
        state={state}
        params={params}
        actions={
          waiting.length > 0 ? (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--warn-text)]">
              <Hourglass size={13} aria-hidden />
              {waiting.length} unanswered
            </span>
          ) : null
        }
      />

      <Panel>
        <form action="/admin/appeals" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Decision</span>
          <select
            name="decision"
            defaultValue={decision}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Every appeal</option>
            {DECISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {decision ? (
            <a href="/admin/appeals" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={6} empty="No appeal carries that verdict." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Appeals" value={rows.length} hint="in this filter" />
            <Metric
              label="Unanswered"
              value={waiting.length}
              hint="filed, no verdict"
              tone={waiting.length > 0 ? "warn" : "success"}
            />
            <Metric
              label="Overturned"
              value={rows.filter((a) => a.decision === "overturned").length}
              hint="the restriction came off"
              tone="success"
            />
            <Metric
              label="Upheld"
              value={rows.filter((a) => a.decision === "upheld").length}
              hint="the restriction stands"
            />
          </div>

          <Panel title="The queue" flush>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "person", label: "Person" },
                  { key: "note", label: "What they said" },
                  { key: "against", label: "Against", hideBelow: "lg" },
                  { key: "decision", label: "Verdict" },
                  { key: "filed", label: "Filed", align: "right", hideBelow: "md" },
                  { key: "decided", label: "Decided", align: "right", hideBelow: "sm" },
                ]}
                rows={rows.map((a) => ({
                  person: (
                    <Link
                      href={`/admin/people/${a.userId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {a.userId}
                    </Link>
                  ),
                  note: <span className="text-[var(--text-2)]">{a.note}</span>,
                  against: <code className="text-[12px] text-[var(--muted)]">{a.restrictionId}</code>,
                  decision: (
                    <Pill tone={a.decision ? TONE[a.decision] : "muted"}>
                      {a.decision ?? "not filed"}
                    </Pill>
                  ),
                  filed: <span title={dateTime(a.createdAt)}>{ago(a.createdAt, NOW_ISO)}</span>,
                  age: a.decidedAt ? ago(a.decidedAt, NOW_ISO) : "—",
                }))}
                empty="Nobody has appealed."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
