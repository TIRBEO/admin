import { apiGet, num } from "@/lib/api";
import { getDash } from "@/lib/dash";
import { Card, Stat, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

/* Email is three reads that happen to belong together:
     GET /api/admin/email/config    — the sender identity and provider
     GET /api/admin/email/templates — the template catalogue
     GET /api/admin/emails          — the send log, with open tracking
   The API key in the config is never rendered: it is a credential, and a
   panel that prints one into a page is how it ends up in a screenshot. */

type Config = {
  provider?: string;
  fromEmail?: string;
  fromName?: string;
  enabled?: boolean;
  apiKey?: string | null;
  updatedAt?: string;
};

type Template = {
  id?: string;
  slug?: string;
  label?: string;
  subject?: string;
  html?: string;
  variables?: string[];
  updatedAt?: string;
};

type SentEmail = {
  id?: string;
  toEmail?: string;
  fromEmail?: string | null;
  subject?: string | null;
  eventKey?: string | null;
  status?: string | null;
  category?: string | null;
  provider?: string | null;
  openedAt?: string | null;
  error?: string | null;
  createdAt?: string;
};

type SentPayload = { emails?: SentEmail[]; total?: number; page?: number; limit?: number };

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const to = (sp.to ?? "").trim();
  const status = (sp.status ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const [configRes, templatesRes, sentRes, dashRes] = await Promise.all([
    apiGet<Config>("/admin/email/config"),
    apiGet<Template[]>("/admin/email/templates"),
    apiGet<SentPayload>(
      `/admin/emails?limit=50&page=${page}${
        to ? `&to=${encodeURIComponent(to)}` : ""
      }${status ? `&status=${encodeURIComponent(status)}` : ""}`,
    ),
    getDash(7),
  ]);

  if (!sentRes.ok) return <Failure result={sentRes} what="the email send log" />;

  const config = configRes.data;
  const templates = Array.isArray(templatesRes.data) ? templatesRes.data : [];
  const sent = sentRes.data?.emails ?? [];
  const total = sentRes.data?.total ?? sent.length;
  const dash = dashRes.data;
  const emails = dash?.emails;
  const hasKey = Boolean(config?.apiKey);

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Email at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Sent today" value={num(emails?.today) ?? 0} hint={`${num(emails?.lastHour) ?? 0} in the last hour`} />
        <Stat
          label="Failures"
          value={num(emails?.failures) ?? 0}
          hint="Deliveries the provider refused"
        />
        <Stat
          label="Open rate"
          value={`${num(emails?.openRate) ?? 0}%`}
          hint={`${num(emails?.opened) ?? 0} opens recorded`}
        />
        <Stat
          label="Templates"
          value={templatesRes.ok ? templates.length : "—"}
          hint={templatesRes.ok ? "In the catalogue" : "Could not be read"}
        />
      </section>

      <Card
        title="Sender identity"
        description="What the platform sends as, and through which provider."
      >
        {!configRes.ok ? (
          <State title={configRes.status === 403 ? "Restricted to admins." : "The sender config could not be read."} />
        ) : (
          <dl className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
            <Row label="Provider" value={config?.provider ?? "—"} />
            <Row label="Enabled" value={config?.enabled ? "yes" : "no"} />
            <Row label="From name" value={config?.fromName ?? "—"} />
            <Row label="From address" value={config?.fromEmail ?? "—"} />
            <Row label="API key" value={hasKey ? "set (not shown)" : "not set"} />
            <Row label="Updated" value={config?.updatedAt ? ago(config.updatedAt) : "—"} />
          </dl>
        )}
      </Card>

      <Card
        title="Send log"
        description={`${total} message${total === 1 ? "" : "s"} matched. Showing ${sent.length}.`}
      >
        <form action="/admin/email" method="get" className="mb-4 flex flex-wrap gap-2">
          <label htmlFor="to" className="sr-only">
            Recipient
          </label>
          <input
            id="to"
            name="to"
            defaultValue={to}
            placeholder="Recipient contains…"
            className="w-full max-w-xs rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          >
            <option value="">Any status</option>
            {["sent", "delivered", "failed", "queued", "pending"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Filter
          </button>
        </form>

        <DataTable
          columns={["Sent", "To", "Subject", "Template", "Status", "Opened"]}
          empty={to || status ? "No message matches." : "No email has been sent."}
          rows={sent.map((e) => ({
            Sent: <span title={dateTime(e.createdAt)}>{ago(e.createdAt)}</span>,
            To: <span className="font-mono text-[12px]">{e.toEmail ?? "—"}</span>,
            Subject: e.subject ?? "—",
            Template: e.eventKey ? (
              <span className="font-mono text-[11px]">{e.eventKey}</span>
            ) : (
              "—"
            ),
            Status: e.status ? (
              <Badge tone={statusTone(e.status)}>{e.status}</Badge>
            ) : (
              "—"
            ),
            Opened: e.openedAt ? (
              <span className="text-[var(--tb-ok)]">yes</span>
            ) : (
              "—"
            ),
          }))}
        />

        {total > sent.length ? (
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-[13px]">
            {page > 1 ? (
              <a
                href={`/admin/email?${new URLSearchParams({
                  ...(to ? { to } : {}),
                  ...(status ? { status } : {}),
                  page: String(page - 1),
                })}`}
                className="rounded-lg border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]"
              >
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <span className="text-[var(--tb-text-muted)]">Page {page}</span>
            {page * 50 < total ? (
              <a
                href={`/admin/email?${new URLSearchParams({
                  ...(to ? { to } : {}),
                  ...(status ? { status } : {}),
                  page: String(page + 1),
                })}`}
                className="rounded-lg border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]"
              >
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Card>

      <Card
        title="Templates"
        description="The catalogue the send log refers to by slug."
      >
        {!templatesRes.ok ? (
          <State title="The template catalogue could not be read." />
        ) : (
          <DataTable
            columns={["Slug", "Label", "Subject", "Variables", "Updated"]}
            empty="No template is defined."
            rows={templates.map((t) => ({
              Slug: <span className="font-mono text-[12px]">{t.slug ?? "—"}</span>,
              Label: t.label ?? "—",
              Subject: t.subject ?? "—",
              Variables:
                (t.variables ?? []).length > 0 ? (
                  <span className="font-mono text-[11px]">
                    {(t.variables ?? []).join(", ")}
                  </span>
                ) : (
                  "—"
                ),
              Updated: t.updatedAt ? ago(t.updatedAt) : "—",
            }))}
          />
        )}
      </Card>
    </div>
  );
}

function statusTone(s: string) {
  return s === "failed" || s === "bounced"
    ? ("danger" as const)
    : s === "delivered" || s === "sent"
      ? ("ok" as const)
      : ("muted" as const);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[var(--tb-text-muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}