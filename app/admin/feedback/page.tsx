import Link from "next/link";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listFeedback } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

const KINDS = ["feedback.profile", "feedback.article", "feedback.onboarding", "feedback.search", "feedback.report"];
const STATUSES = ["open", "triaged", "fixed", "wont_fix"];

const STATUS_TONE: Record<string, "success" | "warn" | "danger" | "muted" | "accent"> = {
  open: "warn",
  triaged: "accent",
  fixed: "success",
  wont_fix: "muted",
};

export default async function FeedbackPage({
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
  const kind = one("kind") ?? "";
  const status = one("status") ?? "";

  const rows = await listFeedback({ kind, status });
  const load = present(state, rows);

  const field =
    "h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <>
      <PageHeader
        title="Feedback"
        description="What people said while they were standing on the page that got them to say it."
        state={state}
        params={params}
      />

      <Panel>
        <form action="/admin/feedback" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Where it came from</span>
          <select name="kind" defaultValue={kind} className={field}>
            <option value="">Every surface</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k.replace("feedback.", "")}
              </option>
            ))}
          </select>
          <span className="sr-only">Triage state</span>
          <select name="status" defaultValue={status} className={field}>
            <option value="">Any state</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {kind || status ? (
            <a href="/admin/feedback" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={6} empty="Nothing has been said about this part of the product." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Reports" value={rows.length} hint="in this filter" />
            <Metric
              label="Awaiting triage"
              value={rows.filter((f) => f.status === "open").length}
              hint="nobody has read these yet"
              tone={rows.some((f) => f.status === "open") ? "warn" : "success"}
            />
            <Metric
              label="Happy"
              value={rows.filter((f) => f.vote === "up").length}
              hint="thumbs up"
              tone="success"
            />
            <Metric
              label="Unhappy"
              value={rows.filter((f) => f.vote === "down").length}
              hint="thumbs down"
              tone={rows.filter((f) => f.vote === "down").length > rows.filter((f) => f.vote === "up").length ? "danger" : "default"}
            />
          </div>

          <Panel flush>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "said", label: "What they said" },
                  { key: "surface", label: "Surface", hideBelow: "md" },
                  { key: "vote", label: "Signal", hideBelow: "sm" },
                  { key: "status", label: "Triage" },
                  { key: "when", label: "When", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((f) => ({
                  said: (
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[var(--text-2)]">
                        {f.comment ?? <span className="text-[var(--muted)]">no comment, vote only</span>}
                      </span>
                      <span className="text-[11px] text-[var(--muted)]">
                        <code>{f.kind}</code>
                        {f.page ? ` · ${f.page}` : ""}
                        {f.userId ? (
                          <>
                            {" · "}
                            <Link
                              href={`/admin/people/${f.userId}`}
                              className="text-[var(--accent-text)] hover:underline"
                            >
                              {f.userId}
                            </Link>
                          </>
                        ) : (
                          " · anonymous"
                        )}
                      </span>
                    </span>
                  ),
                  surface: f.source ?? "—",
                  vote:
                    f.vote === null && f.rating === null ? (
                      "—"
                    ) : (
                      <span className="flex items-center gap-2">
                        {f.vote ? (
                          <span
                            className={
                              f.vote === "up"
                                ? "text-[var(--success-text)]"
                                : "text-[var(--danger-text)]"
                            }
                          >
                            {f.vote === "up" ? (
                              <ThumbsUp size={13} aria-hidden />
                            ) : (
                              <ThumbsDown size={13} aria-hidden />
                            )}
                          </span>
                        ) : null}
                        {f.rating !== null ? `${f.rating}/5` : null}
                      </span>
                    ),
                  status: <Pill tone={STATUS_TONE[f.status] ?? "muted"}>{f.status.replaceAll("_", " ")}</Pill>,
                  when: (
                    <span title={dateTime(f.createdAt)}>{ago(f.createdAt, NOW_ISO)}</span>
                  ),
                }))}
                empty="Nothing reported on this surface."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
