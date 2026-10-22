import Link from "next/link";

import { PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readActivity } from "@/lib/activity";
import { ago, dateTime } from "@/lib/format";

import type { Severity } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const SEVERITIES: Severity[] = ["info", "warning", "error", "critical"];

const DOT: Record<Severity, string> = {
  info: "bg-[var(--text-4)]",
  warning: "bg-warn",
  error: "bg-danger",
  critical: "bg-danger",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const severity = (one("severity") ?? "") as Severity | "";
  const limit = Math.min(200, Math.max(10, Number(one("limit")) || 60));

  /* The live ledger, not a fixture: an admin alert has to be on this screen
     while it is happening. A screen that shows a rehearsed ledger tells an
     operator the platform is quiet, which is the one thing this screen must
     never say when it is wrong. */
  const load = await readActivity({ severity, limit });

  /* The ledger is live, so "how long ago" is measured against the real clock —
     the fixture world runs on a frozen one, and a row that says "3 hours ago"
     when it was written thirty seconds ago is a lie an operator acts on. */
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader
        title="Activity"
        description="One ledger, every kind of thing that happened — including the alerts the platform raises about itself. Presence is the same table read with a five-minute window, so both halves of this screen disagree only if the clock does."
        actions={
          <Link href="/admin/audit" className="btn btn-secondary btn-sm">
            Console actions
          </Link>
        }
      />

      <PageState load={load} rows={8} empty="Nothing has happened, which on a live platform usually means the writer is not writing." />

      {load.status !== "ready" ? null : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <Panel>
              <form action="/admin/activity" method="get" className="flex flex-wrap items-center gap-2">
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
                <span className="sr-only">Rows</span>
                <select
                  name="limit"
                  defaultValue={String(limit)}
                  className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
                >
                  {[30, 60, 120, 200].map((n) => (
                    <option key={n} value={n}>
                      {n} rows
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary btn-sm h-9">
                  Apply
                </button>
                {severity ? (
                  <a href="/admin/activity" className="btn btn-quiet btn-sm h-9">
                    Reset
                  </a>
                ) : null}
                <span className="ml-auto text-[12px] tabular-nums text-[var(--muted)]">
                  {load.data.events.length} rows · newest first
                </span>
              </form>
            </Panel>

            <Panel flush>
              <ul className="divide-y divide-[var(--divider)]">
                {load.data.events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.severity]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                        {e.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--muted)]">
                        <code>{e.kind}</code>
                        {e.userId ? (
                          <Link
                            href={`/admin/people/${e.userId}`}
                            className="text-[var(--accent-text)] hover:underline"
                          >
                            {e.userId}
                          </Link>
                        ) : (
                          <span>anonymous</span>
                        )}
                        {e.ipAddress ? <code>{e.ipAddress}</code> : null}
                        <code className="text-[var(--text-4)]">{e.ref}</code>
                      </p>
                      {e.detail ? (
                        <p className="mt-1 text-[12px] leading-snug text-[var(--text-2)]">{e.detail}</p>
                      ) : null}
                    </div>
                    <time
                      className="shrink-0 text-right text-[12px] tabular-nums text-[var(--muted)]"
                      dateTime={e.createdAt}
                      title={dateTime(e.createdAt)}
                    >
                      {ago(e.createdAt, now)}
                    </time>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel
            title="Online now"
            hint="Active in the last five minutes — the same rule the presence endpoint uses."
          >
            <ul className="flex flex-col gap-2.5">
              {load.data.online.map((o) => (
                <li key={o.userId} className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
                  <Link
                    href={`/admin/people/${o.userId}`}
                    className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                  >
                    {o.userId}
                  </Link>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted)]">
                    {ago(o.at, now)}
                  </span>
                </li>
              ))}
              {load.data.online.length === 0 ? (
                <li className="text-[13px] text-[var(--muted)]">
                  Nobody has been seen in five minutes.
                </li>
              ) : null}
            </ul>
            <p className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--divider)] pt-3 text-[12px] text-[var(--muted)]">
              <span>{load.data.online.length} present</span>
              <Pill tone="muted">{load.data.events.length} ledger rows</Pill>
            </p>
          </Panel>
        </div>
      )}
    </>
  );
}
