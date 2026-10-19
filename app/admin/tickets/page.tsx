import Link from "next/link";
import { CircleDot } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listTickets, ticketIsOverdue } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { TicketPriority, TicketStatus } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const STATUSES: TicketStatus[] = ["open", "pending", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

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

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const status = one("status") ?? "";
  const priority = one("priority") ?? "";
  const assignee = (one("assignee") ?? "") as "me" | "unassigned" | "";
  const q = one("q") ?? "";

  const rows = await listTickets({ status, priority, assignee, q });
  const overdue = await Promise.all(rows.map(async (t) => ticketIsOverdue(t.id)));
  const load = present(state, rows);

  const field =
    "h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <>
      <PageHeader
        title="Tickets"
        description="The helpdesk inbox. Sorted by last activity, because the ticket that moved is the one a person is watching."
        unwired
        state={state}
        params={params}
      />

      <Panel>
        <form action="/admin/tickets" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Search tickets</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ticket id, subject or category"
            className={`${field} min-w-[14rem] flex-1`}
          />
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status} className={field}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="sr-only">Priority</span>
          <select name="priority" defaultValue={priority} className={field}>
            <option value="">Any priority</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="sr-only">Owner</span>
          <select name="assignee" defaultValue={assignee} className={field}>
            <option value="">Anyone</option>
            <option value="me">Mine</option>
            <option value="unassigned">Nobody yet</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {q || status || priority || assignee ? (
            <a href="/admin/tickets" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState
        load={load}
        rows={6}
        empty="No ticket matches this view. An empty helpdesk is either a good week or a broken form — check by clearing the filters."
      />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Tickets" value={rows.length} hint="in this view" />
            <Metric
              label="Unassigned"
              value={rows.filter((t) => t.assigneeId === null).length}
              hint="nobody owns these"
              tone={rows.some((t) => t.assigneeId === null) ? "warn" : "success"}
            />
            <Metric
              label="Past SLA"
              value={overdue.filter(Boolean).length}
              hint="due before now"
              tone={overdue.some(Boolean) ? "danger" : "success"}
            />
            <Metric
              label="Unread"
              value={rows.filter((t) => t.unreadForAdmin).length}
              hint="a reply nobody has opened"
            />
          </div>

          <Panel flush title="The queue" hint="The helpdesk endpoint was removed; a real admin-wide list needs one that does not filter by owner.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "subject", label: "Subject" },
                  { key: "requester", label: "From", hideBelow: "lg" },
                  { key: "category", label: "Category", hideBelow: "md" },
                  { key: "priority", label: "Priority" },
                  { key: "status", label: "Status" },
                  { key: "owner", label: "Owner", hideBelow: "sm" },
                  { key: "updated", label: "Updated", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((t, i) => ({
                  subject: (
                    <span className="flex min-w-0 items-start gap-2">
                      {t.unreadForAdmin ? (
                        <CircleDot
                          size={13}
                          aria-hidden
                          className="mt-1 shrink-0 text-[var(--accent-text)]"
                        />
                      ) : null}
                      <span className="flex min-w-0 flex-col">
                        <Link
                          href={`/admin/tickets/${t.id}`}
                          className="truncate font-medium text-[var(--fg)] hover:text-[var(--accent-text)]"
                        >
                          {t.subject}
                        </Link>
                        <span className="text-[11px] text-[var(--muted)]">
                          <code>{t.id}</code>
                          {overdue[i] ? (
                            <span className="ml-1.5 text-[var(--danger-text)]">
                              past due {ago(t.dueAt, NOW_ISO)}
                            </span>
                          ) : (
                            <span className="ml-1.5" title={dateTime(t.dueAt)}>
                              due {dateLabel(t.dueAt)}
                            </span>
                          )}
                        </span>
                      </span>
                    </span>
                  ),
                  requester: (
                    <Link
                      href={`/admin/people/${t.requesterId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {t.requesterId}
                    </Link>
                  ),
                  category: t.category,
                  priority: <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>,
                  status: <Pill tone={STATUS_TONE[t.status]}>{t.status}</Pill>,
                  owner: t.assigneeId ? (
                    <span className="text-[12px]">{t.assigneeId}</span>
                  ) : (
                    <span className="text-[12px] text-[var(--warn-text)]">unassigned</span>
                  ),
                  updated: ago(t.updatedAt, NOW_ISO),
                }))}
                empty="No ticket matches this view."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
