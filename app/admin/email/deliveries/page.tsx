import Link from "next/link";
import { MousePointerClick, Eye } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listDeliveries } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

const STATUSES = ["sent", "delivered", "opened", "bounced", "failed"];

const STATUS_TONE: Record<string, "success" | "warn" | "danger" | "muted" | "accent"> = {
  sent: "muted",
  delivered: "accent",
  opened: "success",
  bounced: "warn",
  failed: "danger",
};

export default async function DeliveriesPage({
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
  const q = one("q") ?? "";

  const rows = await listDeliveries({ status, q });
  const load = present(state, rows);

  const opened = rows.filter((d) => d.openedAt).length;
  const clicked = rows.filter((d) => d.clickedAt).length;
  const bounce = rows.filter((d) => d.status === "bounced" || d.status === "failed").length;

  return (
    <>
      <PageHeader
        title="Deliveries"
        description="What the provider said happened to mail that left the queue — including the part a queue can never know, which is whether anybody read it."
        state={state}
        params={params}
      />

      <Panel>
        <form action="/admin/email/deliveries" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Search deliveries</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Address, subject or event"
            className="h-9 min-w-[14rem] flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="sr-only">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Any outcome</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {q || status ? (
            <a href="/admin/email/deliveries" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={6} empty="No mail left the platform for this filter." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Deliveries" value={rows.length} hint="in this view" />
            <Metric
              label="Open rate"
              value={`${rows.length ? Math.round((opened / rows.length) * 100) : 0}%`}
              hint={`${opened} opened`}
            />
            <Metric
              label="Click rate"
              value={`${rows.length ? Math.round((clicked / rows.length) * 100) : 0}%`}
              hint={`${clicked} clicked`}
            />
            <Metric
              label="Hard failures"
              value={bounce}
              hint="bounces and rejects"
              tone={bounce > 0 ? "danger" : "success"}
            />
          </div>

          <Panel flush title="Sent mail" hint="A provider id is how you ask the provider what happened.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "to", label: "Recipient" },
                  { key: "subject", label: "Subject", hideBelow: "md" },
                  { key: "status", label: "Outcome" },
                  { key: "engaged", label: "Engaged", hideBelow: "sm" },
                  { key: "provider", label: "Provider", hideBelow: "lg" },
                  { key: "when", label: "Sent", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((d) => ({
                  to: (
                    <span className="flex min-w-0 flex-col">
                      <code className="truncate text-[12px] text-[var(--fg)]">{d.toEmail}</code>
                      {d.userId ? (
                        <Link
                          href={`/admin/people/${d.userId}`}
                          className="text-[11px] text-[var(--accent-text)] hover:underline"
                        >
                          {d.userId}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[var(--muted)]">{d.eventKey}</span>
                      )}
                    </span>
                  ),
                  subject: <span className="block truncate text-[var(--text-2)]">{d.subject}</span>,
                  status: <Pill tone={STATUS_TONE[d.status] ?? "muted"}>{d.status}</Pill>,
                  engaged: (
                    <span className="flex items-center gap-2.5 text-[12px]">
                      {d.openedAt ? (
                        <span
                          title={`opened ${dateTime(d.openedAt)}`}
                          className="flex items-center gap-1 text-[var(--success-text)]"
                        >
                          <Eye size={12} aria-hidden />
                          open
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">unread</span>
                      )}
                      {d.clickedAt ? (
                        <span
                          title={`clicked ${dateTime(d.clickedAt)}`}
                          className="flex items-center gap-1 text-[var(--accent-text)]"
                        >
                          <MousePointerClick size={12} aria-hidden />
                          click
                        </span>
                      ) : null}
                    </span>
                  ),
                  provider: (
                    <span className="text-[12px] text-[var(--muted)]" title={d.providerId ?? undefined}>
                      {d.provider ?? "—"}
                    </span>
                  ),
                  when: <span title={dateTime(d.createdAt)}>{ago(d.createdAt, NOW_ISO)}</span>,
                }))}
                empty="No delivery matches."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
