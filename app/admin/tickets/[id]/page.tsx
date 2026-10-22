import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MailOpen, MailWarning } from "lucide-react";

import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { ReplyForm } from "@/components/reply-form";
import { readThread } from "@/lib/support";
import { ago, dateTime } from "@/lib/format";

/* One thread, read from the ledger it lives in.
 *
 * The reference code in the URL is not a database id: it is the code the
 * account was shown and the code every mail in this conversation quotes, which
 * is why a code pasted from an inbox opens the same thread as a link from the
 * queue. Nothing here is invented — the old screen's priority, category,
 * assignee and attachments had no endpoint behind them, and a helpdesk field
 * an operator believes is worse than a helpdesk field that does not exist.
 *
 * The reply box is the point of this page. Answering from here writes the
 * answer into the ledger, mails it, and tells the account, so the same code
 * reads as one conversation wherever either side looks. */

const STATUS_TONE = { open: "warn", answered: "success" } as const;
const STATUS_WORD = { open: "waiting on us", answered: "answered" } as const;

const MAIL_WORD: Record<string, string> = {
  support_request_received: "Confirmation to the account",
  support_request_admin: "Copy to the team",
  support_reply: "The answer, mailed",
};

export default async function TicketThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const code = decodeURIComponent(id ?? "").trim();
  if (!code) notFound();

  const load = await readThread(code);
  /* Nothing in the ledger carries this code. A thread that does not exist is a
     404, not an error plate — the screen would otherwise ask the operator to
     retry a code that will never resolve. */
  if (load.status === "empty") notFound();

  const thread = load.status === "ready" ? load.data : null;
  const account = thread?.account ?? null;
  const replyTo = account?.replyTo ?? null;

  return (
    <>
      <PageHeader
        title={thread?.subject ?? "A message to the team"}
        description={
          thread
            ? `Reference ${thread.ref} · opened ${ago(thread.askedAt)} · ${thread.messages.length} ${
                thread.messages.length === 1 ? "message" : "messages"
              } on record`
            : `Looking up ${code} in the ledger.`
        }
        actions={
          <Link href="/admin/tickets" className="btn btn-quiet btn-sm">
            <ArrowLeft size={13} aria-hidden />
            Queue
          </Link>
        }
      />

      <PageState load={load} rows={6} />

      {thread ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-4">
            <Panel title="The conversation" hint="Oldest first, the way it happened.">
              <ol className="flex flex-col gap-3">
                {thread.messages.map((m) => (
                  <li
                    key={m.id}
                    className={`flex flex-col gap-1 rounded-[14px] px-3.5 py-2.5 ${
                      m.from === "staff"
                        ? "ml-auto max-w-[92%] bg-[var(--accent-soft)]"
                        : "mr-auto max-w-[92%] bg-[var(--surface-2)]"
                    }`}
                  >
                    <span className="flex items-baseline gap-2 text-[11px] text-[var(--muted)]">
                      <span className="font-semibold uppercase tracking-[0.04em]">
                        {m.from === "staff" ? "Answered here" : account?.username ?? "The account"}
                      </span>
                      <span className="font-mono tabular-nums">{m.ref}</span>
                      <time className="tabular-nums" dateTime={m.at} title={dateTime(m.at)}>
                        {ago(m.at)}
                      </time>
                    </span>
                    <p className="text-[13px] leading-relaxed whitespace-pre-line text-[var(--fg)]">
                      {m.text}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel
              title="Answer"
              hint={
                replyTo
                  ? "Sends from the support mailbox, writes the answer beside the question under this reference, and tells the account in its own app."
                  : undefined
              }
            >
              {replyTo ? (
                <ReplyForm
                  code={thread.ref}
                  to={replyTo}
                  subject={thread.subject}
                  receivedAt={thread.askedAt}
                />
              ) : (
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                  {account
                    ? "This account has no address an answer could reach, so there is nothing to reply to. Everything said so far is still on the record above."
                    : "The account that wrote this is gone, so a reply has nowhere to go. The message itself stays in the ledger under its reference."}
                </p>
              )}
            </Panel>
          </div>

          <div className="flex flex-col gap-4">
            <Panel title="This request">
              <dl className="-my-1">
                <Field label="Status">
                  <Pill tone={STATUS_TONE[thread.status]}>{STATUS_WORD[thread.status]}</Pill>
                </Field>
                <Field label="Reference">
                  <span className="font-mono tabular-nums">{thread.ref}</span>
                </Field>
                <Field label="Written">
                  <span title={dateTime(thread.askedAt)}>{ago(thread.askedAt)}</span>
                </Field>
                <Field label="Answered">
                  {thread.answeredAt ? (
                    <span title={dateTime(thread.answeredAt)}>{ago(thread.answeredAt)}</span>
                  ) : (
                    <span className="text-[var(--warn-text)]">not yet</span>
                  )}
                </Field>
                <Field label="Reached us on">
                  {[thread.device, thread.location].filter(Boolean).join(" · ") || (
                    <span className="text-[var(--muted)]">not recorded</span>
                  )}
                </Field>
                <Field label="Network address">
                  <span className="font-mono">{thread.ip ?? "unknown"}</span>
                </Field>
              </dl>
            </Panel>

            <Panel title="Who wrote it">
              <dl className="-my-1">
                <Field label="Account">
                  {account ? (
                    <Link
                      href={`/admin/people/${account.id}`}
                      className="text-[var(--accent-text)] hover:underline"
                    >
                      {account.username ?? account.email}
                    </Link>
                  ) : (
                    <span className="text-[var(--muted)]">deleted account</span>
                  )}
                </Field>
                {account?.name ? <Field label="Called">{account.name}</Field> : null}
                <Field label="Their status">
                  {account ? account.status?.replaceAll("_", " ") ?? "active" : "—"}
                </Field>
                <Field label="Answer reaches">
                  {replyTo ?? <span className="text-[var(--muted)]">nothing</span>}
                </Field>
              </dl>
            </Panel>

            <Panel
              title="Mail on this thread"
              hint="The send log, not a guess: what left the platform, to whom, and whether it was accepted."
            >
              {thread.emails.length === 0 ? (
                <p className="text-[13px] text-[var(--muted)]">
                  No mail was recorded for this account — the request came in through the app and the
                  copies may predate the log.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {thread.emails.map((e, i) => (
                    <li key={`${e.to}-${e.at}-${i}`} className="flex items-start gap-2.5">
                      {e.status === "sent" || e.status === "delivered" || e.openedAt ? (
                        <MailOpen size={14} aria-hidden className="mt-0.5 shrink-0 text-[var(--success-text)]" />
                      ) : (
                        <MailWarning
                          size={14}
                          aria-hidden
                          className="mt-0.5 shrink-0 text-[var(--warn-text)]"
                        />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] text-[var(--fg)]">
                          {MAIL_WORD[e.event] ?? e.event}
                        </span>
                        <span className="truncate text-[12px] text-[var(--muted)]">{e.to}</span>
                      </span>
                      <span
                        className="shrink-0 text-[12px] tabular-nums text-[var(--muted)]"
                        title={dateTime(e.at)}
                      >
                        {ago(e.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      ) : null}
    </>
  );
}
