import Link from "next/link";
import { Siren } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listPushSubscriptions } from "@/lib/mock";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";
import { ago, dateOnly } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

const DAY = 86_400_000;

export default async function PushPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const rows = await listPushSubscriptions();
  const load = present(state, rows);

  const stale = rows.filter((p) => NOW_ISO_MS() - Date.parse(p.lastUsedAt) > 30 * DAY);
  const people = new Set(rows.map((p) => p.userId));

  return (
    <>
      <PageHeader
        title="Push"
        description="Device tokens the platform may write to. A token is a person's address in someone else's system, so it ages and it gets deleted."
        state={state}
        params={params}
        actions={
          <button type="button" className="btn btn-primary btn-sm" disabled title={MOCK_ERROR}>
            <Siren size={13} aria-hidden />
            Send a test
          </button>
        }
      />

      <PageState
        load={load}
        rows={5}
        empty="No browser has granted permission, so there is nowhere to send. That is a prompt problem, not a delivery one."
      />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Tokens" value={rows.length} hint="a person may hold several" />
            <Metric label="People reachable" value={people.size} hint="distinct accounts" tone="success" />
            <Metric
              label="Unused 30 days"
              value={stale.length}
              hint="candidates for pruning"
              tone={stale.length > 0 ? "warn" : "success"}
            />
            <Metric
              label="Reach"
              value={`${rows.length ? Math.round(((rows.length - stale.length) / rows.length) * 100) : 0}%`}
              hint="of tokens still live"
            />
          </div>

          <Panel
            flush
            title="Subscriptions"
            hint="The endpoint is shown as its host: a token URL carries the subscription's own secret."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "account", label: "Account" },
                  { key: "service", label: "Service" },
                  { key: "agent", label: "Device", hideBelow: "md" },
                  { key: "used", label: "Last used", align: "right" },
                  { key: "added", label: "Added", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((p) => {
                  const dead = NOW_ISO_MS() - Date.parse(p.lastUsedAt) > 30 * DAY;
                  return {
                    account: (
                      <Link
                        href={`/admin/people/${p.userId}`}
                        className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                      >
                        {p.userId}
                      </Link>
                    ),
                    service: (
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[12px]">{hostOf(p.endpoint)}</span>
                        <code className="truncate text-[11px] text-[var(--muted)]">{p.id}</code>
                      </span>
                    ),
                    agent: (
                      <span className="block max-w-[22ch] truncate text-[12px] text-[var(--text-2)]">
                        {p.userAgent ?? "unknown client"}
                      </span>
                    ),
                    used: (
                      <Pill tone={dead ? "warn" : "success"}>{ago(p.lastUsedAt, NOW_ISO)}</Pill>
                    ),
                    added: dateOnly(p.createdAt),
                  };
                })}
                empty="Nobody has subscribed a device."
              />
            </div>
          </Panel>

          <p className="text-[12px] leading-relaxed text-[var(--muted)]">
            A campaign screen is deliberately absent: push is sent from the notification rules, and
            a second place to blast every token is a second way to get it wrong.
          </p>
        </>
      )}
    </>
  );
}

function NOW_ISO_MS(): number {
  return Date.parse(NOW_ISO);
}

function hostOf(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return endpoint.slice(0, 32);
  }
}
