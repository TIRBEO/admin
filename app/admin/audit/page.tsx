import { apiGet } from "@/lib/api";
import { Card, Stat, DataTable, Badge } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

/* GET /api/admin/audit returns { events, total, limit, offset }. Every row
   carries an `action` (mirrored from the stored `kind`), a severity and the
   account that caused it — which is the whole point of the table: an
   operator reading it can answer "was that allowed, and by whom".

   The action filter is a substring match on the stored kind, so a partial
   word is enough. */

type AuditEvent = {
  id?: string;
  action?: string;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  actorId?: string | null;
  userId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: unknown;
  createdAt?: string;
};

type Payload = { events?: AuditEvent[]; total?: number; limit?: number; offset?: number };

const SEVERITIES: string[] = ["", "info", "warning", "error", "critical"];
const SIZES = [50, 100, 200];

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    severity?: string;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const sp = await searchParams;
  const action = (sp.action ?? "").trim();
  const severity = SEVERITIES.includes(sp.severity ?? "")
    ? (sp.severity as string)
    : "";
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();
  const rawLimit = Number(sp.limit);
  const limit = SIZES.includes(rawLimit) ? rawLimit : 50;
  const page = Math.max(1, Number(sp.page) || 1);

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String((page - 1) * limit),
  });
  if (action) params.set("action", action);
  if (severity) params.set("severity", severity);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const res = await apiGet<Payload>(`/admin/audit?${params}`);
  if (!res.ok) return <Failure result={res} what="the audit trail" />;

  const data = res.data ?? {};
  const events = data.events ?? [];
  const total = data.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  const href = (p: number) =>
    `/admin/audit?${new URLSearchParams({
      ...(action ? { action } : {}),
      ...(severity ? { severity } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit: String(limit),
      page: String(p),
    })}`;

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Audit volume" className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Matching entries"
          value={total}
          hint={`Page ${page} of ${pages}`}
        />
        <Stat
          label="On this page"
          value={events.length}
          hint="Newest first"
        />
        <Stat
          label="Window"
          value={
            from || to
              ? `${from || "beginning"} → ${to || "now"}`
              : "Everything"
          }
          hint={
            from || to
              ? "Filtered by the API, not by this page"
              : "No date filter applied"
          }
        />
      </section>

      <Card title="Filter" description="A substring of the action, or an exact severity.">
        <form action="/admin/audit" method="get" className="flex flex-wrap gap-2">
          <label htmlFor="action" className="sr-only">
            Action contains
          </label>
          <input
            id="action"
            name="action"
            defaultValue={action}
            placeholder="Action contains… e.g. block"
            className="w-full max-w-[16rem] rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
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
          <label htmlFor="from" className="sr-only">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="to" className="sr-only">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
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

      <Card title="Trail" description={`${total} entries match. Showing ${events.length}.`}>
        <DataTable
          columns={["When", "Action", "What", "Severity", "Actor"]}
          empty="No audit entry matches."
          rows={events.map((e) => ({
            When: <span title={dateTime(e.createdAt)}>{ago(e.createdAt)}</span>,
            Action: (
              <span className="font-mono text-[12px]">{e.action ?? e.kind ?? "—"}</span>
            ),
            What: e.title ?? e.detail ?? describeMetadata(e) ?? "—",
            Severity: e.severity ? (
              <Badge tone={severityTone(e.severity)}>{e.severity}</Badge>
            ) : (
              "—"
            ),
            Actor: e.actorId ? (
              <span className="font-mono text-[11px]">{e.actorId.slice(0, 8)}</span>
            ) : (
              <span className="text-[var(--tb-text-muted)]">system</span>
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

/** An entry with no title still carries its metadata; show its keys rather
 *  than an em dash that reads like missing data. */
function describeMetadata(e: AuditEvent): string | null {
  const m = e.metadata;
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  const keys = Object.keys(m as Record<string, unknown>);
  return keys.length ? keys.slice(0, 4).join(", ") : null;
}

function severityTone(s: string) {
  return s === "critical" || s === "error"
    ? ("danger" as const)
    : s === "warning"
      ? ("warn" as const)
      : ("muted" as const);
}