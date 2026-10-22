import Link from "next/link";

import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { ago, dateTime } from "@/lib/format";
import { readMaintenance } from "@/lib/maintenance";

type Params = Record<string, string | string[] | undefined>;

/* A moment is real when the API stored it; a null means the window has none. */
function when(ms: number | null): { label: string; ago: string } | null {
  if (!ms) return null;
  return { label: dateTime(ms), ago: ago(ms, new Date().toISOString()) };
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  void await searchParams; // one stored state, no filters.
  const load = await readMaintenance();

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="The switch that stops the platform answering, and the sentence it shows in the app's place."
        actions={
          load.status === "ready" ? (
            <Pill tone={load.data.enabled ? "danger" : "success"}>
              {load.data.enabled ? "the platform is closed" : "open"}
            </Pill>
          ) : null
        }
      />

      <PageState
        load={load}
        rows={4}
        empty="Maintenance mode has never been configured, so there is no stored state to show."
      />

      {load.status !== "ready" ? null : (
        <Body
          enabled={load.data.enabled}
          message={load.data.message}
          estimatedEnd={load.data.estimatedEnd}
          startTime={load.data.startTime}
          scheduledStart={load.data.scheduledStart}
          scheduledEnd={load.data.scheduledEnd}
          allowedUsers={load.data.allowedUsers}
        />
      )}
    </>
  );
}

function Body({
  enabled,
  message,
  estimatedEnd,
  startTime,
  scheduledStart,
  scheduledEnd,
  allowedUsers,
}: {
  enabled: boolean;
  message: string;
  estimatedEnd: number | null;
  startTime: number | null;
  scheduledStart: number | null;
  scheduledEnd: number | null;
  allowedUsers: string[];
}) {
  const started = when(startTime);
  const ends = when(estimatedEnd);
  const schedStart = when(scheduledStart);
  const schedEnd = when(scheduledEnd);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Current state" hint="Exactly what GET /admin/maintenance reports.">
          <dl className="-my-1">
            <Field label="Mode">
              <Pill tone={enabled ? "danger" : "success"}>{enabled ? "closed" : "open"}</Pill>
            </Field>
            <Field label="Started">
              {started ? (
                <span title={started.label}>{started.ago}</span>
              ) : (
                "not running"
              )}
            </Field>
            <Field label="Estimated end">{ends ? ends.label : "open-ended"}</Field>
            <Field label="Scheduled window">
              {schedStart
                ? `${schedStart.label}${schedEnd ? ` → ${schedEnd.label}` : ""}`
                : "none set"}
            </Field>
          </dl>
        </Panel>

        <Panel title="What a visitor sees" hint="This sentence, on a plate, in place of the app.">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-5 text-center">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
              We’ll be back shortly
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
              {message || "No message has been stored."}
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Read-only" hint="Why this screen offers no switch.">
        <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
          This screen is read-only, and not by omission. The write door
          (<code className="text-[12px]">PUT</code> / <code className="text-[12px]">DELETE</code>)
          demands a <code className="text-[12px]">super_admin</code> role, but the API resolves every
          administrator from a single boolean <code className="text-[12px]">isAdmin</code> that maps
          only to <code className="text-[12px]">admin</code>. There is no account this console can
          reach that the endpoint will accept a write from, so turning maintenance on or off is not
          something the operator standing here can do — and a form that could not save would be a
          lie.
        </p>
      </Panel>

      <Panel
        title="Allowed through"
        hint={
          allowedUsers.length > 0
            ? "These ids keep full access while the platform is closed."
            : "Nobody is exempted — the gate treats every account the same."
        }
      >
        {allowedUsers.length === 0 ? (
          <p className="text-[13px] text-[var(--muted)]">
            The allow-list is empty, so every visitor sees the maintenance plate.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {allowedUsers.map((id) => (
              <li key={id}>
                <Link
                  href={`/admin/people/${id}`}
                  className="inline-flex items-center rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                >
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
