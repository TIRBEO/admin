import Link from "next/link";
import { Boxes, ToggleLeft } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { appSettings, featureFlags } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

const STATE_TONE: Record<string, "success" | "warn" | "muted" | "accent"> = {
  on: "success",
  off: "muted",
  rollout: "accent",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const [rows, flags] = await Promise.all([appSettings(), featureFlags()]);
  const load = present(state, { rows, flags });

  const live = flags.filter((f) => f.state === "on");
  const rolling = flags.filter((f) => f.state === "rollout");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Platform switches, in two very different places: app_config is a real table with a real read; feature flags are an endpoint that answers 501 and a shape this screen would like back."
        unwired
        state={state}
        params={params}
      />

      <PageState load={load} rows={6} empty="Neither the config table nor the flag registry has a row, which means the platform is running on defaults nobody chose." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Config keys" value={rows.length} hint="app_config rows" />
            <Metric label="Flags" value={flags.length} hint="the registry this screen wants" />
            <Metric label="Fully on" value={live.length} hint="shipped to everyone" tone="success" />
            <Metric
              label="In rollout"
              value={rolling.length}
              hint={rolling.map((f) => `${f.key} ${f.rollout}%`).join(" · ") || "nothing partial"}
              tone={rolling.length > 0 ? "accent" : "default"}
            />
          </div>

          <Panel
            title="Feature flags"
            flush
            hint="Who flipped it, and when, is part of the row: a flag nobody remembers is an incident waiting to be attributed."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "flag", label: "Flag" },
                  { key: "state", label: "State" },
                  { key: "rollout", label: "Rollout", align: "right", hideBelow: "sm" },
                  { key: "scope", label: "Scope", hideBelow: "lg" },
                  { key: "by", label: "Last changed", align: "right", hideBelow: "md" },
                ]}
                rows={flags.map((f) => ({
                  flag: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-[var(--fg)]">{f.label}</span>
                      <code className="truncate text-[11px] text-[var(--muted)]">{f.key}</code>
                    </span>
                  ),
                  state: <Pill tone={STATE_TONE[f.state] ?? "muted"}>{f.state}</Pill>,
                  rollout: `${f.rollout}%`,
                  scope: f.scope,
                  by: (
                    <span className="text-[12px] text-[var(--muted)]">
                      <Link href={`/admin/people/${f.updatedBy}`} className="text-[var(--accent-text)] hover:underline">
                        {f.updatedBy}
                      </Link>{" "}
                      · {ago(f.updatedAt, NOW_ISO)}
                    </span>
                  ),
                }))}
                empty="The flag registry is empty."
              />
            </div>
          </Panel>

          <Panel
            title="Platform config"
            flush
            hint="Read today from app_config. A value here is JSON, so a list is a list and a switch is a switch."
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "key", label: "Key" },
                  { key: "value", label: "Value" },
                  { key: "why", label: "What it governs", hideBelow: "md" },
                  { key: "at", label: "Changed", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((r) => ({
                  key: <code className="text-[12px] text-[var(--fg)]">{r.key}</code>,
                  value: <Value value={r.value} />,
                  why: <span className="text-[12px] text-[var(--muted)]">{r.description}</span>,
                  at: ago(r.updatedAt, NOW_ISO),
                }))}
                empty="No key is set."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}

/** A config value is arbitrary JSON. It is rendered as what it is — a switch
    reads as a switch, a list as chips — rather than as a quoted blob. */
function Value({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
          value ? "text-[var(--success-text)]" : "text-[var(--muted)]"
        }`}
      >
        <ToggleLeft size={13} aria-hidden className={value ? "rotate-180" : undefined} />
        {value ? "on" : "off"}
      </span>
    );
  }
  if (Array.isArray(value)) {
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((v) => (
          <code
            key={String(v)}
            className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-2)]"
          >
            {String(v)}
          </code>
        ))}
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="text-[12px] tabular-nums">{value.toLocaleString()}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
      <Boxes size={12} aria-hidden className="text-[var(--muted)]" />
      {String(value)}
    </span>
  );
}
