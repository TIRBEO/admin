import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { abuseMailbox, listInbox } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

const KINDS = ["message", "bounce", "autoreply", "spam"];

const KIND_TONE: Record<string, "success" | "warn" | "danger" | "muted" | "accent"> = {
  message: "accent",
  bounce: "warn",
  autoreply: "muted",
  spam: "danger",
};

export default async function EmailInboxPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const raw = params.kind;
  const kind = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const [rows, abuse] = await Promise.all([listInbox({ kind }), abuseMailbox()]);
  const load = present(state, rows);

  const unread = rows.filter((r) => r.status === "new");
  const replied = rows.filter((r) => r.kind === "message");

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Everything that came back. A reply is only useful if the bounce next to it is read too."
        state={state}
        params={params}
        actions={
          <Link href="/admin/email/config" className="btn btn-secondary btn-sm">
            Sending config
          </Link>
        }
      />

      <Panel>
        <form action="/admin/email/inbox" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Kind</span>
          <select
            name="kind"
            defaultValue={kind}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Everything inbound</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {kind ? (
            <a href="/admin/email/inbox" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={5} empty="Nothing arrived — inbound routing may not be pointed at us at all." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Messages" value={rows.length} hint="in this view" />
            <Metric
              label="Unread"
              value={unread.length}
              hint="nobody has opened them"
              tone={unread.length > 0 ? "warn" : "success"}
            />
            <Metric label="Replies" value={replied.length} hint="a person answering" />
            <Metric
              label="Bounces"
              value={rows.filter((r) => r.kind === "bounce").length}
              hint="addresses that will never read us"
              tone={rows.some((r) => r.kind === "bounce") ? "danger" : "default"}
            />
          </div>

          <Panel flush title="Inbound" hint={`Abuse and legal mail is routed to ${abuse} and answered by a person.`}>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "from", label: "From" },
                  { key: "subject", label: "Subject" },
                  { key: "kind", label: "Kind", hideBelow: "sm" },
                  { key: "status", label: "State" },
                  { key: "link", label: "Ticket", hideBelow: "lg" },
                  { key: "when", label: "Received", align: "right", hideBelow: "md" },
                ]}
                rows={rows.map((m) => ({
                  from: (
                    <span className="flex min-w-0 flex-col">
                      <code className="truncate text-[12px] text-[var(--fg)]">{m.from}</code>
                      <span className="text-[11px] text-[var(--muted)]">to {m.to}</span>
                    </span>
                  ),
                  subject: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[var(--text-2)]">{m.subject}</span>
                      <span className="truncate text-[11px] text-[var(--muted)]">{m.excerpt}</span>
                    </span>
                  ),
                  kind: <Pill tone={KIND_TONE[m.kind] ?? "muted"}>{m.kind}</Pill>,
                  status: m.status === "new" ? <Pill tone="warn">unread</Pill> : <Pill tone="muted">{m.status}</Pill>,
                  link: m.ticketId ? (
                    <Link
                      href={`/admin/tickets/${m.ticketId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {m.ticketId}
                    </Link>
                  ) : m.userId ? (
                    <Link
                      href={`/admin/people/${m.userId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {m.userId}
                    </Link>
                  ) : (
                    <span className="text-[12px] text-[var(--muted)]">unlinked</span>
                  ),
                  when: <span title={dateTime(m.receivedAt)}>{ago(m.receivedAt, NOW_ISO)}</span>,
                }))}
                empty="Nothing of that kind arrived."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
