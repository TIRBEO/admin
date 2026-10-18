import { apiGet, num } from "@/lib/api";
import { getDash } from "@/lib/dash";
import { Card, Stat, DataTable, Badge, State } from "@/components/primitives";
import { CopyId } from "@/components/copy-id";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

type Config = {
  provider?: string;
  fromEmail?: string;
  fromName?: string;
  enabled?: boolean;
  apiKey?: string | null;
  updatedAt?: string;
};

type Template = {
  slug?: string;
  label?: string;
  subject?: string;
  variables?: string[];
  updatedAt?: string;
};

type SentEmail = {
  id?: string;
  toEmail?: string;
  subject?: string | null;
  eventKey?: string | null;
  eventId?: string | null;
  status?: string | null;
  openedAt?: string | null;
  createdAt?: string;
};

type SentPayload = { emails?: SentEmail[]; total?: number };

type Inbox = {
  items?: Array<{
    id?: string;
    type?: string;
    title?: string;
    body?: string | null;
    isRead?: boolean;
    createdAt?: string;
  }>;
  total?: number;
};

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; status?: string; eventKey?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const to = (sp.to ?? "").trim();
  const status = (sp.status ?? "").trim();
  const eventKey = (sp.eventKey ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const [configRes, templatesRes, sentRes, dashRes, inboxRes, prefsRes, reachRes] =
    await Promise.all([
      apiGet<Config>("/admin/email/config"),
      apiGet<Template[]>("/admin/email/templates"),
      apiGet<SentPayload>(
        `/admin/emails?limit=50&page=${page}${
          to ? `&to=${encodeURIComponent(to)}` : ""
        }${status ? `&status=${encodeURIComponent(status)}` : ""}${
          eventKey ? `&eventKey=${encodeURIComponent(eventKey)}` : ""
        }`,
      ),
      getDash(7),
      apiGet<Inbox>("/admin/notifications?limit=25"),
      apiGet<Record<string, boolean | number | string>>("/admin/notifications/prefs"),
      apiGet<{ recipients?: number }>("/admin/notifications/broadcast"),
    ]);

  if (!sentRes.ok) return <Failure result={sentRes} what="the email send log" />;

  const config = configRes.data;
  const templates = Array.isArray(templatesRes.data) ? templatesRes.data : [];
  const sent = sentRes.data?.emails ?? [];
  const total = sentRes.data?.total ?? sent.length;
  const dash = dashRes.data;
  const emails = dash?.emails;
  const hasKey = Boolean(config?.apiKey);
  const items = inboxRes.ok ? (inboxRes.data?.items ?? []) : [];
  const unread = items.filter((n) => n.isRead === false).length;
  const byType = dash?.notifications?.byType ?? [];
  const prefs = prefsRes.data ?? {};

  const emailHref = (p: number) =>
    `/admin/messaging${new URLSearchParams({
      ...(to ? { to } : {}),
      ...(status ? { status } : {}),
      ...(eventKey ? { eventKey } : {}),
      page: String(p),
    })}`;

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Messaging at a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Sent today"
          value={num(emails?.today) ?? 0}
          hint={`${num(emails?.lastHour) ?? 0} in the last hour`}
        />
        <Stat
          label="Failures"
          value={num(emails?.failures) ?? 0}
          hint="Deliveries the provider refused"
          tone={(num(emails?.failures) ?? 0) > 0 ? "danger" : "default"}
        />
        <Stat
          label="Open rate"
          value={`${num(emails?.openRate) ?? 0}%`}
          hint={`${num(emails?.opened) ?? 0} opens · ${num(emails?.clicked) ?? 0} clicks`}
        />
        <Stat
          label="Broadcast reach"
          value={reachRes.ok ? (reachRes.data?.recipients ?? 0) : "—"}
          hint={`${num(dash?.push?.total) ?? 0} push channels subscribed`}
        />
      </section>

      <Card
        title="Send log"
        description={`${total} message${total === 1 ? "" : "s"} matched. Showing ${sent.length}. The event field is the reference id of whatever caused the mail.`}
        action={
          <form action="/admin/messaging" method="get" className="flex flex-wrap gap-2">
            <label htmlFor="eventKey" className="sr-only">
              Event ID
            </label>
            <input
              id="eventKey"
              name="eventKey"
              defaultValue={eventKey}
              placeholder="Event ID — exact"
              className="w-48 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 font-mono text-[13px] outline-none placeholder:font-sans placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <label htmlFor="to" className="sr-only">
              Recipient
            </label>
            <input
              id="to"
              name="to"
              defaultValue={to}
              placeholder="Recipient contains…"
              className="w-44 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <label htmlFor="status" className="sr-only">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none focus:border-[var(--tb-accent)]"
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
              className="rounded-[10px] bg-[var(--tb-accent)] px-3 py-1.5 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
            >
              Filter
            </button>
          </form>
        }
      >
        <DataTable
          columns={["Sent", "To", "Subject", "Template", "Event", "Status", "Opened"]}
          empty={to || status || eventKey ? "No message matches." : "No email has been sent."}
          rows={sent.map((e) => ({
            Sent: <span title={dateTime(e.createdAt)}>{ago(e.createdAt)}</span>,
            To: <span className="font-mono text-[12px]">{e.toEmail ?? "—"}</span>,
            Subject: e.subject ?? "—",
            Template: e.eventKey ? <span className="font-mono text-[11px]">{e.eventKey}</span> : "—",
            Event: e.eventId ? (
              <CopyId value={e.eventId} />
            ) : (
              <span className="text-[var(--tb-text-muted)]">—</span>
            ),
            Status: e.status ? <Badge tone={statusTone(e.status)}>{e.status}</Badge> : "—",
            Opened: e.openedAt ? <span className="text-[var(--tb-ok)]">yes</span> : "—",
          }))}
        />

        {total > sent.length ? (
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-[13px]">
            {page > 1 ? (
              <a href={emailHref(page - 1)} className="rounded-[10px] border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]">
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <span className="text-[var(--tb-text-muted)]">Page {page}</span>
            {page * 50 < total ? (
              <a href={emailHref(page + 1)} className="rounded-[10px] border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]">
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Sender identity" description="What the platform sends as. The API key is never rendered.">
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

        <Card title="Templates" description="The catalogue the send log refers to by slug.">
          {!templatesRes.ok ? (
            <State title="The template catalogue could not be read." />
          ) : (
            <DataTable
              columns={["Slug", "Label", "Subject", "Updated"]}
              empty="No template is defined."
              rows={templates.map((t) => ({
                Slug: <span className="font-mono text-[12px]">{t.slug ?? "—"}</span>,
                Label: t.label ?? "—",
                Subject: t.subject ?? "—",
                Updated: t.updatedAt ? ago(t.updatedAt) : "—",
              }))}
            />
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="What people receive" description="Notifications by type, platform-wide.">
          <DataTable
            columns={["Type", "Count"]}
            empty="No notification has been created."
            rows={byType.map((t) => ({
              Type: <Badge tone="accent">{t.type}</Badge>,
              Count: t.count,
            }))}
          />
        </Card>

        <Card title="Your preferences" description="What reaches you as an operator — shown, not edited.">
          {!prefsRes.ok ? (
            <State title="Your preferences could not be read." />
          ) : (
            <DataTable
              columns={["Channel", "On"]}
              empty="No preference is set."
              rows={Object.entries(prefs).map(([k, v]) => ({
                Channel: <span className="font-mono text-[12px]">{k}</span>,
                On:
                  v === true ? (
                    <Badge tone="ok">on</Badge>
                  ) : v === false ? (
                    <Badge tone="muted">off</Badge>
                  ) : (
                    String(v)
                  ),
              }))}
            />
          )}
        </Card>
      </div>

      <Card title="Your inbox" description={`${inboxRes.data?.total ?? items.length} notifications addressed to you. ${unread} unread.`}>
        <DataTable
          columns={["When", "Type", "Title", "Read"]}
          empty="Your inbox is empty."
          rows={items.map((n) => ({
            When: ago(n.createdAt),
            Type: <Badge tone="accent">{n.type ?? "—"}</Badge>,
            Title: (
              <span>
                <span className="font-medium">{n.title ?? "—"}</span>
                {n.body ? (
                  <span className="block text-[12px] text-[var(--tb-text-muted)]">{n.body}</span>
                ) : null}
              </span>
            ),
            Read: n.isRead ? (
              <span className="text-[var(--tb-text-muted)]">read</span>
            ) : (
              <Badge tone="warn">unread</Badge>
            ),
          }))}
        />
      </Card>

      <p className="text-[12px] text-[var(--tb-text-muted)]">
        There is no broadcast history: a broadcast writes one notification per recipient and one email per opted-in address, then logs a single line to the API&apos;s stdout. The reach figure above is what a broadcast would reach now — the messages themselves are visible in each recipient&apos;s inbox, not in a platform-wide list.
      </p>
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
