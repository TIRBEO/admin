import { apiGet } from "@/lib/api";
import { Card, Stat, DataTable, Badge } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

/* GET /api/admin/security/events returns the paginated events plus a
   `stats` block (today / week / month totals and how many of those were
   critical). The stats come back with the page rather than needing a
   second request, so the tiles and the list can never be from different
   moments. */

type Event = {
  id?: string;
  eventType?: string;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  createdAt?: string;
};

type Stats = {
  today?: { total?: number; critical?: number };
  week?: { total?: number; critical?: number };
  month?: { total?: number; critical?: number };
  total?: number;
  activeBlocks?: number;
};

type Payload = {
  events?: Event[];
  total?: number;
  page?: number;
  limit?: number;
  stats?: Stats;
};

const SEVERITIES: string[] = ["", "info", "warning", "error", "critical"];
const SIZES = [50, 100, 200];

export default async function SecurityEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    severity?: string;
    eventType?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const sp = await searchParams;
  const severity = SEVERITIES.includes(sp.severity ?? "")
    ? (sp.severity as string)
    : "";
  const eventType = (sp.eventType ?? "").trim();
  const rawLimit = Number(sp.limit);
  const limit = SIZES.includes(rawLimit) ? rawLimit : 50;
  const page = Math.max(1, Number(sp.page) || 1);

  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  if (severity) params.set("severity", severity);
  if (eventType) params.set("eventType", eventType);

  const res = await apiGet<Payload>(`/admin/security/events?${params}`);
  if (!res.ok) return <Failure result={res} what="the security events log" />;

  const data = res.data ?? {};
  const events = data.events ?? [];
  const stats = data.stats ?? {};
  const pages = Math.max(1, Math.ceil((data.total ?? 0) / limit));

  const href = (p: number) =>
    `/admin/security/events?${new URLSearchParams({
      ...(severity ? { severity } : {}),
      ...(eventType ? { eventType } : {}),
      limit: String(limit),
      page: String(p),
    })}`;

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Event volume"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat label="Today" value={stats.today?.total ?? 0} hint={`${stats.today?.critical ?? 0} critical`} />
        <Stat label="This week" value={stats.week?.total ?? 0} hint={`${stats.week?.critical ?? 0} critical`} />
        <Stat label="This month" value={stats.month?.total ?? 0} hint={`${stats.month?.critical ?? 0} critical`} />
        <Stat
          label="All time"
          value={stats.total ?? 0}
          hint={`${stats.activeBlocks ?? 0} blocks in force`}
        />
      </section>

      <Card title="Filter" description="Severity, or an exact event type.">
        <form action="/admin/security/events" method="get" className="flex flex-wrap gap-2">
          <label htmlFor="severity" className="sr-only">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            defaultValue={severity}
            className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          >
            <option value="">Any severity</option>
            {SEVERITIES.slice(1).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label htmlFor="eventType" className="sr-only">
            Event type
          </label>
          <input
            id="eventType"
            name="eventType"
            defaultValue={eventType}
            placeholder="Event type, e.g. login_failed"
            className="w-full max-w-xs rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="limit" className="sr-only">
            Rows per page
          </label>
          <select
            id="limit"
            name="limit"
            defaultValue={String(limit)}
            className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          >
            {SIZES.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Apply
          </button>
        </form>
      </Card>

      <Card
        title="Events"
        description={`${data.total ?? 0} match. Showing ${events.length}.`}
      >
        <DataTable
          columns={["When", "Type", "What", "Severity", "IP", "Account"]}
          empty="No security events match."
          rows={events.map((e) => ({
            When: <span title={dateTime(e.createdAt)}>{ago(e.createdAt)}</span>,
            Type: (
              <span className="font-mono text-[12px]">
                {e.eventType ?? e.kind ?? "—"}
              </span>
            ),
            What: e.title ?? e.detail ?? "—",
            Severity: e.severity ? (
              <Badge tone={severityTone(e.severity)}>{e.severity}</Badge>
            ) : (
              "—"
            ),
            IP: e.ipAddress ?? "—",
            Account: e.userId ? (
              <span className="font-mono text-[11px]">{e.userId.slice(0, 8)}</span>
            ) : (
              "—"
            ),
          }))}
        />

        {pages > 1 ? (
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-[13px]">
            {page > 1 ? (
              <a href={href(page - 1)} className="rounded-lg border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]">
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <span className="text-[var(--tb-text-muted)]">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <a href={href(page + 1)} className="rounded-lg border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]">
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Card>
    </div>
  );
}

function severityTone(s: string) {
  return s === "critical" || s === "error"
    ? ("danger" as const)
    : s === "warning"
      ? ("warn" as const)
      : ("muted" as const);
}