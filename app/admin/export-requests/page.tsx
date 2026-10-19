import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listExportRequests } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, bytes, dateOnly, duration } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

export default async function ExportRequestsPage({
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

  const page = await listExportRequests({ status, q });
  const load = present(state, page);

  const statuses = ["pending", "ready", "failed"];

  return (
    <>
      <PageHeader
        title="Export requests"
        description="Every “download my data” a person has asked for. The archive is never stored — what lives here is the request, its format, and whether the file was actually produced."
        state={state}
        params={params}
      />

      <Panel>
        <form action="/admin/export-requests" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Search exports</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Request id, account or file name"
            className="h-9 min-w-[14rem] flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="sr-only">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Any status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {q || status ? (
            <a href="/admin/export-requests" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={6} empty="No export request matches — nobody has asked to leave with their data, or the filter is too narrow." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Requests" value={page.total} hint="all time" />
            <Metric
              label="Awaiting build"
              value={page.items.filter((r) => r.status === "pending").length}
              hint="on this page"
              tone="warn"
            />
            <Metric
              label="Failed"
              value={page.items.filter((r) => r.status === "failed").length}
              hint="a person is waiting on these"
              tone={page.items.some((r) => r.status === "failed") ? "danger" : "default"}
            />
            <Metric
              label="Archive bytes"
              value={bytes(page.items.reduce((t, r) => t + (r.bytes ?? 0), 0))}
              hint="produced, not stored"
            />
          </div>

          <Panel flush>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "account", label: "Account" },
                  { key: "format", label: "Format", hideBelow: "sm" },
                  { key: "status", label: "Status" },
                  { key: "file", label: "File", hideBelow: "lg" },
                  { key: "size", label: "Size", align: "right", hideBelow: "md" },
                  { key: "asked", label: "Requested", align: "right", hideBelow: "sm" },
                ]}
                rows={load.data.items.map((r) => ({
                  account: (
                    <Link
                      href={`/admin/people/${r.userId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {r.userId}
                    </Link>
                  ),
                  format: <Pill tone={r.format === "html" ? "accent" : "muted"}>{r.format}</Pill>,
                  status:
                    r.status === "ready" ? (
                      <Pill tone="success">ready</Pill>
                    ) : r.status === "failed" ? (
                      <span title={r.error ?? undefined}>
                        <Pill tone="danger">failed</Pill>
                      </span>
                    ) : (
                      <Pill tone="warn">pending</Pill>
                    ),
                  file: (
                    <span className="flex min-w-0 flex-col">
                      <code className="block truncate text-[12px]">{r.fileName}</code>
                      {r.builtAt ? (
                        <span className="text-[11px] text-[var(--muted)]">
                          built in {buildSeconds(r.requestedAt, r.builtAt)}
                        </span>
                      ) : r.error ? (
                        <span className="text-[11px] text-[var(--danger-text)]">
                          {r.error.slice(0, 46)}
                        </span>
                      ) : null}
                    </span>
                  ),
                  size: r.bytes === null ? "—" : bytes(r.bytes),
                  asked: dateOnly(r.requestedAt),
                }))}
                empty="No export request matches this filter."
              />
            </div>
          </Panel>

          <p className="text-[12px] text-[var(--muted)]">
            A request that never built is a DSAR clock running: the newest pending row here was
            asked for{" "}
            {page.items.find((r) => r.status === "pending")
              ? ago(page.items.find((r) => r.status === "pending")!.requestedAt, NOW_ISO)
              : "not at all"}
            .
          </p>
        </>
      )}
    </>
  );
}

function buildSeconds(from: string, to: string): string {
  const secs = (Date.parse(to) - Date.parse(from)) / 1000;
  return secs > 0 ? duration(secs) : "—";
}
