import Link from "next/link";
import { CircleDot } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readQueue, type ThreadStatus } from "@/lib/support";
import { ago, dateTime } from "@/lib/format";

/* The queue, from the ledger.
 *
 * A ticket here is a message somebody sent us, and its reference code is the
 * only handle either side of the conversation has. Everything the old screen
 * showed as a ticket field — priority, category, owner, SLA — was made up:
 * none of it exists behind a support row, so none of it appears here either.
 * What replaces them is what the ledger actually knows: who wrote, when, from
 * where, and whether anybody has answered. */

type Params = Record<string, string | string[] | undefined>;

const STATUSES: ThreadStatus[] = ["open", "answered"];

const STATUS_TONE: Record<ThreadStatus, "success" | "warn"> = {
  open: "warn",
  answered: "success",
};

const WORDS: Record<ThreadStatus, string> = {
  open: "waiting on us",
  answered: "answered",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const status = (one("status") ?? "") as "" | ThreadStatus;
  const q = one("q") ?? "";

  const load = await readQueue({ status, q });
  const queue = load.status === "ready" ? load.data : null;

  const field =
    "h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Every message an account has sent the team, threaded by the reference code both sides quote. Sorted by last activity, because the one a person is watching is the one that moved."
        actions={
          <Link href="/admin/activity" className="btn btn-quiet btn-sm">
            Whole ledger
          </Link>
        }
      />

      <Panel>
        <form action="/admin/tickets" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Search tickets</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Subject, message, account or reference code"
            className={`${field} min-w-[14rem] flex-1`}
          />
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status} className={field}>
            <option value="">Anything</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {WORDS[s]}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {q || status ? (
            <a href="/admin/tickets" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState
        load={load}
        rows={6}
        empty={
          status || q
            ? "No request matches this view. Clear the filters — a helpdesk that looks empty is often just filtered."
            : "Nobody has written in. A request filed from any account lands here the moment it is sent."
        }
      />

      {queue ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="In this view" value={queue.threads.length} hint={`of ${queue.total} matched`} />
            <Metric
              label="Waiting on us"
              value={queue.open}
              hint="no answer recorded yet"
              tone={queue.open > 0 ? "warn" : "success"}
            />
            <Metric label="Answered" value={queue.answered} hint="replied from the panel" />
            <Metric label="Rows searched" value={queue.window} hint="the queue reads the newest ledger rows" />
          </div>

          <Panel
            flush
            title="The queue"
            hint="One row per conversation: an answer written from the panel folds into its question rather than opening a second one."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "subject", label: "Subject" },
                  { key: "account", label: "From", hideBelow: "md" },
                  { key: "origin", label: "Reached from", hideBelow: "lg", nowrap: true },
                  { key: "status", label: "Status" },
                  { key: "ref", label: "Reference", hideBelow: "md" },
                  { key: "replies", label: "Replies", hideBelow: "lg", align: "right" },
                  { key: "updated", label: "Last activity", align: "right", hideBelow: "sm", nowrap: true },
                ]}
                rows={queue.threads.map((t) => ({
                  subject: (
                    <span className="flex min-w-0 items-start gap-2">
                      {t.status === "open" ? (
                        <CircleDot
                          size={13}
                          aria-hidden
                          className="mt-1 shrink-0 text-[var(--accent-text)]"
                        />
                      ) : null}
                      <span className="flex min-w-0 flex-col">
                        <Link
                          href={`/admin/tickets/${t.ref}`}
                          className="truncate font-medium text-[var(--fg)] hover:text-[var(--accent-text)]"
                        >
                          {t.subject}
                        </Link>
                        <span className="truncate text-[11px] text-[var(--muted)]" title={t.message}>
                          {t.message.length > 90 ? `${t.message.slice(0, 90)}…` : t.message}
                        </span>
                      </span>
                    </span>
                  ),
                  account: t.account ? (
                    <Link
                      href={`/admin/people/${t.account.id}`}
                      className="text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {t.account.username ?? t.account.email}
                    </Link>
                  ) : (
                    <span className="text-[12px] text-[var(--muted)]">deleted account</span>
                  ),
                  origin: (
                    <span className="text-[12px] text-[var(--muted)]" title={dateTime(t.askedAt)}>
                      {[t.device, t.location].filter(Boolean).join(" · ") || "not recorded"}
                    </span>
                  ),
                  status: <Pill tone={STATUS_TONE[t.status]}>{WORDS[t.status]}</Pill>,
                  ref: (
                    <span className="font-mono text-[12px] tabular-nums text-[var(--text-2)]">
                      {t.ref}
                    </span>
                  ),
                  replies: <span className="tabular-nums text-[12px]">{t.replies}</span>,
                  updated: (
                    <span title={dateTime(t.lastAt)} className="text-[12px] tabular-nums">
                      {ago(t.lastAt)}
                    </span>
                  ),
                }))}
                empty="No request matches this view."
              />
            </div>
          </Panel>
        </>
      ) : null}
    </>
  );
}
