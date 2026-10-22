import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readAnalytics, type DayCount } from "@/lib/analytics";
import { ago, dateTime } from "@/lib/format";

import type { Severity } from "@/lib/types";

/* What this screen is, now that it reads the platform: how many accounts there
   are, how many arrive per day, what the ledger mostly records, and the newest
   rows in it. Nothing else — the door answers no question about traffic,
   referrers, devices, countries or consent coverage, so none of those is drawn.

   The whole snapshot covers the door's own 30-day window, so every panel says
   so: a count with no period is a count nobody can compare with the next one. */

const DOT: Record<Severity, string> = {
  info: "bg-[var(--text-4)]",
  warning: "bg-warn",
  error: "bg-danger",
  critical: "bg-danger",
};

const TONE: Record<Severity, "muted" | "warn" | "danger"> = {
  info: "muted",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

export default async function AnalyticsPage() {
  const load = await readAnalytics();

  return (
    <>
      <PageHeader
        title="Analytics"
        description="What the platform can count about itself: accounts, what arrives each day, what the ledger records most, and its newest rows. Everything here is the last 30 days — the window the API counts over."
        actions={
          <Link href="/admin/activity" className="btn btn-secondary btn-sm">
            Live ledger
          </Link>
        }
      />

      <PageState
        load={load}
        rows={6}
        empty="The platform has counted nothing in this window."
      />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Metric
              label="Accounts"
              value={load.data.accounts.total.toLocaleString()}
              hint="every row in users, any status"
            />
            <Metric
              label="With console access"
              value={load.data.accounts.admins.toLocaleString()}
              hint="isAdmin, the one level the API has"
              tone={load.data.accounts.admins > 0 ? "accent" : "default"}
            />
            <Metric
              label="Created today"
              value={load.data.accounts.newToday.toLocaleString()}
              hint="since midnight on the API's clock"
              tone={load.data.accounts.newToday > 0 ? "success" : "default"}
            />
            <Metric
              label="Ledger rows"
              value={load.data.ledgerRows.toLocaleString()}
              hint={`every kind of event in ${load.data.windowDays} days`}
            />
            <Metric
              label="Notifications"
              value={load.data.notifications.toLocaleString()}
              hint="all time, not the window — the only total the door gives"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Accounts created per day"
              hint={`Days with at least one signup inside the window; a quiet day has no row to hide behind.`}
            >
              <Days rows={load.data.signupsByDay} empty="No account was created in this window." />
            </Panel>
            <Panel
              title="Ledger rows per day"
              hint="The same window, counted over everything the ledger holds."
            >
              <Days rows={load.data.activityByDay} empty="Nothing was recorded in this window." />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Panel
              title="What the ledger records most"
              flush
              hint="Top kinds by row count — the platform's own events, not only console actions."
            >
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "kind", label: "Kind" },
                    { key: "count", label: "Rows", align: "right" },
                    { key: "share", label: "Of the top", align: "right", hideBelow: "sm" },
                  ]}
                  rows={load.data.topActions.map((a) => ({
                    kind: <code className="text-[12px]">{a.action}</code>,
                    count: a.count.toLocaleString(),
                    share: `${Math.round((a.count / Math.max(1, load.data.topActions[0]?.count ?? 1)) * 100)}%`,
                  }))}
                  empty={`No ledger row of any kind inside ${load.data.windowDays} days.`}
                />
              </div>
            </Panel>

            <Panel
              title="Newest ledger rows"
              flush
              hint="The 20 most recent the door returns — the same ledger Activity draws in full."
              action={
                <Link href="/admin/activity" className="btn btn-quiet btn-sm">
                  All rows
                </Link>
              }
            >
              <ul className="divide-y divide-[var(--divider)]">
                {load.data.recent.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 py-2.5 first:pt-1">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.severity]}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                        {e.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--muted)]">
                        <code>{e.kind}</code>
                        {e.personId ? (
                          <Link
                            href={`/admin/people/${e.personId}`}
                            className="max-w-[16ch] truncate text-[var(--accent-text)] hover:underline"
                          >
                            {e.personLabel}
                          </Link>
                        ) : (
                          <span>no account</span>
                        )}
                        {e.ipAddress ? <code>{e.ipAddress}</code> : null}
                      </p>
                    </div>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Pill tone={TONE[e.severity]}>{e.severity}</Pill>
                      <time
                        className="text-[11px] tabular-nums text-[var(--muted)]"
                        dateTime={e.createdAt}
                        title={dateTime(e.createdAt)}
                      >
                        {ago(e.createdAt)}
                      </time>
                    </span>
                  </li>
                ))}
              </ul>
              {load.data.recent.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-[var(--muted)]">
                  The ledger is empty in this window.
                </p>
              ) : null}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

/** Day counts as bars scaled to the busiest day in the set. Each row is a day
    the door returned; the total beside it is what it counted, so a tall bar on
    a small window cannot be mistaken for a rate. */
function Days({ rows, empty }: { rows: DayCount[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-[var(--muted)]">{empty}</p>;
  }

  const peak = Math.max(...rows.map((r) => r.count), 1);
  const total = rows.reduce((t, r) => t + r.count, 0);

  return (
    <div>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.day} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
            <span className="w-[5.5rem] shrink-0 text-[12px] tabular-nums text-[var(--muted)]">
              {r.label}
            </span>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--accent-solid)]"
                style={{ width: `${Math.max(2, Math.round((r.count / peak) * 100))}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-[var(--text-2)]">
              {r.count}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--divider)] pt-3 text-[12px] tabular-nums text-[var(--muted)]">
        <span>{rows.length} days with rows</span>
        <span>{total.toLocaleString()} total</span>
      </p>
    </div>
  );
}
