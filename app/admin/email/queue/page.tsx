import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listEmailJobs } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { EmailJobKind } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const STATUSES = ["queued", "running", "sent", "failed", "dropped"];
const KINDS: EmailJobKind[] = ["otp", "verify", "reset", "digest", "notice", "test"];

const STATUS_TONE: Record<string, "success" | "warn" | "danger" | "muted" | "accent"> = {
  queued: "muted",
  running: "accent",
  sent: "success",
  failed: "danger",
  dropped: "warn",
};

export default async function EmailQueuePage({
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
  const kind = one("kind") ?? "";

  const rows = await listEmailJobs({ status, kind });
  const load = present(state, rows);

  const failing = rows.filter((j) => j.status === "failed");
  const retrying = rows.filter((j) => j.status === "queued" || j.status === "running");

  const field =
    "h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <>
      <PageHeader
        title="Email queue"
        description="Outbound work that has not landed yet. A job is the intent; a delivery is what the provider said back."
        state={state}
        params={params}
        actions={
          <Link href="/admin/email/deliveries" className="btn btn-secondary btn-sm">
            Deliveries
          </Link>
        }
      />

      <Panel>
        <form action="/admin/email/queue" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status} className={field}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="sr-only">Kind</span>
          <select name="kind" defaultValue={kind} className={field}>
            <option value="">Every kind</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {status || kind ? (
            <a href="/admin/email/queue" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={6} empty="Nothing in flight — the queue is drained for this filter." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Jobs" value={rows.length} hint="in this view" />
            <Metric
              label="In flight"
              value={retrying.length}
              hint="queued or running"
              tone={retrying.length > 5 ? "warn" : "default"}
            />
            <Metric
              label="Dead letters"
              value={failing.length}
              hint="attempts spent, mail never sent"
              tone={failing.length > 0 ? "danger" : "success"}
            />
            <Metric
              label="Oldest waiting"
              value={
                retrying.length > 0
                  ? ago(retrying[retrying.length - 1]!.createdAt, NOW_ISO)
                  : "—"
              }
              hint="a code nobody received"
            />
          </div>

          <Panel flush title="The queue" hint="Newest first; a job that will never send is still newest-first.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "to", label: "Recipient" },
                  { key: "subject", label: "Subject", hideBelow: "md" },
                  { key: "kind", label: "Kind" },
                  { key: "status", label: "Status" },
                  { key: "attempts", label: "Tries", align: "right", hideBelow: "sm" },
                  { key: "age", label: "Age", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((j) => ({
                  to: (
                    <span className="flex min-w-0 flex-col">
                      <code className="truncate text-[12px] text-[var(--fg)]">{j.toEmail}</code>
                      <span className="text-[11px] text-[var(--muted)]">
                        <code>{j.eventKey}</code>
                        {j.userId ? (
                          <>
                            {" · "}
                            <Link
                              href={`/admin/people/${j.userId}`}
                              className="text-[var(--accent-text)] hover:underline"
                            >
                              {j.userId}
                            </Link>
                          </>
                        ) : (
                          " · no account"
                        )}
                      </span>
                    </span>
                  ),
                  subject: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[var(--text-2)]">{j.subject ?? "—"}</span>
                      {j.lastError ? (
                        <span className="truncate text-[11px] text-[var(--danger-text)]" title={j.lastError}>
                          {j.lastError}
                        </span>
                      ) : j.templateSlug ? (
                        <Link
                          href={`/admin/email/templates?slug=${j.templateSlug}`}
                          className="truncate text-[11px] text-[var(--muted)] hover:underline"
                        >
                          {j.templateSlug}
                        </Link>
                      ) : null}
                    </span>
                  ),
                  kind: <Pill tone="muted">{j.kind}</Pill>,
                  status: (
                    <Pill tone={STATUS_TONE[j.status] ?? "muted"}>{j.status}</Pill>
                  ),
                  attempts: (
                    <span title={dateTime(j.availableAt)}>
                      {j.attempts}/{j.maxAttempts}
                    </span>
                  ),
                  age: ago(j.createdAt, NOW_ISO),
                }))}
                empty="No job matches this filter."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
