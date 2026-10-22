import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleDot,
  Clock,
  Inbox,
  ShieldAlert,
} from "lucide-react";

import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readDashboard } from "@/lib/dashboard";
import type { Core, DashAlert, MeasuredFactor, ScoreSummary } from "@/lib/dashboard";
import { ago, dateTime, duration } from "@/lib/format";
import type { OpenRequests } from "@/lib/support-summary";

import type { Load } from "@/lib/load-state";
import type { CountRow, SeriesPoint, Severity } from "@/lib/types";

/* The Overview, in the order an operator reads it when something is wrong:
 * the live numbers, then what needs attention, then the newest real events —
 * each panel linking to the screen that owns it. There are no rehearsed
 * placeholders here: lib/dashboard.ts drops every dash field the route
 * hardcodes, so if it is on this page the platform measured it. */

type Params = Record<string, string | string[] | undefined>;

const WINDOWS = [7, 14, 30, 90];

const DOT: Record<Severity, string> = {
  info: "bg-[var(--text-4)]",
  warning: "bg-warn",
  error: "bg-danger",
  critical: "bg-danger",
};

const CHART_TONE: Record<string, string> = {
  activity: "var(--chart-1)",
  users: "var(--chart-2)",
  emails: "var(--chart-5)",
  logins: "var(--chart-3)",
  notifications: "var(--chart-4)",
};

const n = (v: number) => v.toLocaleString();

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = Number(raw) || 14;

  const load = await readDashboard(days);
  // Ages are measured against the real clock — this is a live platform, and a
  // row that says "3 hours ago" when it arrived thirty seconds ago is acted on.
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What the platform measured about itself right now: the handful of live counts, what is waiting or wrong, and the newest real events. Anything this screen could not read from the API is simply not drawn."
        actions={
          <>
            <Link href="/admin/activity" className="btn btn-secondary btn-sm">
              <CircleDot size={14} aria-hidden />
              Live ledger
            </Link>
            <Link href="/admin/security-events" className="btn btn-primary btn-sm">
              <ShieldAlert size={14} aria-hidden />
              Security events
            </Link>
          </>
        }
      />

      <PageState
        load={load}
        rows={6}
        empty="Every live count answered zero — either the platform is brand new or the snapshot ran against an empty schema."
      />

      {load.status !== "ready" ? null : (
        <Dashboard core={load.data.core} score={load.data.score} requests={load.data.requests} now={now} />
      )}
    </>
  );
}

type Doors = {
  core: Core;
  score: Load<ScoreSummary>;
  requests: Load<OpenRequests>;
  now: string;
};

function Dashboard({ core, score, requests, now }: Doors) {
  const live = core.live;

  return (
    <div className="flex flex-col gap-5">
      <WindowSelector days={core.days} />

      {/* ── The live numbers ─────────────────────────────────────────── */}
      <section>
        <Eyebrow>Live numbers</Eyebrow>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Accounts" value={n(live.accountsTotal)} hint={`${n(live.newThisWeek)} new this week`} href="/admin/people" />
          <Metric label="New today" value={n(live.newToday)} hint={`${n(live.accountsActiveWeek)} active this week`} href="/admin/people?sort=newest" />
          <Metric
            label="Sign-ins today"
            value={n(live.signinsToday)}
            hint={`${n(live.signinFailuresToday)} failed today`}
            tone={live.signinFailuresToday > 0 ? "warn" : "default"}
            href="/admin/security-events"
          />
          <Metric label="Emails today" value={n(live.emailsToday)} hint={`${n(live.emailsLastHour)} in the last hour`} href="/admin/email/deliveries" />
          <Metric
            label="Flagged today"
            value={n(live.securityEventsToday)}
            hint="warning severity or up"
            tone={live.securityEventsToday > 0 ? "danger" : "default"}
            href="/admin/security-events"
          />
          <Metric label="Unread notices" value={n(live.notificationsUnread)} hint={`${n(live.notificationsTotal)} total`} href="/admin/notifications" />
        </div>
      </section>

      {/* ── What needs attention ─────────────────────────────────────── */}
      <section>
        <Eyebrow>Needs attention</Eyebrow>
        <div className="mt-2 grid gap-4 lg:grid-cols-2">
          <OpenRequestsPanel requests={requests} now={now} />
          <AlertsPanel alerts={core.alerts} now={now} />
        </div>
      </section>

      {/* ── Volume, day by day ───────────────────────────────────────── */}
      <Panel
        title="Volume, day by day"
        hint={`The last ${core.days} days, from the day-bucketed queries. A flat line is a measured zero, not a gap.`}
        action={
          <Link href="/admin/analytics" className="btn btn-quiet btn-sm">
            Full analytics <ArrowUpRight size={13} aria-hidden />
          </Link>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <Series label="Activity" points={core.series.activity} tone="activity" days={core.days} />
          <Series label="New accounts" points={core.series.users} tone="users" days={core.days} />
          <Series label="Emails sent" points={core.series.emails} tone="emails" days={core.days} />
          <Series label="Sign-ins" points={core.series.logins} tone="logins" days={core.days} />
          <Series label="Notifications" points={core.series.notifications} tone="notifications" days={core.days} />
        </div>
      </Panel>

      {/* ── Security posture & platform shape ────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ScorePanel score={score} now={now} />
        <BreakdownPanel title="Accounts" hint="By status" rows={core.accountsByStatus} href="/admin/people" />
        <BreakdownPanel title="Deliveries" hint="By status" rows={core.emailStatus} href="/admin/email/deliveries" />
      </div>

      {/* ── Newest real events ───────────────────────────────────────── */}
      <section>
        <Eyebrow>Newest real events</Eyebrow>
        <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RecentAuditPanel core={core} now={now} />
          <RecentSigninsPanel core={core} now={now} />
          <RecentEventsPanel core={core} now={now} />
          <RecentEmailsPanel core={core} now={now} />
          <RecentNoticesPanel core={core} now={now} />
          <TopActionsPanel rows={core.topActions} />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--text-4)]">
        <span className="flex items-center gap-1.5">
          <Clock size={13} aria-hidden /> API up {duration(core.uptimeSeconds)}
        </span>
        <span aria-hidden>·</span>
        <span>Snapshot {dateTime(core.fetchedAt)}</span>
        <span aria-hidden>·</span>
        <Link href="/admin/email/deliveries" className="hover:text-[var(--accent-text)] hover:underline">
          {n(core.emailTotal)} deliveries tracked
        </Link>
      </div>
    </div>
  );
}

// ── window selector ────────────────────────────────────────────────────────

function WindowSelector({ days }: { days: number }) {
  return (
    <Panel>
      <form action="/admin" method="get" className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Window</span>
        <select
          name="days"
          defaultValue={String(days)}
          className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
        >
          {WINDOWS.map((w) => (
            <option key={w} value={w}>
              {w} days
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary btn-sm h-9">
          Apply
        </button>
        <span className="ml-auto text-[12px] text-[var(--muted)]">
          The series span this window; the counts are today, the last hour, and this week.
        </span>
      </form>
    </Panel>
  );
}

// ── needs-attention doors ──────────────────────────────────────────────────

function OpenRequestsPanel({ requests, now }: { requests: Load<OpenRequests>; now: string }) {
  return (
    <Panel
      title="Waiting on us"
      hint="Requests with no answer recorded yet, threaded by reference code."
      action={
        <Link href="/admin/tickets" className="btn btn-quiet btn-sm">
          Queue <ArrowUpRight size={13} aria-hidden />
        </Link>
      }
    >
      <PageState load={requests} rows={3} empty="Nothing is waiting — every request in the newest window has an answer beside it." />
      {requests.status !== "ready" ? null : (
        <div>
          {requests.data.threads.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-[var(--text-4)]">Nothing is waiting on us right now.</p>
          ) : (
            <ul className="divide-y divide-[var(--divider)]">
              {requests.data.threads.map((t) => (
                <li key={t.ref} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <Inbox size={14} aria-hidden className="shrink-0 text-[var(--warn-text)]" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/tickets/${t.ref}`} className="block truncate text-[13px] font-medium text-[var(--fg)] hover:text-[var(--accent-text)]">
                      {t.subject}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-2 text-[12px] text-[var(--muted)]">
                      <span className="truncate">{t.account?.name ?? t.account?.username ?? t.account?.email ?? "an account"}</span>
                      <code className="text-[var(--text-4)]">{t.ref}</code>
                    </p>
                  </div>
                  <time className="shrink-0 text-[12px] tabular-nums text-[var(--muted)]" dateTime={t.askedAt} title={dateTime(t.askedAt)}>
                    {ago(t.askedAt, now)}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <p className="flex items-center justify-between gap-2 border-t border-[var(--divider)] pt-3 text-[12px] text-[var(--muted)]">
            <span>{requests.data.open} waiting</span>
            <Pill tone="muted">read newest {requests.data.window} rows</Pill>
          </p>
        </div>
      )}
    </Panel>
  );
}

function AlertsPanel({ alerts, now }: { alerts: DashAlert[]; now: string }) {
  return (
    <Panel
      title="Block-rate alerts"
      hint="Raised by the rate limiter when blocked requests pass the threshold."
      action={
        <Link href="/admin/limits" className="btn btn-quiet btn-sm">
          Limits <ArrowUpRight size={13} aria-hidden />
        </Link>
      }
    >
      {alerts.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-[var(--text-4)]">
          The limiter has not crossed its block-rate threshold.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-[var(--hover)]">
              <ShieldAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--warn-text)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--fg)]">
                  {a.blockRate}% blocked · threshold {a.threshold}%
                </p>
                <p className="mt-0.5 truncate text-[12px] text-[var(--text-3)]">{a.message}</p>
              </div>
              <time className="shrink-0 text-[11px] tabular-nums text-[var(--text-4)]" dateTime={a.at} title={dateTime(a.at)}>
                {ago(a.at, now)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ── security posture (a door, so it reports its own state) ─────────────────

function ScorePanel({ score, now }: { score: Load<ScoreSummary>; now: string }) {
  return (
    <Panel
      title="Security posture"
      hint="Only the checks the score endpoint computes from live counts."
      action={
        <Link href="/admin/security-events" className="btn btn-quiet btn-sm">
          Detail <ArrowUpRight size={13} aria-hidden />
        </Link>
      }
    >
      <PageState load={score} rows={4} empty="The posture door returned no computed checks." />
      {score.status !== "ready" ? null : (
        <div className="flex flex-col gap-3">
          {score.data.factors.map((f) => (
            <Factor key={f.name} factor={f} />
          ))}
          <div className="grid grid-cols-2 gap-2 border-t border-[var(--divider)] pt-3">
            <Mini label="Accounts" value={n(score.data.stats.totalUsers)} />
            <Mini label="2FA on" value={n(score.data.stats.usersWith2FA)} />
            <Mini label="Active sessions" value={n(score.data.stats.activeSessions)} />
            <Mini label="Blocked" value={n(score.data.stats.blockedIPs + score.data.stats.blockedUsers)} />
          </div>
          {score.data.recentCritical.length > 0 ? (
            <div className="border-t border-[var(--divider)] pt-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Critical, last 30 days</p>
              <ul className="flex flex-col gap-1.5">
                {score.data.recentCritical.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-[12px]">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-danger" />
                    <code className="truncate text-[var(--text-2)]">{e.kind}</code>
                    {e.ipAddress ? <span className="truncate text-[var(--text-4)]">{e.ipAddress}</span> : null}
                    <span className="ml-auto shrink-0 tabular-nums text-[var(--muted)]">{ago(e.createdAt, now)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  );
}

function Factor({ factor }: { factor: MeasuredFactor }) {
  const pct = factor.maxScore > 0 ? Math.round((factor.score / factor.maxScore) * 100) : 0;
  const tone = factor.status === "good" ? "success" : factor.status === "warning" ? "warn" : "danger";
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="text-[var(--fg)]">{factor.name}</span>
        <Pill tone={tone}>
          {factor.score}/{factor.maxScore}
        </Pill>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
      {factor.description ? <p className="mt-1 text-[12px] text-[var(--muted)]">{factor.description}</p> : null}
    </div>
  );
}

// ── volume charts ──────────────────────────────────────────────────────────

function Series({ label, points, tone, days }: { label: string; points: SeriesPoint[]; tone: string; days: number }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const colour = CHART_TONE[tone] ?? "var(--chart-1)";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-medium text-[var(--text-2)]">{label}</p>
        <span className="text-[12px] tabular-nums text-[var(--text-4)]">
          {n(total)} over {days}d
        </span>
      </div>
      <div className="flex h-24 items-end gap-[3px]" role="img" aria-label={`${label}: ${total} events over ${days} days`}>
        {points.map((p, i) => (
          <div
            key={`${p.label}-${i}`}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: `${Math.max(2, Math.round((p.value / max) * 100))}%`,
              background: colour,
              opacity: i === points.length - 1 ? 1 : 0.65,
            }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-[var(--text-4)]">
        <span>{points[0]?.label ?? "—"}</span>
        <span>{points[points.length - 1]?.label ?? "—"}</span>
      </div>
    </div>
  );
}

// ── breakdowns ─────────────────────────────────────────────────────────────

function BreakdownPanel({ title, hint, rows, href }: { title: string; hint: string; rows: CountRow[]; href: string }) {
  const present = rows.filter((r) => r.value > 0);
  return (
    <Panel
      title={title}
      hint={hint}
      action={
        <Link href={href} className="btn btn-quiet btn-sm">
          Open <ArrowUpRight size={13} aria-hidden />
        </Link>
      }
    >
      {present.length === 0 ? (
        <p className="py-2 text-[13px] text-[var(--text-4)]">Nothing counted yet.</p>
      ) : (
        <Bars rows={present} />
      )}
    </Panel>
  );
}

function Bars({ rows }: { rows: CountRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="truncate text-[var(--text-2)]">{r.label}</span>
            <span className="tabular-nums text-[var(--text-4)]">{n(r.value)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.round((r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── recent-event panels ────────────────────────────────────────────────────

function RecentAuditPanel({ core, now }: { core: Core; now: string }) {
  return (
    <Recents title="Console & platform actions" href="/admin/audit" label="Audit trail" empty="No events in the last week.">
      {core.recentAudit.slice(0, 6).map((a) => (
        <Row key={a.id} dot={DOT[a.severity]} at={a.createdAt} now={now}>
          <p className="truncate text-[13px] text-[var(--fg)]">{a.title}</p>
          <p className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-[var(--muted)]">
            <code>{a.kind}</code>
            <span className="truncate">{a.actor}</span>
          </p>
        </Row>
      ))}
    </Recents>
  );
}

function RecentSigninsPanel({ core, now }: { core: Core; now: string }) {
  return (
    <Recents title="Sign-ins" href="/admin/security-events" label="Events" empty="No sign-ins recorded.">
      {core.recentLogins.slice(0, 6).map((l) => (
        <Row key={l.id} dot={DOT.info} at={l.createdAt} now={now}>
          <p className="truncate text-[13px] text-[var(--fg)]">{l.kind}</p>
          <p className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-[var(--muted)]">
            <span className="truncate font-mono">{l.userId ?? "anonymous"}</span>
            {l.ipAddress ? <code>{l.ipAddress}</code> : null}
          </p>
        </Row>
      ))}
    </Recents>
  );
}

function RecentEventsPanel({ core, now }: { core: Core; now: string }) {
  return (
    <Recents title="Latest ledger rows" href="/admin/security-events" label="Events" empty="The ledger is empty.">
      {core.recentEvents.slice(0, 6).map((e) => (
        <Row key={e.id} dot={DOT[e.severity]} at={e.createdAt} now={now}>
          <p className="truncate text-[13px] text-[var(--fg)]">{e.kind}</p>
          <p className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-[var(--muted)]">
            <span className="truncate font-mono">{e.userId ?? "system"}</span>
            {e.ipAddress ? <code>{e.ipAddress}</code> : null}
          </p>
        </Row>
      ))}
    </Recents>
  );
}

function RecentEmailsPanel({ core, now }: { core: Core; now: string }) {
  return (
    <Recents title="Outbound mail" href="/admin/email/deliveries" label="Deliveries" empty="No mail sent.">
      {core.recentEmails.slice(0, 6).map((d) => (
        <li key={d.id} className="flex items-center gap-3 px-4 py-2.5 first:pt-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-[var(--fg)]">{d.subject}</p>
            <p className="mt-0.5 truncate text-[12px] text-[var(--muted)]">{d.toEmail}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Pill tone={d.status === "failed" || d.status === "bounced" ? "danger" : d.status === "sent" || d.status === "delivered" ? "success" : "muted"}>
              {d.status}
            </Pill>
            <time className="text-[11px] tabular-nums text-[var(--text-4)]" dateTime={d.createdAt} title={dateTime(d.createdAt)}>
              {ago(d.createdAt, now)}
            </time>
          </div>
        </li>
      ))}
    </Recents>
  );
}

function RecentNoticesPanel({ core, now }: { core: Core; now: string }) {
  return (
    <Recents title="Newest notices" href="/admin/notifications" label="All" empty="No notices sent.">
      {core.recentNotices.slice(0, 6).map((m) => (
        <Row key={m.id} dot={m.isRead ? DOT.info : DOT.warning} at={m.createdAt} now={now}>
          <p className="truncate text-[13px] text-[var(--fg)]">{m.title}</p>
          <p className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-[var(--muted)]">
            <code>{m.type}</code>
            {m.isRead ? null : <span className="text-[var(--accent-text)]">unread</span>}
          </p>
        </Row>
      ))}
    </Recents>
  );
}

function TopActionsPanel({ rows }: { rows: CountRow[] }) {
  const present = rows.filter((r) => r.value > 0);
  return (
    <Recents title="Busiest ledger kinds" href="/admin/activity" label="Ledger" empty="No events in the last month.">
      {present.slice(0, 6).map((a) => (
        <li key={a.label} className="flex items-center gap-2 px-4 py-2.5 first:pt-3">
          <code className="min-w-0 flex-1 truncate text-[12px] text-[var(--text-2)]">{a.label}</code>
          <span className="shrink-0 text-[12px] tabular-nums text-[var(--text-4)]">{n(a.value)}</span>
        </li>
      ))}
    </Recents>
  );
}

// ── small shared pieces ────────────────────────────────────────────────────

function Recents({ title, href, label, empty, children }: { title: string; href: string; label: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasRows = items.some((c) => c !== null && c !== undefined && c !== false);
  return (
    <Panel
      title={title}
      flush
      action={
        <Link href={href} className="btn btn-quiet btn-sm">
          {label} <ArrowUpRight size={13} aria-hidden />
        </Link>
      }
    >
      {hasRows ? <ul className="divide-y divide-[var(--divider)]">{children}</ul> : <p className="px-4 py-6 text-center text-[13px] text-[var(--text-4)]">{empty}</p>}
    </Panel>
  );
}

function Row({ dot, at, now, children }: { dot: string; at: string; now: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 first:pt-3">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0 flex-1">{children}</div>
      <time className="shrink-0 text-[11px] tabular-nums text-[var(--text-4)]" dateTime={at} title={dateTime(at)}>
        {ago(at, now)}
      </time>
    </li>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2">
      <p className="text-[11px] text-[var(--text-4)]">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-[var(--fg)]">{value}</p>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">{children}</h2>;
}
