import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card, Stat, DataTable, Badge } from "@/components/primitives";
import { CopyId } from "@/components/copy-id";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

type AuditEvent = {
  id?: string;
  ref?: string | null;
  action?: string;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  actorId?: string | null;
  metadata?: unknown;
  createdAt?: string;
};

type AuditPayload = { events?: AuditEvent[]; total?: number };

type Actor = { id?: string; email?: string; name?: string | null };
type ActivityLog = {
  id?: string;
  ref?: string | null;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  ipAddress?: string | null;
  createdAt?: string;
  actor?: Actor | null;
  account?: Actor | null;
  user?: Actor | null;
};

type ActivityPayload = { logs?: ActivityLog[]; onlineUsers?: Actor[] };

const SEVERITIES = ["", "info", "warning", "error", "critical"];
const AUDIT_SIZES = [50, 100, 200];
const ACTIVITY_SIZES = [25, 50, 100, 200];

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    action?: string;
    severity?: string;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
    alog?: string;
  }>;
}) {
  const sp = await searchParams;
  const eventId = (sp.id ?? "").trim();
  const action = (sp.action ?? "").trim();
  const severity = SEVERITIES.includes(sp.severity ?? "") ? (sp.severity as string) : "";
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();
  const rawLimit = Number(sp.limit);
  const limit = AUDIT_SIZES.includes(rawLimit) ? rawLimit : 50;
  const page = Math.max(1, Number(sp.page) || 1);
  const rawALog = Number(sp.alog);
  const activityLimit = ACTIVITY_SIZES.includes(rawALog) ? rawALog : 50;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String((page - 1) * limit),
  });
  if (eventId) params.set("id", eventId);
  if (action) params.set("action", action);
  if (severity) params.set("severity", severity);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const [auditRes, activityRes] = await Promise.all([
    apiGet<AuditPayload>(`/admin/audit?${params}`),
    apiGet<ActivityPayload>(`/admin/activity?limit=${activityLimit}`),
  ]);

  if (!auditRes.ok) return <Failure result={auditRes} what="the audit trail" />;

  const data = auditRes.data ?? {};
  const events = data.events ?? [];
  const total = data.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  const activity = activityRes.data ?? {};
  const logs = activity.logs ?? [];
  const online = activity.onlineUsers ?? [];

  const href = (p: number) =>
    `/admin/audit${new URLSearchParams({
      ...(eventId ? { id: eventId } : {}),
      ...(action ? { action } : {}),
      ...(severity ? { severity } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit: String(limit),
      page: String(p),
      ...(activityLimit !== 50 ? { alog: String(activityLimit) } : {}),
    })}`;

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Audit volume" className="grid gap-4 sm:grid-cols-3">
        <Stat label="Matching entries" value={total} hint={`Page ${page} of ${pages}`} />
        <Stat
          label="Window"
          value={from || to ? `${from || "beginning"} → ${to || "now"}` : "Everything"}
          hint={from || to ? "Filtered by the API, not by this page" : "No date filter applied"}
        />
        <Stat
          label="Online now"
          value={online.length}
          hint="Active in the last five minutes, deduplicated by account"
        />
      </section>

      <Card
        title="Audit trail"
        description={`${total} entries match. Showing ${events.length}. An exact event id, a reference code (xxxx-xxxx-xxxx), a substring of the action, or an exact severity.`}
        action={
          <form action="/admin/audit" method="get" className="flex flex-wrap gap-2">
            <label htmlFor="id" className="sr-only">
              Event ID
            </label>
            <input
              id="id"
              name="id"
              defaultValue={eventId}
              placeholder="Event ID or ref — xxxx-xxxx-xxxx"
              className="w-48 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 font-mono text-[13px] outline-none placeholder:font-sans placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <label htmlFor="action" className="sr-only">
              Action contains
            </label>
            <input
              id="action"
              name="action"
              defaultValue={action}
              placeholder="Action contains… e.g. block"
              className="w-44 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <label htmlFor="severity" className="sr-only">
              Severity
            </label>
            <select
              id="severity"
              name="severity"
              defaultValue={severity}
              className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none focus:border-[var(--tb-accent)]"
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
              className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none focus:border-[var(--tb-accent)]"
            />
            <label htmlFor="to" className="sr-only">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none focus:border-[var(--tb-accent)]"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              Apply
            </button>
          </form>
        }
      >
        <DataTable
          columns={["Event ID", "When", "Action", "What", "Severity", "Actor"]}
          empty={eventId || action ? "No audit entry matches." : "No audit entry exists."}
          rows={events.map((e) => ({
            "Event ID": <CopyId value={e.ref ?? e.id} />,
            When: <span title={dateTime(e.createdAt)}>{ago(e.createdAt)}</span>,
            Action: <span className="font-mono text-[12px]">{e.action ?? e.kind ?? "—"}</span>,
            What: e.title ?? e.detail ?? describeMetadata(e) ?? "—",
            Severity: e.severity ? <Badge tone={severityTone(e.severity)}>{e.severity}</Badge> : "—",
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
              <a href={href(page - 1)} className="btn btn-secondary btn-sm">
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <span className="text-[var(--tb-text-muted)]">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <a href={href(page + 1)} className="btn btn-secondary btn-sm">
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Card>

      <Card
        title="Activity feed"
        description={`${logs.length} most recent events, newest first. Online users are derived from sessions used in the last five minutes.`}
        action={
          <nav aria-label="How many events" className="flex gap-1">
            {ACTIVITY_SIZES.map((n) => (
              <a
                key={n}
                href={`/admin/audit?${new URLSearchParams({
                  ...(eventId ? { id: eventId } : {}),
                  ...(action ? { action } : {}),
                  ...(severity ? { severity } : {}),
                  ...(from ? { from } : {}),
                  ...(to ? { to } : {}),
                  limit: String(limit),
                  alog: String(n),
                })}`}
                aria-current={n === activityLimit ? "page" : undefined}
                className={`rounded-[8px] border px-2.5 py-1 text-[12px] ${
                  n === activityLimit
                    ? "border-[var(--tb-accent)] text-[var(--tb-accent-text)]"
                    : "border-[var(--tb-border)] text-[var(--tb-text-muted)] hover:bg-[var(--tb-surface-2)]"
                }`}
              >
                {n}
              </a>
            ))}
          </nav>
        }
      >
        <DataTable
          columns={["Event ID", "When", "What", "Who", "Severity", "IP"]}
          empty={activityRes.ok ? "No activity has been recorded." : "The activity feed could not be read."}
          rows={logs.map((l) => {
            const actor = l.actor ?? l.account ?? l.user ?? null;
            return {
              "Event ID": <CopyId value={l.ref ?? l.id} />,
              When: <span title={dateTime(l.createdAt)}>{ago(l.createdAt)}</span>,
              What: (
                <span>
                  <span className="font-medium">{l.title ?? l.kind ?? "—"}</span>
                  {l.detail ? (
                    <span className="block text-[12px] text-[var(--tb-text-muted)]">{l.detail}</span>
                  ) : null}
                </span>
              ),
              Who: actor?.email ? (
                <Link
                  href={`/admin/people?q=${encodeURIComponent(actor.email)}`}
                  className="font-mono text-[12px] text-[var(--tb-accent-text)] underline-offset-4 hover:underline"
                >
                  {actor.email}
                </Link>
              ) : actor?.id ? (
                <span className="font-mono text-[11px]">{actor.id.slice(0, 8)}</span>
              ) : (
                <span className="text-[var(--tb-text-muted)]">anonymous</span>
              ),
              Severity: l.severity ? <Badge tone={severityTone(l.severity)}>{l.severity}</Badge> : "—",
              IP: l.ipAddress ?? "—",
            };
          })}
        />
      </Card>

      <Card title="Online now" description="Accounts active in the last five minutes.">
        <DataTable
          columns={["Account", "Name"]}
          empty="Nobody has been active in the last five minutes."
          rows={online.map((u) => ({
            Account: <span className="font-mono text-[12px]">{u.email ?? u.id ?? "—"}</span>,
            Name: u.name ?? "—",
          }))}
        />
      </Card>
    </div>
  );
}

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
