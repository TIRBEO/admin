import Link from "next/link";
import { getDash, type Dash } from "@/lib/dash";
import { num } from "@/lib/api";
import { ago } from "@/lib/format";
import { Card, Stat, State, Badge, DataTable } from "@/components/primitives";
import { Failure } from "@/components/failure";

/* The dashboard is one read of /admin/dash and everything on it is derived
   from that single payload, so two tiles can never contradict each other. */

export default async function DashboardPage() {
  const res = await getDash();
  if (!res.ok) return <Failure result={res} what="the platform dashboard" />;

  const d: Dash = res.data ?? {};
  const o = d.overview ?? {};
  const req = o.requests ?? {};

  const alerts = (d.alerts?.recentAlerts ?? []).filter(
    (a) => typeof a?.message === "string",
  );

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Key figures"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          label="Accounts"
          value={num(o.users?.total) ?? "—"}
          hint={`${num(o.users?.newToday) ?? 0} joined today`}
        />
        <Stat
          label="Active sessions"
          value={num(o.sessions?.active) ?? "—"}
          hint={`${num(o.users?.activeToday) ?? 0} accounts active today`}
        />
        <Stat
          label="Sign-ins today"
          value={num(o.logins?.today) ?? "—"}
          hint={`${num(d.logins?.failedToday) ?? 0} failed`}
        />
        <Stat
          label="Blocked requests"
          value={
            <span>
              {num(req.blocked) ?? "—"}
              <span className="ml-1.5 text-[14px] font-normal text-[var(--tb-text-muted)]">
                {typeof req.blockRate === "number" ? `${req.blockRate}%` : "—"}
              </span>
            </span>
          }
          hint={`of ${num(req.hits) ?? "—"} seen in the window`}
        />
      </section>

      {alerts.length > 0 || d.alerts?.alertTriggered ? (
        <Card
          title="Needs attention"
          description="Raised by the rate limiter on its own."
        >
          <ul className="flex flex-col gap-2">
            {alerts.slice(0, 5).map((a, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--tb-danger)] bg-[var(--tb-danger-soft)] px-3 py-2.5"
              >
                <span className="text-[13px]">{a.message}</span>
                <span className="shrink-0 text-[12px] text-[var(--tb-text-muted)]">
                  {ago(new Date(a.timestamp))}
                </span>
              </li>
            ))}
            {alerts.length === 0 ? (
              <li className="text-[13px] text-[var(--tb-text-secondary)]">
                A block-rate alert is currently latched.
              </li>
            ) : null}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Accounts"
          description="Where the people are, and who is held back."
          action={
            <Link
              href="/admin/users"
              className="text-[12px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
            >
              Open
            </Link>
          }
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-3">
            {[
              ["Total", num(d.users?.total)],
              ["Active (7d)", num(d.users?.active)],
              ["New this month", num(d.users?.newThisMonth)],
              ["Banned", num(d.users?.banned)],
              ["Suspended", num(d.users?.suspended)],
              ["Awaiting deletion", num(d.users?.scheduledDeletion)],
              ["2FA enabled", num(d.users?.twoFA)],
              ["Email verified", num(d.users?.verifiedEmail)],
              ["Sessions active", num(d.sessions?.active)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-baseline justify-between gap-2">
                <dt className="text-[var(--tb-text-muted)]">{label}</dt>
                <dd className="font-medium tabular-nums">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card
          title="Email"
          description="Delivery, failures and engagement."
          action={
            <Link
              href="/admin/email"
              className="text-[12px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
            >
              Open
            </Link>
          }
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-3">
            {[
              ["Sent today", num(d.emails?.today)],
              ["Last hour", num(d.emails?.lastHour)],
              ["Failures", num(d.emails?.failures)],
              ["Opened", num(d.emails?.opened)],
              ["Clicked", num(d.emails?.clicked)],
              ["Push channels", num(d.push?.total)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-baseline justify-between gap-2">
                <dt className="text-[var(--tb-text-muted)]">{label}</dt>
                <dd className="font-medium tabular-nums">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          {(d.emails?.byStatus ?? []).length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {(d.emails?.byStatus ?? []).map((s) => (
                <li key={s.status}>
                  <Badge
                    tone={
                      s.status === "failed"
                        ? "danger"
                        : s.status === "delivered"
                          ? "ok"
                          : "muted"
                    }
                  >
                    {s.status} · {s.count}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>

      <Card
        title="Slowest queries"
        description="p95, measured in the running API process."
        action={
          <Link
            href="/admin/operations/monitor"
            className="text-[12px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
          >
            Monitor
          </Link>
        }
      >
        <DataTable
          columns={["Query", "Calls", "Avg", "p95", "Max"]}
          empty="No query timings have been recorded yet."
          rows={(d.queryPerf?.slowest ?? []).map((q) => ({
            Query: <span className="font-mono text-[12px]">{q.name}</span>,
            Calls: q.count,
            Avg: `${q.avgMs} ms`,
            p95: (
              <span
                className={q.p95Ms > 500 ? "text-[var(--tb-warn)]" : undefined}
              >
                {q.p95Ms} ms
              </span>
            ),
            Max: `${q.maxMs} ms`,
          }))}
        />
      </Card>

      <Card title="Where to go next">
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            { href: "/admin/users", label: "Find or act on an account" },
            { href: "/admin/security", label: "Check the security posture" },
            { href: "/admin/operations/health", label: "Is the API healthy?" },
            { href: "/admin/audit", label: "Review who changed what" },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-lg border border-[var(--tb-border)] px-3 py-2.5 text-[13px] text-[var(--tb-text-secondary)] transition-colors hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-text-primary)]"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-[12px] text-[var(--tb-text-muted)]">
        Read {d.fetchedAt ? ago(d.fetchedAt) : "just now"}
        {typeof d.uptime === "number"
          ? ` · API up ${Math.round(d.uptime / 60)} min`
          : ""}
      </p>

      {!d.fetchedAt ? (
        <State title="The API returned no telemetry payload." />
      ) : null}
    </div>
  );
}