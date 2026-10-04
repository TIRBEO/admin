import { apiGet, num } from "@/lib/api";
import { getDash } from "@/lib/dash";
import { Card, Stat, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateOnly, ago } from "@/lib/format";

/* Analytics is two questions: how big is the platform, and who consented to
   be measured. Both endpoints are read here rather than derived from the
   dashboard, because this page is the one place consent is in view — a
   consent figure should never be inferred from a count of everything. */

type Overview = {
  users?: {
    total?: number;
    active?: number;
    newToday?: number;
    newThisWeek?: number;
    newThisMonth?: number;
  };
  notifications?: { total?: number; unread?: number };
  sessions?: { total?: number; active?: number };
  auditEvents?: { last30Days?: number };
  apiKeys?: { active?: number };
};

type Consented = {
  users?: Array<{
    id: string;
    email: string;
    username?: string | null;
    name?: string | null;
    createdAt?: string;
    lastLoginAt?: string | null;
    theme?: string | null;
    language?: string | null;
    timezone?: string | null;
    sessionCount?: number;
    notificationCount?: number;
    totalLogins?: number;
  }>;
  total?: number;
};

type AnalyticsDetail = {
  totalUsers?: number;
  adminUsers?: number;
  newToday?: number;
  topActions?: Array<{ action: string; count: number }>;
};

export default async function AnalyticsPage() {
  const [overviewRes, consentedRes, detailRes, dashRes] = await Promise.all([
    apiGet<Overview>("/admin/analytics/overview"),
    apiGet<Consented>("/admin/analytics/consented-users?take=50"),
    apiGet<AnalyticsDetail>("/admin/analytics"),
    getDash(30),
  ]);

  // Consent is the one figure that must never be guessed: if it cannot be
  // read, this page says so instead of implying nobody opted in.
  if (!consentedRes.ok) {
    return <Failure result={consentedRes} what="the analytics consent list" />;
  }

  const o = overviewRes.data ?? {};
  const consented = consentedRes.data ?? {};
  const detail = detailRes.data ?? {};
  const series = dashRes.data?.series ?? {};
  const consentedTotal = consented.total ?? consented.users?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Platform size"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          label="Accounts"
          value={num(o.users?.total ?? detail.totalUsers) ?? "—"}
          hint={`${num(o.users?.newThisMonth) ?? 0} joined in 30 days`}
        />
        <Stat
          label="Active (7 days)"
          value={num(o.users?.active) ?? "—"}
          hint="Signed in or otherwise active this week"
        />
        <Stat
          label="Notifications"
          value={num(o.notifications?.total) ?? "—"}
          hint={`${num(o.notifications?.unread) ?? 0} unread`}
        />
        <Stat
          label="Analytics consent"
          value={consentedTotal}
          hint="Accounts that opted in to measurement"
        />
      </section>

      <Card
        title="Signups, last 30 days"
        description="One bar per day, from the same series the dashboard charts."
      >
        <SeriesBars
          points={series.users ?? []}
          label={(l) => l}
          empty="No signups recorded in this window."
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Activity, last 30 days"
          description="Every write the platform recorded."
        >
          <SeriesBars
            points={series.activity ?? []}
            label={(l) => l}
            empty="No activity recorded in this window."
          />
        </Card>

        <Card title="Busiest actions" description="Top of the last 30 days.">
          <DataTable
            columns={["Action", "Count"]}
            empty="No actions recorded."
            rows={(detail.topActions ?? []).map((a) => ({
              Action: <span className="font-mono text-[12px]">{a.action}</span>,
              Count: a.count,
            }))}
          />
        </Card>
      </div>

      <Card
        title="Consented accounts"
        description={`${consentedTotal} in total; the 50 most recent are listed.`}
      >
        <DataTable
          columns={["Email", "Handle", "Joined", "Last login", "Sessions", "Notifications"]}
          empty="No account has opted in to analytics."
          rows={(consented.users ?? []).map((u) => ({
            Email: <span className="font-mono text-[12px]">{u.email}</span>,
            Handle: u.username ?? u.name ?? "—",
            Joined: dateOnly(u.createdAt),
            "Last login": u.lastLoginAt ? ago(u.lastLoginAt) : "never",
            Sessions: u.sessionCount ?? 0,
            Notifications: u.notificationCount ?? 0,
          }))}
        />
      </Card>

      {overviewRes.status === 0 ? (
        <p className="text-[12px] text-[var(--tb-warn)]">
          The overview counters could not be read; the consent list above is
          real, the tiles above it may be stale.
        </p>
      ) : null}
    </div>
  );
}

/** A labelled bar per day. Deliberately a table rather than a canvas: the
 *  numbers stay selectable, screen-readable and printable. */
function SeriesBars({
  points,
  label,
  empty,
}: {
  points: Array<{ label: string; value: number }>;
  label: (l: string) => string;
  empty: string;
}) {
  if (points.length === 0) return <State title={empty} />;
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div>
      <div
        role="img"
        aria-label={`Daily totals, ${points.length} days, peak ${max}`}
        className="flex h-24 items-end gap-px"
      >
        {points.map((p) => (
          <div
            key={p.label}
            title={`${label(p.label)}: ${p.value}`}
            className="min-w-[3px] flex-1 rounded-t bg-[var(--tb-accent)]"
            style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-[var(--tb-text-muted)]">
        <span>{label(points[0]?.label ?? "")}</span>
        <span>
          peak {max} · total {points.reduce((a, p) => a + p.value, 0)}
        </span>
        <span>{label(points.at(-1)?.label ?? "")}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {points.slice(-3).map((p) => (
          <li key={p.label}>
            <Badge tone="accent">
              {label(p.label)} · {p.value}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}