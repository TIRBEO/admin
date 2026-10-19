import Link from "next/link";
import { Wrench } from "lucide-react";

import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { maintenanceState } from "@/lib/mock";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { Severity } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const SEVERITY_TONE: Record<Severity, "muted" | "warn" | "danger"> = {
  info: "muted",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const { state: mode, incidents } = await maintenanceState();
  const load = present(state, { mode, incidents });

  const live = incidents.filter((i) => !i.resolvedAt);

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="The switch that stops the platform answering, and the banners that tell people why."
        state={state}
        params={params}
        actions={
          <>
            <Link href="/admin/health" className="btn btn-secondary btn-sm">
              Health
            </Link>
            <button type="button" className="btn btn-primary btn-sm" disabled title={MOCK_ERROR}>
              <Wrench size={13} aria-hidden />
              {mode.enabled ? "End maintenance" : "Start maintenance"}
            </button>
          </>
        }
      />

      <PageState load={load} rows={4} empty="Maintenance mode has never been configured, so the switch has no stored message to show." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Panel
              title="Current mode"
              action={
                <Pill tone={mode.enabled ? "danger" : "success"}>
                  {mode.enabled ? "the platform is closed" : "open"}
                </Pill>
              }
            >
              <dl className="-my-1">
                <Field label="Window">
                  {mode.startedAt && mode.endsAt
                    ? `${dateTime(mode.startedAt)} → ${dateTime(mode.endsAt)}`
                    : mode.enabled
                      ? "open-ended"
                      : "not running"}
                </Field>
                <Field label="Sign-in">
                  <Pill tone={mode.blockSignIn ? "warn" : "muted"}>
                    {mode.blockSignIn ? "blocked" : "allowed"}
                  </Pill>
                </Field>
                <Field label="Admins">
                  <Pill tone={mode.allowAdmins ? "accent" : "muted"}>
                    {mode.allowAdmins ? "still get in" : "locked out too"}
                  </Pill>
                </Field>
                <Field label="Last changed">{ago(mode.updatedAt, NOW_ISO)}</Field>
                <Field label="By">
                  <Link
                    href={`/admin/people/${mode.updatedBy}`}
                    className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                  >
                    {mode.updatedBy}
                  </Link>
                </Field>
              </dl>
            </Panel>

            <Panel title="What a visitor sees" hint="Exactly this sentence, on a plate, instead of the app.">
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-5 text-center">
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                  We’ll be back shortly
                </p>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
                  {mode.message}
                </p>
              </div>
              <p className="mt-3 text-[12px] leading-snug text-[var(--muted)]">
                The message is stored whether or not the switch is on, so an operator writes it
                before the window rather than during it.
              </p>
            </Panel>
          </div>

          <Panel
            title="Incidents"
            hint="Public notices. A resolved one stays, because the record is the point."
          >
            <ul className="flex flex-col divide-y divide-[var(--divider)]">
              {incidents.map((i) => (
                <li key={i.id} className="flex flex-wrap items-start gap-x-4 gap-y-1.5 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                      {i.title}
                      <Pill tone={i.resolvedAt ? "muted" : SEVERITY_TONE[i.severity]}>
                        {i.resolvedAt ? "resolved" : i.severity}
                      </Pill>
                    </p>
                    <p className="mt-1 text-[13px] leading-snug text-[var(--text-2)]">{i.message}</p>
                  </div>
                  <p className="shrink-0 text-right text-[12px] tabular-nums text-[var(--muted)]">
                    {ago(i.startedAt, NOW_ISO)}
                    {i.resolvedAt ? (
                      <>
                        <br />
                        <span title={dateTime(i.resolvedAt)}>
                          fixed {ago(i.resolvedAt, NOW_ISO)}
                        </span>
                      </>
                    ) : (
                      <>
                        <br />
                        <span className="text-[var(--warn-text)]">still showing</span>
                      </>
                    )}
                  </p>
                </li>
              ))}
              {incidents.length === 0 ? (
                <li className="text-[13px] text-[var(--muted)]">Nothing has been announced.</li>
              ) : null}
            </ul>
          </Panel>

          {live.length > 0 ? (
            <p className="text-[12px] text-[var(--warn-text)]">
              {live.length} notice{live.length === 1 ? "" : "s"} still on screen for every visitor —
              confirm each one is true before the next deploy clears it.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
