import Link from "next/link";
import { Hourglass } from "lucide-react";

import { AppealDecision } from "@/components/appeal-decision";
import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { ago, dateTime } from "@/lib/format";
import { readAppeals } from "@/lib/appeals";
import { can } from "@/lib/permissions";

import type { AppealDecision as Decision } from "@/lib/types";

type Params = Record<string, string | string[] | undefined>;

const DECISIONS: Decision[] = ["pending", "upheld", "overturned"];

const TONE: Record<Decision, "warn" | "danger" | "success"> = {
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
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const decision = (one("decision") ?? "") as Decision | "";
  const q = one("q") ?? "";
  const limit = Math.min(100, Math.max(1, Number(one("limit")) || 50));
  const page = Math.max(1, Number(one("page")) || 1);

  const mayDecide = await can("appeals.manage");
  const load = await readAppeals({ decision, q, limit, page });
  const now = new Date().toISOString();

  const pages = load.status === "ready" ? Math.max(1, Math.ceil(load.data.total / load.data.limit)) : 1;
  const link = (target: number) => {
    const s = new URLSearchParams();
    if (decision) s.set("decision", decision);
    if (q) s.set("q", q);
    s.set("limit", String(limit));
    s.set("page", String(target));
    return `/admin/appeals?${s.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Appeals"
        description="A person asking for a restriction to be lifted. Every row here is a decision somebody owes them, and an overturn costs nothing but pride. Only the live queue — the counts come straight from the ledger."
        actions={
          load.status === "ready" && load.data.pending > 0 ? (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--warn-text)]">
              <Hourglass size={13} aria-hidden />
              {load.data.pending} unanswered
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
          <label className="sr-only" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="email, appeal id, or note"
            className="h-9 w-56 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="sr-only">Rows</span>
          <select
            name="limit"
            defaultValue={String(limit)}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} rows
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {decision || q ? (
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
            <Metric label="In this view" value={load.data.total} hint="appeals matching the filter" />
            <Metric
              label="Unanswered"
              value={load.data.pending}
              hint="no verdict, platform-wide"
              tone={load.data.pending > 0 ? "warn" : "success"}
            />
            <Metric label="Page" value={`${load.data.page} / ${pages}`} hint={`${load.data.rows.length} shown here`} />
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
                  { key: "act", label: "", align: "right", width: "18ch" },
                ]}
                rows={load.data.rows.map((a) => ({
                  person: a.user.id ? (
                    <Link
                      href={`/admin/people/${a.user.id}`}
                      className="text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {a.user.name || a.user.email || a.user.id}
                    </Link>
                  ) : (
                    <span className="text-[var(--muted)]">deleted account</span>
                  ),
                  note: <span className="text-[var(--text-2)]">{a.note}</span>,
                  against: a.restriction.id ? (
                    <span className="flex flex-col">
                      <span className="text-[12px] text-[var(--fg)]">{a.restriction.title}</span>
                      <code className="text-[11px] text-[var(--muted)]">
                        {a.restriction.severity} · {a.restriction.guideline}
                      </code>
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">no restriction</span>
                  ),
                  decision: <Pill tone={TONE[a.decision]}>{a.decision}</Pill>,
                  filed: <span title={dateTime(a.createdAt)}>{ago(a.createdAt, now)}</span>,
                  decided: a.decidedAt ? (
                    <span title={dateTime(a.decidedAt)}>{ago(a.decidedAt, now)}</span>
                  ) : null,
                  act: a.decision === "pending" && mayDecide ? <AppealDecision appealId={a.id} /> : null,
                }))}
                empty="Nobody has appealed."
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
