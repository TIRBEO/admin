import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { auditActions, listAudit } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { Severity } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const SEVERITIES: Severity[] = ["info", "warning", "error", "critical"];

const TONE: Record<Severity, "muted" | "warn" | "danger"> = {
  info: "muted",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

export default async function AuditPage({
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
  const q = one("q") ?? "";
  const severity = (one("severity") ?? "") as Severity | "";
  const action = one("action") ?? "";
  const targetType = one("targetType") ?? "";
  const page = Math.max(1, Number(one("page")) || 1);

  const [result, actions] = await Promise.all([
    listAudit({ q, severity, action, targetType, page }),
    auditActions(),
  ]);
  const load = present(state, result);

  const targetTypes = [...new Set(targetTypesSeen())];

  function targetTypesSeen(): string[] {
    return ["user", "restriction", "appeal", "blocklist", "verification_limit", "config"];
  }

  const href = (over: Record<string, string | number>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, severity, action, targetType, page, ...over })) {
      if (value === "" || Number(value) === 1) continue;
      search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
  };

  const field =
    "h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="Every action taken from this console, written by the code that took it. It is the record that answers “who changed that”, so it is read-only by design."
        state={state}
        params={params}
      />

      <Panel>
        <form action="/admin/audit" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Event id, action, target or operator"
            className={`${field} min-w-[14rem] flex-1`}
          />
          <span className="sr-only">Action</span>
          <select name="action" defaultValue={action} className={field}>
            <option value="">Any action</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action} ({a.count})
              </option>
            ))}
          </select>
          <span className="sr-only">Target</span>
          <select name="targetType" defaultValue={targetType} className={field}>
            <option value="">Any target</option>
            {targetTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <span className="sr-only">Severity</span>
          <select name="severity" defaultValue={severity} className={field}>
            <option value="">Any severity</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {q || action || targetType || severity ? (
            <a href="/admin/audit" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={8} empty="No console action matches. An empty audit trail for a filter that should have hits is worth doubting the filter, then the writer." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Events" value={result.total} hint="matching this query" />
            <Metric
              label="Flagged"
              value={result.items.filter((a) => a.severity !== "info").length}
              hint="on this page"
              tone="warn"
            />
            <Metric
              label="Distinct actions"
              value={new Set(result.items.map((a) => a.action)).size}
              hint={`of ${actions.length} kinds`}
            />
            <Metric
              label="Newest"
              value={result.items[0] ? ago(result.items[0].createdAt, NOW_ISO) : "—"}
              hint="last write to the trail"
            />
          </div>

          <Panel flush>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "action", label: "What was done" },
                  { key: "actor", label: "Operator", hideBelow: "sm" },
                  { key: "target", label: "Target", hideBelow: "md" },
                  { key: "severity", label: "Severity" },
                  { key: "ip", label: "From", hideBelow: "lg" },
                  { key: "when", label: "When", align: "right" },
                ]}
                rows={load.data.items.map((a) => ({
                  action: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[var(--fg)]">{a.title}</span>
                      <code className="truncate text-[11px] text-[var(--muted)]">{a.action}</code>
                    </span>
                  ),
                  actor: (
                    <Link
                      href={`/admin/people/${a.actorId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {a.actorId}
                    </Link>
                  ),
                  target: (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Pill tone="muted">{a.targetType}</Pill>
                      <Link
                        href={
                          a.targetType === "user"
                            ? `/admin/people/${a.targetId}`
                            : `/admin/${a.targetType}s`
                        }
                        className="truncate font-mono text-[12px] text-[var(--text-2)] hover:underline"
                      >
                        {a.targetId}
                      </Link>
                    </span>
                  ),
                  severity: <Pill tone={TONE[a.severity]}>{a.severity}</Pill>,
                  ip: <code className="text-[12px] text-[var(--muted)]">{a.ipAddress ?? "—"}</code>,
                  when: (
                    <span className="text-[12px]" title={dateTime(a.createdAt)}>
                      {ago(a.createdAt, NOW_ISO)}
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
                {(load.data.page - 1) * load.data.perPage + 1}–
                {Math.min(load.data.page * load.data.perPage, load.data.total)} of{" "}
                {load.data.total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                {load.data.page > 1 ? (
                  <Link href={href({ page: load.data.page - 1 })} className="btn btn-secondary btn-sm">
                    Previous
                  </Link>
                ) : null}
                {load.data.page * load.data.perPage < load.data.total ? (
                  <Link href={href({ page: load.data.page + 1 })} className="btn btn-secondary btn-sm">
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
