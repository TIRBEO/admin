import { apiGet } from "@/lib/api";
import { Card, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

/* GET /api/admin/maintenance reports the live window held in the API process.
   Turning maintenance on is a PUT that only a super_admin may make, and it
   notifies every affected user — so this page is deliberately read-only. An
   operator can see whether a window is open and who it exempts, which is the
   question actually asked during an incident; starting one is a deliberate
   act taken from the super-admin's own session. */

type Maintenance = {
  enabled?: boolean;
  message?: string | null;
  estimatedEnd?: string | null;
  allowedUsers?: string[] | null;
  startTime?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

export default async function MaintenancePage() {
  const res = await apiGet<Maintenance>("/admin/maintenance");
  if (!res.ok) return <Failure result={res} what="the maintenance state" />;

  const m = res.data ?? {};
  const allowed = m.allowedUsers ?? [];
  const scheduled = !!(m.scheduledStart || m.scheduledEnd);

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Current state"
        description="Held in the API process, so it does not survive a restart."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={m.enabled ? "danger" : "ok"}>
            {m.enabled ? "Maintenance on" : "Service normal"}
          </Badge>
          {m.enabled && m.message ? (
            <p className="text-[13px] text-[var(--tb-text-secondary)]">
              {m.message}
            </p>
          ) : null}
        </div>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
          <Row label="Started" value={m.startTime ? dateTime(m.startTime) : "—"} />
          <Row
            label="Expected to end"
            value={m.estimatedEnd ? `${dateTime(m.estimatedEnd)} (${ago(m.estimatedEnd)})` : "—"}
          />
          <Row label="Scheduled window" value={scheduled ? "Yes" : "None"} />
          <Row
            label="Scheduled start"
            value={m.scheduledStart ? dateTime(m.scheduledStart) : "—"}
          />
          <Row
            label="Scheduled end"
            value={m.scheduledEnd ? dateTime(m.scheduledEnd) : "—"}
          />
          <Row label="Exempt accounts" value={String(allowed.length)} />
        </dl>
      </Card>

      {allowed.length > 0 ? (
        <Card title="Exempt during maintenance" description="Allowed in while the window is open.">
          <ul className="flex flex-wrap gap-1.5">
            {allowed.map((id) => (
              <li key={id}>
                <Badge tone="accent">{id}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {scheduled ? (
        <Card title="Scheduled" description="A future window is registered.">
          <p className="text-[13px] text-[var(--tb-text-secondary)]">
            {dateTime(m.scheduledStart)} → {dateTime(m.scheduledEnd)}
          </p>
        </Card>
      ) : null}

      {!m.enabled && !scheduled ? (
        <State
          title="No maintenance window"
          body="The service is open and nothing is scheduled. An empty maintenance state is the normal one, not a missing reading."
        />
      ) : null}

      <Card title="Changing this">
        <p className="text-[13px] text-[var(--tb-text-secondary)]">
          <code className="rounded bg-[var(--tb-surface-2)] px-1 text-[11px]">PUT /api/admin/maintenance</code>{" "}
          requires the <code className="text-[11px]">super_admin</code> role and
          notifies users unless told otherwise, so there is no control for it
          on this page. Each window it creates writes a{" "}
          <code className="text-[11px]">MAINTENANCE_SCHEDULE_*</code> audit
          event naming who scheduled it.
        </p>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[var(--tb-text-muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}