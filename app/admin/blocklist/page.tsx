import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listBlocklist } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { dateOnly, dateTime } from "@/lib/format";

import type { BlocklistTargetType } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const TARGETS: BlocklistTargetType[] = ["ip", "email", "domain", "user", "device"];

export default async function BlocklistPage({
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
  const targetType = one("targetType") ?? "";
  const active = one("active") ?? "";

  const rows = await listBlocklist({ targetType, active: active as "yes" | "no" | undefined });
  const load = present(state, rows);

  const live = rows.filter((b) => b.isActive);

  return (
    <>
      <PageHeader
        title="Blocklist"
        description="Addresses refused before they reach the platform. A block is a guess about traffic, so every row says who made it and when it stops."
        state={state}
        params={params}
      />

      <Panel>
        <form action="/admin/blocklist" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Target type</span>
          <select
            name="targetType"
            defaultValue={targetType}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Anything blocked</option>
            {TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <span className="sr-only">State</span>
          <select
            name="active"
            defaultValue={active}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Both</option>
            <option value="yes">Currently blocking</option>
            <option value="no">Lifted</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {targetType || active ? (
            <a href="/admin/blocklist" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={6} empty="Nothing of that kind is blocked." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Entries" value={rows.length} hint="in this filter" />
            <Metric label="Blocking now" value={live.length} hint="a request is refused" tone="danger" />
            <Metric
              label="Lifted"
              value={rows.length - live.length}
              hint="kept for the record"
            />
            <Metric
              label="Permanent"
              value={live.filter((b) => !b.expiresAt).length}
              hint="no expiry to review"
              tone="warn"
            />
          </div>

          <Panel title="The list" flush hint="A block with no expiry is a block nobody will ever revisit.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "target", label: "Target" },
                  { key: "type", label: "Type", hideBelow: "sm" },
                  { key: "reason", label: "Reason", hideBelow: "md" },
                  { key: "state", label: "State" },
                  { key: "by", label: "Set by", hideBelow: "lg" },
                  { key: "expires", label: "Expires", align: "right", hideBelow: "md" },
                ]}
                rows={rows.map((b) => ({
                  target: <code className="text-[12px] text-[var(--fg)]">{b.targetId}</code>,
                  type: <Pill tone="muted">{b.targetType}</Pill>,
                  reason: b.reason ?? <span className="text-[var(--muted)]">no reason recorded</span>,
                  state: b.isActive ? (
                    <Pill tone="danger">blocking</Pill>
                  ) : (
                    <Pill tone="muted">lifted</Pill>
                  ),
                  by: b.blockedBy ? (
                    <Link
                      href={`/admin/people/${b.blockedBy}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {b.blockedBy}
                    </Link>
                  ) : (
                    <span className="text-[var(--muted)]">system</span>
                  ),
                  expires: (
                    <span title={b.expiresAt ? dateTime(b.expiresAt) : undefined}>
                      {b.expiresAt ? dateOnly(b.expiresAt) : "never"}
                    </span>
                  ),
                }))}
                empty="The list is empty."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
