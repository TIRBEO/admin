import Link from "next/link";
import {
  ArrowUpRight,
  CircleAlert,
  Mail,
  ShieldAlert,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Metric, PageHeader, PageState, Panel } from "@/components/page-header";
import { dash, securityScore } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime, duration } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { SeriesPoint } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  // One read for the whole screen: the dashboard is one snapshot, and five
  // separate calls would show five different instants of it.
  const [snapshot, score] = await Promise.all([dash(), securityScore()]);
  const load = present(state, snapshot, {
    message: "The dashboard aggregates eleven tables; a failure here is a query, not a filter.",
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What the platform is doing right now, and what is waiting on an operator."
        state={state}
        params={params}
        actions={
          <>
            <Link href="/admin/activity" className="btn btn-secondary btn-sm">
              Live activity
            </Link>
            <Link href="/admin/security-events" className="btn btn-primary btn-sm">
              Review events
            </Link>
          </>
        }
      />

      <PageState
        load={load}
        rows={6}
        empty="Every table behind the dashboard answered zero rows — either the platform is brand new or the snapshot query ran against an empty schema."
      />

      {load.status !== "ready" ? null : (
        <>
          <StatRow d={load.data} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel title="Activity, last 14 days" hint={`Buckets end ${dateTime(NOW_ISO)}`}>
              <Chart points={load.data.series.activity} />
            </Panel>

            <Panel title="Needs attention">
              <ul className="flex flex-col gap-3">
                {load.data.alerts.length === 0 ? (
                  <li className="text-[13px] text-[var(--muted)]">Nothing is failing.</li>
                ) : (
                  load.data.alerts.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span
                        className={`mt-0.5 shrink-0 ${
                          a.severity === "critical"
                            ? "text-[var(--danger-text)]"
                            : a.severity === "warning"
                              ? "text-[var(--warn-text)]"
                              : "text-[var(--muted)]"
                        }`}
                      >
                        {a.severity === "info" ? (
                          <CircleAlert size={15} aria-hidden />
                        ) : (
                          <TriangleAlert size={15} aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                          {a.title}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-snug text-[var(--muted)]">
                          {a.detail}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--text-4)]">{ago(a.at, NOW_ISO)}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Panel title="Signups">
              <Chart points={load.data.series.signups} tone="success" />
            </Panel>
            <Panel title="Accounts by status">
              <Breakdown rows={load.data.breakdowns.usersByStatus} />
            </Panel>
            <Panel title="Logins by method">
              <Breakdown rows={load.data.breakdowns.loginsByMethod} />
            </Panel>

            <Panel title="Email">
              <Metered
                items={[
                  ["Sent today", load.data.overview.emails.today],
                  ["Last hour", load.data.overview.emails.lastHour],
                  ["Failed", load.data.overview.emails.failures],
                  [`Open rate ${load.data.overview.emails.openRate}%`, load.data.overview.emails.opened],
                ]}
              />
            </Panel>

            <Panel title="Security">
              <ul className="flex flex-col gap-2.5">
                <li className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-[var(--text-2)]">Posture score</span>
                  <Link
                    href="/admin/security-events"
                    className="text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-[var(--accent-text)]"
                  >
                    {score.score}
                  </Link>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-[var(--text-2)]">Events today</span>
                  <span className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]">
                    {load.data.overview.securityEventsToday}
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-[var(--text-2)]">Two-factor adoption</span>
                  <span className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]">
                    {Math.round(
                      (load.data.overview.twoFA / Math.max(1, load.data.overview.users.total)) * 100,
                    )}
                    %
                  </span>
                </li>
              </ul>
            </Panel>

            <Panel title="Health" hint={load.data.health.version}>
              <ul className="flex flex-col gap-2.5">
                {load.data.health.checks.map((c) => (
                  <li key={c.name} className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[c.status] ?? DOT.unknown}`} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-2)]">
                      {c.name}
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-[var(--muted)]">
                      {c.latencyMs === null ? "—" : `${c.latencyMs} ms`}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Console actions"
              action={
                <Link href="/admin/audit" className="btn btn-quiet btn-sm">
                  Audit trail
                  <ArrowUpRight size={13} aria-hidden />
                </Link>
              }
            >
              <ul className="flex flex-col divide-y divide-[var(--divider)]">
                {load.data.recents.audit.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0">
                    <span className="min-w-0 truncate text-[13px] text-[var(--text-2)]">{a.title}</span>
                    <span className="shrink-0 text-[12px] text-[var(--muted)]">{ago(a.createdAt, NOW_ISO)}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel
              title="Outbound email"
              action={
                <Link href="/admin/email/queue" className="btn btn-quiet btn-sm">
                  Queue
                  <ArrowUpRight size={13} aria-hidden />
                </Link>
              }
            >
              <ul className="flex flex-col divide-y divide-[var(--divider)]">
                {load.data.recents.emails.slice(0, 6).map((d) => (
                  <li key={d.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0">
                    <span className="min-w-0 truncate text-[13px] text-[var(--text-2)]">{d.subject}</span>
                    <span
                      className={`shrink-0 text-[12px] ${
                        d.status === "failed" || d.status === "bounced"
                          ? "text-[var(--danger-text)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <p className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
            <Users size={13} aria-hidden />
            {load.data.overview.users.active} active this week ·{" "}
            <Mail size={13} aria-hidden />
            {load.data.overview.emails.total} deliveries ·{" "}
            <ShieldAlert size={13} aria-hidden />
            {load.data.overview.banned + load.data.overview.suspended} accounts held · uptime{" "}
            {duration(load.data.uptimeSeconds)}
          </p>
        </>
      )}
    </>
  );
}

function StatRow({ d }: { d: Awaited<ReturnType<typeof dash>> }) {
  const stats = [
    { label: "Accounts", value: d.overview.users.total, hint: `${d.overview.users.active} active this week`, href: "/admin/people" },
    { label: "New today", value: d.overview.users.newToday, hint: `${d.overview.users.newThisWeek} this week`, href: "/admin/people?sort=newest" },
    { label: "Sign-ins today", value: d.overview.logins.today, hint: `${d.overview.logins.failedToday} failed`, href: "/admin/security-events" },
    { label: "Open tickets", value: d.overview.tickets.open, hint: `${d.overview.tickets.total} all time`, href: "/admin/tickets" },
    { label: "Email queued", value: d.tables.find((t) => t.name === "email_jobs")?.rows ?? 0, hint: `${d.overview.emails.failures} failed`, href: "/admin/email/queue" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {stats.map((s) => (
        <Metric key={s.label} label={s.label} value={s.value.toLocaleString()} hint={s.hint} href={s.href} />
      ))}
    </div>
  );
}


/** A column chart in CSS. No charting library: a scaffold that cannot be
    read without a canvas is a scaffold you cannot review offline. */
function Chart({ points, tone = "accent" }: { points: SeriesPoint[]; tone?: "accent" | "success" }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const fill = tone === "success" ? "var(--success)" : "var(--accent-solid)";

  return (
    <div>
      <div className="flex h-28 items-end gap-1" role="img" aria-label="Daily series">
        {points.map((p, i) => (
          <div
            key={p.label}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: `${Math.max(3, Math.round((p.value / max) * 100))}%`,
              background: fill,
              opacity: i === points.length - 1 ? 1 : 0.72,
            }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-[var(--muted)]">
        <span>{points[0]?.label}</span>
        <span>peak {max}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function Breakdown({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13px] text-[var(--text-2)]">{r.label}</span>
          <span className="text-[13px] font-medium tabular-nums">{r.value}</span>
          <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent-solid)]"
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Metered({ items }: { items: Array<[string, number]> }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map(([label, value]) => (
        <li key={label} className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-[var(--text-2)]">{label}</span>
          <span className="text-[16px] font-semibold tabular-nums tracking-[-0.02em]">
            {value.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* Written out in full: Tailwind can only generate a utility it can see in the
   source, so a status colour is a lookup, never an interpolated class name. */
const DOT: Record<string, string> = {
  ok: "bg-success",
  degraded: "bg-warn",
  down: "bg-danger",
  unknown: "bg-surface-3",
};
