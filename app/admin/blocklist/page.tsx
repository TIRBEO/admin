import Link from "next/link";

import { BlocklistUnblock } from "@/components/blocklist-unblock";
import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { dateOnly, dateTime } from "@/lib/format";
import { readBlocklist } from "@/lib/blocklist";
import { can } from "@/lib/permissions";

import type { BlocklistTargetType } from "@/lib/types";

type Params = Record<string, string | string[] | undefined>;

const TARGETS: BlocklistTargetType[] = ["ip", "email", "domain", "user", "device"];

export default async function BlocklistPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const targetType = (one("targetType") ?? "") as BlocklistTargetType | "";
  const state = (one("state") ?? "") as "" | "active" | "lifted" | "all";
  const q = one("q") ?? "";
  const limit = Math.min(100, Math.max(1, Number(one("limit")) || 50));
  const page = Math.max(1, Number(one("page")) || 1);

  const mayBlock = await can("blocklist.manage");
  const load = await readBlocklist({ targetType, state, q, page, limit });

  const pages = load.status === "ready" ? Math.max(1, Math.ceil(load.data.total / load.data.limit)) : 1;
  const link = (target: number) => {
    const s = new URLSearchParams();
    if (targetType) s.set("targetType", targetType);
    if (state) s.set("state", state);
    if (q) s.set("q", q);
    s.set("limit", String(limit));
    s.set("page", String(target));
    return `/admin/blocklist?${s.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Blocklist"
        description="Addresses refused before they reach the platform. A block is addressed by its target, not a row id, so where the target or the operator who set it is only an id it is shown as one — nothing here resolves it to a name."
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
            name="state"
            defaultValue={state}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Currently blocking</option>
            <option value="all">Every entry</option>
            <option value="lifted">Lifted only</option>
          </select>
          <label className="sr-only" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="target or reason"
            className="h-9 w-52 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {targetType || state || q ? (
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
            <Metric label="In this view" value={load.data.total} hint="entries matching the filter" />
            <Metric label="On this page" value={load.data.rows.length} hint={`page ${load.data.page} of ${pages}`} />
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
                  { key: "expires", label: "Expires", align: "right", hideBelow: "md", nowrap: true },
                  { key: "act", label: "", align: "right", width: "16ch" },
                ]}
                rows={load.data.rows.map((b) => ({
                  target: <code className="text-[12px] text-[var(--fg)]">{b.targetId}</code>,
                  type: <Pill tone="muted">{b.targetType}</Pill>,
                  reason: b.reason ?? <span className="text-[var(--muted)]">no reason recorded</span>,
                  state: b.isActive ? (
                    <Pill tone="danger">blocking</Pill>
                  ) : (
                    <Pill tone="muted">lifted</Pill>
                  ),
                  // An operator id with nothing to resolve it — shown as the id.
                  by: b.blockedBy ? (
                    <code className="text-[11px] text-[var(--muted)]">{b.blockedBy}</code>
                  ) : (
                    <span className="text-[var(--muted)]">system</span>
                  ),
                  expires: (
                    <span title={b.expiresAt ? dateTime(b.expiresAt) : undefined}>
                      {b.expiresAt ? dateOnly(b.expiresAt) : "never"}
                    </span>
                  ),
                  act: b.isActive && mayBlock ? (
                    <BlocklistUnblock targetType={b.targetType} targetId={b.targetId} />
                  ) : null,
                }))}
                empty="The list is empty."
              />
            </div>
          </Panel>

          {pages > 1 ? (
            <div className="flex items-center justify-between gap-2 text-[12px]">
              {load.data.page > 1 ? (
                <Link href={link(load.data.page - 1)} className="btn btn-quiet btn-sm">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="tabular-nums text-[var(--muted)]">
                page {load.data.page} of {pages}
              </span>
              {load.data.page < pages ? (
                <Link href={link(load.data.page + 1)} className="btn btn-quiet btn-sm">
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
