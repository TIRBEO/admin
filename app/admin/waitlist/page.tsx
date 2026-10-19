import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listWaitlist, waitlistStats } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { dateOnly } from "@/lib/format";

type Params = Record<string, string | string[] | undefined>;

const TONE: Record<string, "success" | "warn" | "danger" | "muted" | "accent"> = {
  pending: "muted",
  invited: "accent",
  joined: "success",
  blocked: "danger",
};

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const [rows, stats] = await Promise.all([listWaitlist(), waitlistStats()]);
  const load = present(state, rows);

  return (
    <>
      <PageHeader
        title="Waitlist"
        description="Pre-launch demand, where it came from, and who has been let through."
        unwired
        state={state}
        params={params}
      />

      <PageState load={load} rows={6} empty="The list is empty — either nobody is waiting or the landing store was cleared." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="On the list" value={stats.total} hint="everyone who asked" />
            <Metric label="Invited" value={stats.invited} hint="waiting to sign up" tone="accent" />
            <Metric label="Joined" value={stats.joined} hint="converted" tone="success" />
            <Metric
              label="Blocked"
              value={stats.blocked}
              hint="refused an invite"
              tone={stats.blocked > 0 ? "danger" : "default"}
            />
          </div>

          <Panel title="Where they came from" hint="Source is self-reported by the link they arrived on.">
            <ul className="flex flex-wrap gap-2">
              {stats.bySource.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[12px] text-[var(--text-2)]"
                >
                  {s.label}
                  <span className="font-semibold tabular-nums text-[var(--fg)]">{s.value}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            flush
            title="The queue"
            hint="Position is the order people asked in; an invite that skipped ahead is visible here."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "position", label: "#", width: "5ch" },
                  { key: "email", label: "Address" },
                  { key: "source", label: "Source", hideBelow: "md" },
                  { key: "status", label: "Status" },
                  { key: "invited", label: "Invited", align: "right", hideBelow: "sm" },
                  { key: "asked", label: "Asked", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((w) => ({
                  position: <span className="tabular-nums text-[var(--muted)]">{w.position}</span>,
                  email: <code className="text-[12px]">{w.email}</code>,
                  source: w.source ?? "unknown",
                  status: <Pill tone={TONE[w.status] ?? "muted"}>{w.status}</Pill>,
                  invited: w.invitedAt ? dateOnly(w.invitedAt) : "—",
                  asked: dateOnly(w.createdAt),
                }))}
                empty="Nobody is waiting."
              />
            </div>
          </Panel>

          <p className="text-[12px] leading-relaxed text-[var(--muted)]">
            This list is not in the API. It lives in the landing app's own store
            (<code>apps/landing/app/api/waitlist</code>), so wiring this screen means either an
            endpoint there or a read replica here — not a query against the platform database.
          </p>
        </>
      )}
    </>
  );
}
