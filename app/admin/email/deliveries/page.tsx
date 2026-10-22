import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readDeliveries, readLimit, PAGE_SIZES } from "@/lib/email-deliveries";
import { ago, dateTime } from "@/lib/format";
import { signInUrl } from "@/lib/sign-in";

import type { EmailDelivery } from "@/lib/types";

/* The outbound story in one table.

   Every mail the platform sends leaves a row here, and the row is the only
   place the provider's answer lives — so this screen is where an operator
   checks whether a person actually got their reset link, or whether the
   message stopped at the provider. What a row can say is exactly what
   `email_deliveries` holds: who it went to, which event raised it, the
   provider's own status, and whether anyone opened or clicked it. Nothing
   here is inferred: no delivery rate, no bounce reason, no "reason" the door
   never returned. */

type Params = Record<string, string | string[] | undefined>;

const TONE: Record<string, "success" | "warn" | "danger" | "muted"> = {
  sent: "success",
  delivered: "success",
  pending: "warn",
  queued: "warn",
  bounced: "danger",
  failed: "danger",
  dropped: "danger",
  complained: "danger",
};

/** The words an operator reads for a status. Anything the schema adds later
    falls through to its own name rather than being relabelled wrong. */
function statusWord(status: string): string {
  return status;
}

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const page = Math.max(1, Number(one("page")) || 1);
  const limit = readLimit(one("limit"));

  const load = await readDeliveries(page, limit);
  const list = load.status === "ready" ? load.data : null;

  const failed = list ? list.items.filter((d) => isFailure(d.status)).length : 0;
  const engaged = list ? list.items.filter((d) => d.openedAt || d.clickedAt).length : 0;

  const href = (over: Record<string, string | number>) => {
    const next = { page, limit, ...over };
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (!value || (key === "page" && Number(value) === 1)) continue;
      search.set(key, String(value));
    }
    const q = search.toString();
    return q ? `?${q}` : "";
  };

  const error =
    load.status === "error" && load.reason === "signed-out"
      ? {
          ...load,
          action: (
            <Link href={await signInUrl("/admin/email/deliveries")} className="btn btn-primary btn-sm">
              Sign in
            </Link>
          ),
        }
      : load;

  return (
    <>
      <PageHeader
        title="Deliveries"
        description="Every mail the platform sent, addressed to whom, raised by which event, and what the provider reported back. One row per send — the opened and clicked columns are the provider's own webhooks, not a guess."
        actions={
          <Link href="/admin/email/templates" className="btn btn-quiet btn-sm">
            Templates
          </Link>
        }
      />

      <Panel>
        <form action="/admin/email/deliveries" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Rows per page</span>
          <select
            name="limit"
            defaultValue={String(limit)}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} rows
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          <span className="ml-auto text-[12px] tabular-nums text-[var(--muted)]">
            Newest first
          </span>
        </form>
      </Panel>

      <PageState
        load={error}
        rows={8}
        empty="No mail has been sent yet. The first row appears the moment the platform hands anything to the provider."
      />

      {list ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Total sent" value={list.total.toLocaleString()} hint="every row the door holds" />
            <Metric label="On this page" value={list.items.length} hint={`page ${list.page} of ${pages(list)}`} />
            <Metric
              label="Failed here"
              value={failed}
              hint="provider refused or dropped"
              tone={failed > 0 ? "danger" : "success"}
            />
            <Metric label="Engaged here" value={engaged} hint="opened or clicked" tone={engaged > 0 ? "accent" : "default"} />
          </div>

          <Panel flush title="The ledger" hint="A row is a send, not a conversation — the same person appears once for every mail raised to them.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "to", label: "Recipient" },
                  { key: "subject", label: "Subject", hideBelow: "sm" },
                  { key: "event", label: "Raised by", hideBelow: "md" },
                  { key: "status", label: "Provider" },
                  { key: "engaged", label: "Engaged", hideBelow: "lg" },
                  { key: "when", label: "Sent", align: "right", hideBelow: "md" },
                ]}
                rows={list.items.map((d: EmailDelivery) => ({
                  to: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[var(--fg)]">{d.toEmail || "—"}</span>
                      {d.userId ? (
                        <Link
                          href={`/admin/people/${d.userId}`}
                          className="truncate font-mono text-[11px] text-[var(--accent-text)] hover:underline"
                        >
                          {d.userId.slice(0, 8)}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[var(--muted)]">unassigned</span>
                      )}
                    </span>
                  ),
                  subject: <span className="block max-w-[22rem] truncate">{d.subject || "—"}</span>,
                  event: (
                    <span className="flex flex-col">
                      <code className="text-[12px] text-[var(--text-2)]">{d.eventKey || d.event || "—"}</code>
                      <span className="text-[11px] text-[var(--muted)]">{d.category}</span>
                    </span>
                  ),
                  status: (
                    <span className="flex flex-col gap-1">
                      <Pill tone={TONE[d.status] ?? "muted"}>{statusWord(d.status)}</Pill>
                      {d.provider ? (
                        <span className="text-[11px] text-[var(--muted)]">
                          {d.provider}
                          {d.messageId ? ` · ${d.messageId.slice(0, 8)}` : ""}
                        </span>
                      ) : null}
                    </span>
                  ),
                  engaged: (
                    <span className="flex flex-col gap-1 text-[12px]">
                      <span className={d.openedAt ? "text-[var(--success-text)]" : "text-[var(--muted)]"}>
                        {d.openedAt ? "opened" : "not opened"}
                      </span>
                      <span className={d.clickedAt ? "text-[var(--success-text)]" : "text-[var(--muted)]"}>
                        {d.clickedAt ? "clicked" : "not clicked"}
                      </span>
                    </span>
                  ),
                  when: (
                    <span className="text-[12px] tabular-nums" title={dateTime(d.createdAt)}>
                      {ago(d.createdAt)}
                    </span>
                  ),
                }))}
                empty="No mail matches this view."
              />
            </div>

            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-3 border-t border-[var(--divider)] px-4 py-3"
            >
              <p className="text-[12px] tabular-nums text-[var(--muted)]">{range(list)}</p>
              <div className="flex gap-2">
                {list.page > 1 ? (
                  <Link href={href({ page: list.page - 1 })} className="btn btn-secondary btn-sm">
                    Previous
                  </Link>
                ) : null}
                {list.page * list.perPage < list.total ? (
                  <Link href={href({ page: list.page + 1 })} className="btn btn-secondary btn-sm">
                    Next
                  </Link>
                ) : null}
              </div>
            </nav>
          </Panel>
        </>
      ) : null}
    </>
  );
}

function isFailure(status: string): boolean {
  return TONE[status] === "danger";
}

function pages(list: { total: number; perPage: number }): number {
  return Math.max(1, Math.ceil(list.total / list.perPage));
}

function range(list: { page: number; perPage: number; total: number }): string {
  if (list.total === 0) return "no rows";
  const first = (list.page - 1) * list.perPage + 1;
  const last = Math.min(list.page * list.perPage, list.total);
  return `${first}–${last.toLocaleString()} of ${list.total.toLocaleString()}`;
}
