import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listIdentities, listReservedAddresses } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateOnly } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

export default async function IdentitiesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const [identities, reserved] = await Promise.all([listIdentities(), listReservedAddresses()]);
  const load = present(state, { identities, reserved });

  const claimed = identities.filter((i) => i.userId).length;
  const verified = identities.filter((i) => i.verifiedAt).length;

  return (
    <>
      <PageHeader
        title="Identities"
        description="The handle namespace is separate from the account: a person may hold several addresses, and some addresses nobody may hold at all."
        unwired
        state={state}
        params={params}
      />

      <PageState load={load} rows={6} empty="No handle has been claimed and none is held back." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Handles" value={load.data.identities.length} hint="rows in identities" />
            <Metric
              label="Claimed"
              value={claimed}
              hint={`${load.data.identities.length - claimed} unattached`}
            />
            <Metric
              label="Verified"
              value={verified}
              hint={`by ${new Set(load.data.identities.map((i) => i.verifiedSource).filter(Boolean)).size || "—"} sources`}
              tone={verified === load.data.identities.length ? "success" : "warn"}
            />
            <Metric
              label="Reserved"
              value={load.data.reserved.length}
              hint="nobody may claim these"
            />
          </div>

          <Panel title="Handles" flush hint="A handle is a public address; the account behind it is not.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "username", label: "Handle" },
                  { key: "account", label: "Account", hideBelow: "md" },
                  { key: "source", label: "Proven", hideBelow: "lg" },
                  { key: "verified", label: "Verified", align: "right" },
                  { key: "since", label: "Claimed", align: "right", hideBelow: "sm" },
                ]}
                rows={load.data.identities.map((i) => ({
                  username: (
                    <code className="text-[13px] font-medium text-[var(--fg)]">@{i.username}</code>
                  ),
                  account: i.userId ? (
                    <Link
                      href={`/admin/people/${i.userId}`}
                      className="text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {i.email ?? i.userId}
                    </Link>
                  ) : (
                    <span className="text-[12px] text-[var(--muted)]">unattached</span>
                  ),
                  source: i.verifiedSource ?? <span className="text-[var(--muted)]">self-declared</span>,
                  verified: i.verifiedAt ? (
                    <Pill tone="success">yes</Pill>
                  ) : (
                    <Pill tone="warn">no</Pill>
                  ),
                  since: dateOnly(i.createdAt),
                }))}
                empty="No handle has been claimed."
              />
            </div>
          </Panel>

          <Panel
            title="Reserved addresses"
            flush
            hint="Claims against these are refused before the database is touched."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "username", label: "Handle" },
                  { key: "reason", label: "Why it is held" },
                  { key: "heldBy", label: "Held for", hideBelow: "md" },
                  { key: "at", label: "Since", align: "right", hideBelow: "sm" },
                ]}
                rows={load.data.reserved.map((r) => ({
                  username: <code className="text-[13px]">@{r.username}</code>,
                  reason: r.reason,
                  heldBy: r.heldBy ?? <span className="text-[var(--muted)]">the platform</span>,
                  at: ago(r.createdAt, NOW_ISO),
                }))}
                empty="Nothing is held back — every handle is claimable."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
