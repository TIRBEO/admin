import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Mail,
  ShieldAlert,
  Ticket,
  Users,
  Zap,
} from "lucide-react";

import { PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readDashboard } from "@/lib/dashboard";
import { ago, dateTime, duration } from "@/lib/format";

import type { SeriesPoint } from "@/lib/mock/types";

export default async function DashboardPage() {
  /* Live numbers. The overview is the screen an operator opens when something
     is wrong, so it has to be the platform's own counts — a rehearsed
     snapshot would answer "all clear" about a platform that is anything but. */
  const load = await readDashboard();
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader
        title="Overview"
        description="Realtime health, traffic, and actions that need attention across Tirbeo."
        actions={
          <>
            <Link href="/admin/activity" className="btn btn-secondary btn-sm">
              <Activity size={14} aria-hidden />
              Live activity
            </Link>
            <Link href="/admin/security-events" className="btn btn-primary btn-sm">
              <ShieldAlert size={14} aria-hidden />
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <QuickStat
              label="Total accounts"
              value={load.data.snapshot.overview.users.total.toLocaleString()}
              change={`+${load.data.snapshot.overview.users.newThisWeek} this week`}
              href="/admin/people"
              icon={Users}
            />
            <QuickStat
              label="New today"
              value={load.data.snapshot.overview.users.newToday.toLocaleString()}
              change={`${load.data.snapshot.overview.users.active} active`}
              href="/admin/people?sort=newest"
              icon={Zap}
            />
            <QuickStat
              label="Sign-ins today"
              value={load.data.snapshot.overview.logins.today.toLocaleString()}
              change={`${load.data.snapshot.overview.logins.failedToday} failed`}
              href="/admin/security-events"
              icon={Activity}
            />
            <QuickStat
              label="Open tickets"
              value={load.data.snapshot.overview.tickets.open.toLocaleString()}
              change={`${load.data.snapshot.overview.tickets.total} total`}
              href="/admin/tickets"
              icon={Ticket}
            />
            <QuickStat
              label="Emails sent"
              value={load.data.snapshot.overview.emails.today.toLocaleString()}
              change={`${load.data.snapshot.overview.emails.failures} failed`}
              href="/admin/email/queue"
              icon={Mail}
            />
            <QuickStat
              label="Held accounts"
              value={(load.data.snapshot.overview.banned + load.data.snapshot.overview.suspended).toLocaleString()}
              change="Banned / suspended"
              href="/admin/blocklist"
              icon={ShieldAlert}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel
              title="Traffic & signups"
              hint={`Updated ${ago(load.data.snapshot.fetchedAt, now)} · Buckets end ${dateTime(load.data.snapshot.fetchedAt)}`}
              action={
                <Link href="/admin/analytics" className="btn btn-quiet btn-sm">
                  View analytics
                  <ArrowUpRight size={13} aria-hidden />
                </Link>
              }
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[var(--text-2)]">Activity (14d)</p>
                    <Pill tone="accent">Active</Pill>
                  </div>
                  <Chart points={load.data.snapshot.series.activity} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[var(--text-2)]">Signups (14d)</p>
                    <Pill tone="success">Growth</Pill>
                  </div>
                  <Chart points={load.data.snapshot.series.signups} tone="success" />
                </div>
              </div>
            </Panel>

            <Panel title="Needs attention">
              <ul className="flex flex-col gap-2">
                {load.data.snapshot.alerts.length === 0 ? (
                  <li className="flex items-center justify-center py-6 text-[13px] text-[var(--text-4)]">All clear</li>
                ) : (
                  load.data.snapshot.alerts.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-[var(--hover)]">
                      <span
                        className={`mt-0.5 ${
                          a.severity === "critical"
                            ? "text-[var(--danger-text)]"
                            : a.severity === "warning"
                              ? "text-[var(--warn-text)]"
                              : "text-[var(--text-4)]"
                        }`}
                      >
                        <ShieldAlert size={16} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-medium text-[var(--fg)]">{a.title}</p>
                          <span className="shrink-0 text-[11px] text-[var(--text-4)]">{ago(a.at, now)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-[var(--text-3)]">{a.detail}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Panel title="Accounts" hint="By status">
              <Breakdown rows={load.data.snapshot.breakdowns.usersByStatus} />
            </Panel>
            <Panel title="Authentication" hint="By method">
              <Breakdown rows={load.data.snapshot.breakdowns.loginsByMethod} />
            </Panel>
            <Panel title="Security posture">
              <div className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[12px] text-[var(--text-4)]">Score</p>
                    <Link href="/admin/security-events" className="text-[36px] font-semibold tabular-nums tracking-[-0.03em] text-[var(--accent-text)]">
                      {load.data.score.score}
                    </Link>
                  </div>
                  <Pill tone={load.data.score.score >= 90 ? "success" : load.data.score.score >= 75 ? "warn" : "danger"}> {load.data.score.score >= 90 ? "Strong" : load.data.score.score >= 75 ? "Fair" : "Needs work"} </Pill>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Events today" value={load.data.snapshot.overview.securityEventsToday} />
                  <MiniStat label="2FA adoption" value={`${Math.round((load.data.snapshot.overview.twoFA / Math.max(1, load.data.snapshot.overview.users.total)) * 100)}%`} />
                </div>
              </div>
            </Panel>
            <Panel title="System health" hint={load.data.snapshot.health.version}>
              <ul className="flex flex-col gap-2">
                {load.data.snapshot.health.checks.slice(0, 5).map((c) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[c.status] ?? DOT.unknown}`} />
                    <span className="flex-1 truncate text-[13px] text-[var(--text-2)]">{c.name}</span>
                    <span className="text-[12px] tabular-nums text-[var(--text-4)]">{c.latencyMs === null ? "—" : `${c.latencyMs}ms`}</span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/health" className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--accent-text)] hover:underline">
                View all services <ArrowUpRight size={12} aria-hidden />
              </Link>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Recent admin actions"
              action={
                <Link href="/admin/audit" className="btn btn-quiet btn-sm">
                  Audit log <ArrowUpRight size={13} aria-hidden />
                </Link>
              }
              flush
            >
              <ul className="divide-y divide-[var(--divider)]">
                {load.data.snapshot.recents.audit.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-[var(--fg)]">{a.title}</p>
                    </div>
                    <span className="shrink-0 text-[12px] text-[var(--text-4)]">{ago(a.createdAt, now)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel
              title="Outbound email"
              action={
                <Link href="/admin/email/queue" className="btn btn-quiet btn-sm">
                  Email queue <ArrowUpRight size={13} aria-hidden />
                </Link>
              }
              flush
            >
              <ul className="divide-y divide-[var(--divider)]">
                {load.data.snapshot.recents.emails.slice(0, 6).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="min-w-0 truncate text-[13px] text-[var(--fg)]">{d.subject}</p>
                    <Pill tone={d.status === "failed" || d.status === "bounced" ? "danger" : d.status === "sent" ? "success" : "muted"}>{d.status}</Pill>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[12px] text-[var(--text-4)]">
            <span className="flex items-center gap-1.5"><Clock size={13} aria-hidden /> Uptime {duration(load.data.snapshot.uptimeSeconds)}</span>
            <span>•</span>
            <span>{load.data.snapshot.overview.users.active} active this week</span>
            <span>•</span>
            <span>{load.data.snapshot.overview.emails.total} deliveries tracked</span>
          </div>
        </>
      )}
    </>
  );
}

function QuickStat({ label, value, change, href, icon: Icon }: { label: string; value: string; change: string; href: string; icon: any }) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-plate)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_1px_1px_rgba(255,255,255,0.01)_inset,0_12px_40px_-18px_rgba(10,132,255,0.45)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] text-[var(--text-4)]">{label}</p>
          <p className="mt-1 text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-[var(--fg)]">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
          <Icon size={16} aria-hidden />
        </div>
      </div>
      <p className="mt-2 text-[12px] text-[var(--text-4)]">{change}</p>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2">
      <p className="text-[11px] text-[var(--text-4)]">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-[var(--fg)]">{value}</p>
    </div>
  );
}

function Chart({ points, tone = "accent" }: { points: SeriesPoint[]; tone?: "accent" | "success" }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const fill = tone === "success" ? "linear-gradient(180deg, rgba(50,215,75,0.9) 0%, rgba(50,215,75,0.4) 100%)" : "linear-gradient(180deg, rgba(10,132,255,0.9) 0%, rgba(10,132,255,0.4) 100%)";

  return (
    <div>
      <div className="flex h-32 items-end gap-1.5" role="img" aria-label="Daily series">
        {points.map((p, i) => (
          <div
            key={p.label}
            className="group relative flex-1"
            style={{ height: `${Math.max(6, Math.round((p.value / max) * 100))}%` }}
          >
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-md"
              style={{ height: "100%", background: fill, opacity: i === points.length - 1 ? 1 : 0.7 }}
              title={`${p.label}: ${p.value}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-[var(--text-4)]">
        <span>{points[0]?.label}</span>
        <span>{points[Math.floor(points.length / 2)]?.label}</span>
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
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="truncate text-[var(--text-2)]">{r.label}</span>
            <span className="tabular-nums text-[var(--text-4)]">{r.value.toLocaleString()}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-text)]" style={{ width: `${Math.round((r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DOT: Record<string, string> = {
  ok: "bg-[var(--success)] shadow-[0_0_0_4px_rgba(50,215,75,0.12)]",
  degraded: "bg-[var(--warn)] shadow-[0_0_0_4px_rgba(255,214,10,0.12)]",
  down: "bg-[var(--danger)] shadow-[0_0_0_4px_rgba(255,69,58,0.12)]",
  unknown: "bg-[var(--surface-3)]",
};
