import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";

import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { getTicket, ticketIsOverdue } from "@/lib/mock";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";
import { ago, bytes, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { TicketPriority, TicketStatus } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const STATUS_TONE: Record<TicketStatus, "success" | "warn" | "danger" | "muted" | "accent"> = {
  open: "warn",
  pending: "accent",
  resolved: "success",
  closed: "muted",
};

const PRIORITY_TONE: Record<TicketPriority, "muted" | "accent" | "warn" | "danger"> = {
  low: "muted",
  normal: "accent",
  high: "warn",
  urgent: "danger",
};

export default async function TicketThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Params>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const state = readState(query);
  const thread = await getTicket(id);

  if (!thread) notFound();

  const load = present(state, thread);
  const { ticket, requester, assignee, messages, attachments } = thread;
  const overdue = await ticketIsOverdue(ticket.id);

  return (
    <>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.id} · ${ticket.category} · opened ${ago(ticket.createdAt, NOW_ISO)}`}
        unwired
        state={state}
        params={query}
        actions={
          <>
            <Link href="/admin/tickets" className="btn btn-quiet btn-sm">
              <ArrowLeft size={13} aria-hidden />
              Queue
            </Link>
            <button type="button" className="btn btn-secondary btn-sm" disabled title={MOCK_ERROR}>
              Assign to me
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled title={MOCK_ERROR}>
              Send reply
            </button>
          </>
        }
      />

      <PageState load={load} rows={6} />

      {load.status !== "ready" ? null : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-4">
            <Panel title="Conversation" hint={`${messages.length} messages · newest at the bottom`}>
              <ol className="flex flex-col gap-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`flex flex-col gap-1 rounded-[14px] px-3.5 py-2.5 ${
                      m.fromAdmin
                        ? "ml-auto max-w-[92%] bg-[var(--accent-soft)]"
                        : "mr-auto max-w-[92%] bg-[var(--surface-2)]"
                    }`}
                  >
                    <span className="flex items-baseline gap-2 text-[11px] text-[var(--muted)]">
                      <span className="font-semibold uppercase tracking-[0.04em]">
                        {m.fromAdmin ? "Console" : requester?.username ?? "Person"}
                      </span>
                      <time className="tabular-nums" dateTime={m.createdAt}>
                        {ago(m.createdAt, NOW_ISO)}
                      </time>
                    </span>
                    <p className="text-[13px] leading-relaxed text-[var(--fg)]">{m.body}</p>
                  </li>
                ))}
                {messages.length === 0 ? (
                  <li className="text-[13px] text-[var(--muted)]">
                    Nothing has been said yet — the subject line is all there is.
                  </li>
                ) : null}
              </ol>
            </Panel>

            <Panel title="Reply" hint="A reply is written by an endpoint that does not exist yet, so the box cannot be filled.">
              <form className="flex flex-col gap-3">
                <label className="sr-only" htmlFor="reply">
                  Reply to {requester?.email ?? "the person"}
                </label>
                <textarea
                  id="reply"
                  name="body"
                  rows={4}
                  disabled
                  placeholder="Write what happens next…"
                  className="w-full resize-y rounded-[12px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" className="btn btn-primary" disabled title={MOCK_ERROR}>
                    Send and mark resolved
                  </button>
                  <button type="button" className="btn btn-secondary" disabled title={MOCK_ERROR}>
                    Send only
                  </button>
                  <span className="text-[12px] text-[var(--muted)]">
                    {requester ? `Replies go to ${requester.email}.` : "No address on file."}
                  </span>
                </div>
              </form>
            </Panel>
          </div>

          <div className="flex flex-col gap-4">
            <Panel title="This ticket">
              <dl className="-my-1">
                <Field label="Status">
                  <Pill tone={STATUS_TONE[ticket.status]}>{ticket.status}</Pill>
                </Field>
                <Field label="Priority">
                  <Pill tone={PRIORITY_TONE[ticket.priority]}>{ticket.priority}</Pill>
                </Field>
                <Field label="Category">{ticket.category}</Field>
                <Field label="Due">
                  <span title={dateTime(ticket.dueAt)} className={overdue ? "text-[var(--danger-text)]" : undefined}>
                    {overdue ? `past due · ${ago(ticket.dueAt, NOW_ISO)}` : ago(ticket.dueAt, NOW_ISO)}
                  </span>
                </Field>
                <Field label="First response">
                  {ticket.firstResponseAt ? ago(ticket.firstResponseAt, NOW_ISO) : <span className="text-[var(--warn-text)]">not yet</span>}
                </Field>
                <Field label="Last activity">{ago(ticket.updatedAt, NOW_ISO)}</Field>
                <Field label="Unread here">{ticket.unreadForAdmin ? "yes" : "no"}</Field>
              </dl>
            </Panel>

            <Panel title="Who is involved">
              <dl className="-my-1">
                <Field label="Requester">
                  {requester ? (
                    <Link
                      href={`/admin/people/${requester.id}`}
                      className="text-[var(--accent-text)] hover:underline"
                    >
                      {requester.username ?? requester.email}
                    </Link>
                  ) : (
                    <span className="text-[var(--muted)]">deleted account</span>
                  )}
                </Field>
                <Field label="Their status">{requester?.status.replaceAll("_", " ") ?? "—"}</Field>
                <Field label="Owner">
                  {assignee ? (
                    <Link
                      href={`/admin/people/${assignee.id}`}
                      className="text-[var(--accent-text)] hover:underline"
                    >
                      {assignee.username ?? assignee.email}
                    </Link>
                  ) : (
                    <span className="text-[var(--warn-text)]">unassigned</span>
                  )}
                </Field>
              </dl>
            </Panel>

            <Panel
              title="Attachments"
              hint="Files are stored elsewhere; a console row is a name, a size and a mime type."
            >
              {attachments.length === 0 ? (
                <p className="text-[13px] text-[var(--muted)]">Nothing was attached.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-2.5">
                      <Paperclip size={13} aria-hidden className="shrink-0 text-[var(--muted)]" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-2)]">
                        {a.name}
                      </span>
                      <span className="shrink-0 text-[12px] tabular-nums text-[var(--muted)]">
                        {bytes(a.bytes)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
