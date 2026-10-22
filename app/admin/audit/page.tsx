import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readAudit } from "@/lib/audit";
import { ago, dateTime } from "@/lib/format";

import type { Severity } from "@/lib/types";

type Params = Record<string, string | string[] | undefined>;

const SEVERITIES: Severity[] = ["info", "warning", "error", "critical"];

const TONE: Record<Severity, "muted" | "warn" | "danger"> = {
  info: "muted",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

const LIMITS = [25, 50, 100, 200];

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const id = one("id") ?? "";
  const action = one("action") ?? "";
  const actorId = one("actorId") ?? "";
  const severity = (one("severity") ?? "") as Severity | "";
  const from = one("from") ?? "";
  const to = one("to") ?? "";
  const limit = Math.min(200, Math.max(1, Number(one("limit")) || 50));
  const offset = Math.max(0, Number(one("offset")) || 0);

  /* No `targetType` filter is offered: the endpoint accepts the param but the
     query builder never applies it, so choosing one would look like a filter and
     return everything. That is the kind of lie this trail exists to prevent. */
  const load = await readAudit({ id, action, actorId, severity, from, to, limit, offset });

  const now = new Date().toISOString();

  // Every link rebuilds the query from the current filters, so paging never
  // drops an applied filter and resetting one never strands another.
  const href = (over: Record<string, string | number>) => {
    const search = new URLSearchParams();
    const merged = { id, action, actorId, severity, from, to, limit, offset, ...over };
    for (const [key, value] of Object.entries(merged)) {
      if (value === "" || value === undefined) continue;
      if (key === "offset" && Number(value) === 0) continue;
      search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "?";
  };

  const field =
    "h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  const filtered = id || action || actorId || severity || from || to;

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="Every action taken from this console, written by the code that took it. It is the record that answers “who changed that”, so it is read-only by design."
      />

      <Panel>
        <form action="/admin/audit" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Event id or reference</span>
          <input
            type="search"
            name="id"
            defaultValue={id}
            placeholder="Event id or ref code"
            className={`${field} min-w-[12rem] flex-1`}
          />
          <span className="sr-only">Action</span>
          <input
            type="search"
            name="action"
            defaultValue={action}
            placeholder="Action contains…"
            className={`${field} min-w-[10rem]`}
          />
          <span className="sr-only">Operator id</span>
          <input
            type="search"
            name="actorId"
            defaultValue={actorId}
            placeholder="Operator id"
            className={`${field} min-w-[10rem]`}
          />
          <span className="sr-only">Severity</span>
          <select name="severity" defaultValue={severity} className={field}>
            <option value="">Any severity</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="sr-only">From</span>
          <input type="date" name="from" defaultValue={from} className={field} aria-label="From date" />
          <span className="sr-only">To</span>
          <input type="date" name="to" defaultValue={to} className={field} aria-label="To date" />
          <span className="sr-only">Rows</span>
          <select name="limit" defaultValue={String(limit)} className={field}>
            {LIMITS.map((n) => (
              <option key={n} value={n}>
                {n} rows
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {filtered ? (
            <a href="/admin/audit" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState
        load={load}
        rows={8}
        empty="No console action matches. An empty audit trail for a filter that should have hits is worth doubting the filter, then the writer."
      />

      {load.status !== "ready" ? null : (
        <>
          <Panel flush>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "action", label: "What was done" },
                  { key: "actor", label: "Operator", hideBelow: "sm" },
                  { key: "target", label: "Target", hideBelow: "md" },
                  { key: "severity", label: "Severity" },
                  { key: "when", label: "When", align: "right", nowrap: true },
                ]}
                rows={load.data.rows.map((a) => ({
                  action: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[var(--fg)]">{a.title}</span>
                      <code className="truncate text-[11px] text-[var(--muted)]">
                        {a.action} · {a.ref}
                      </code>
                    </span>
                  ),
                  actor: a.actorId ? (
                    <Link
                      href={href({ actorId: a.actorId })}
                      className="block min-w-0 text-[12px] text-[var(--accent-text)] hover:underline"
                      title={a.actorId}
                    >
                      <span className="block truncate">
                        {a.actor?.name ?? a.actor?.username ?? a.actor?.email ?? a.actorId}
                      </span>
                      {a.actor ? null : (
                        <span className="block truncate text-[var(--muted)]">{a.actorId}</span>
                      )}
                    </Link>
                  ) : (
                    <span className="text-[var(--muted)]">system</span>
                  ),
                  target: a.targetId ? (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Pill tone="muted">{a.targetType ?? "target"}</Pill>
                      <Link
                        href={a.targetType === "user" ? `/admin/people/${a.targetId}` : href({ id: a.targetId })}
                        className="truncate font-mono text-[12px] text-[var(--text-2)] hover:underline"
                      >
                        {a.targetId}
                      </Link>
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  ),
                  severity: <Pill tone={TONE[a.severity]}>{a.severity}</Pill>,
                  when: (
                    <span className="text-[12px] tabular-nums" title={dateTime(a.createdAt)}>
                      {ago(a.createdAt, now)}
                    </span>
                  ),
                }))}
                empty="No console action matches this query."
              />
            </div>

            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-3 border-t border-[var(--divider)] px-4 py-3"
            >
              <p className="text-[12px] tabular-nums text-[var(--muted)]">
                {load.data.total === 0
                  ? "0 events"
                  : `${load.data.offset + 1}–${load.data.offset + load.data.rows.length} of ${load.data.total.toLocaleString()}`}
                <span className="ml-2 text-[var(--text-4)]">
                  · page {Math.floor(load.data.offset / load.data.limit) + 1}
                </span>
              </p>
              <div className="flex gap-2">
                {load.data.offset > 0 ? (
                  <Link href={href({ offset: Math.max(0, load.data.offset - load.data.limit) })} className="btn btn-secondary btn-sm">
                    Previous
                  </Link>
                ) : null}
                {load.data.offset + load.data.rows.length < load.data.total ? (
                  <Link href={href({ offset: load.data.offset + load.data.limit })} className="btn btn-secondary btn-sm">
                    Next
                  </Link>
                ) : null}
              </div>
            </nav>
          </Panel>

          <p className="text-[12px] leading-relaxed text-[var(--muted)]">
            Nothing here can be edited. The trail is written inside the same transaction as the
            change it describes, which is the only reason it can be trusted to say what happened.
          </p>
        </>
      )}
    </>
  );
}
