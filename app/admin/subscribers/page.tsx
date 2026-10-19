import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listSubscribers } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { dateOnly } from "@/lib/format";

import type { Subscriber } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const TONE: Record<string, "success" | "warn" | "danger" | "muted" | "accent"> = {
  active: "success",
  trialing: "accent",
  past_due: "danger",
  cancelled: "muted",
};

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const rows = await listSubscribers();
  const load = present(state, rows);

  const money = (cents: number, interval: Subscriber["interval"]) =>
    `$${(cents / 100).toFixed(2)}/${interval === "month" ? "mo" : "yr"}`;
  const recurring = rows
    .filter((s) => s.status === "active" || s.status === "trialing")
    .reduce((t, s) => t + (s.interval === "month" ? s.amountCents : s.amountCents / 12), 0);

  return (
    <>
      <PageHeader
        title="Subscribers"
        description="Who pays, on what plan, and what happens when a card fails."
        unwired
        state={state}
        params={params}
      />

      <PageState
        load={load}
        rows={6}
        empty="Nobody is subscribed — on a platform this size that is either early or broken."
      />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Subscribers" value={rows.length} hint="distinct paid relationships" />
            <Metric
              label="Recurring"
              value={`$${(recurring / 100).toFixed(0)}/mo`}
              hint="trialing counted at face value"
              tone="success"
            />
            <Metric
              label="Past due"
              value={rows.filter((s) => s.status === "past_due").length}
              hint="the dunning queue"
              tone={rows.some((s) => s.status === "past_due") ? "danger" : "default"}
            />
            <Metric
              label="Cancelled"
              value={rows.filter((s) => s.status === "cancelled").length}
              hint="churn, lifetime"
            />
          </div>

          <Panel
            title="Plans"
            flush
            hint="The endpoint returns a billing id and a user id; resolving the person behind it is what wiring adds."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "plan", label: "Plan" },
                  { key: "account", label: "Account", hideBelow: "sm" },
                  { key: "status", label: "Status" },
                  { key: "amount", label: "Amount", align: "right" },
                  { key: "seats", label: "Seats", align: "right", hideBelow: "md" },
                  { key: "provider", label: "Provider", hideBelow: "lg" },
                  { key: "renews", label: "Renews", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((s) => ({
                  plan: (
                    <span className="flex flex-col">
                      <span className="font-medium text-[var(--fg)]">{s.plan}</span>
                      <span className="text-[12px] text-[var(--muted)]">{s.id}</span>
                    </span>
                  ),
                  account: (
                    <Link
                      href={`/admin/people/${s.userId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {s.userId}
                    </Link>
                  ),
                  status: <Pill tone={TONE[s.status] ?? "muted"}>{s.status.replaceAll("_", " ")}</Pill>,
                  amount: money(s.amountCents, s.interval),
                  seats: s.seats,
                  provider: s.provider,
                  renews: dateOnly(s.currentPeriodEnd),
                }))}
                empty="No subscription matches."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
