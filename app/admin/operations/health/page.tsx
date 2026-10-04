import { apiGet } from "@/lib/api";
import { Card, State, Badge, DataTable } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { duration } from "@/lib/format";

/* GET /api/health answers `{ status, uptime, checks, pool }` — every field
   optional, because a dependency that cannot be reached is reported as a
   failed check rather than as a failed request. */

type Check = { status?: string; latencyMs?: number };
type Health = {
  status?: string;
  timestamp?: string;
  uptime?: number;
  checks?: Record<string, Check & Record<string, unknown>>;
  pool?: { totalCount?: number; idleCount?: number; waitingCount?: number };
};

function tone(status: string | undefined) {
  if (status === "ok") return "ok" as const;
  if (status === undefined) return "muted" as const;
  return "danger" as const;
}

export default async function HealthPage() {
  const res = await apiGet<Health>("/health");

  if (!res.ok) {
    return (
      <Failure
        result={res}
        what="the health endpoint"
      />
    );
  }

  const h = res.data ?? {};
  const checks = Object.entries(h.checks ?? {});
  const pool = h.pool;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface-1)] p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--tb-text-muted)]">
            Status
          </p>
          <p className="mt-1.5">
            <Badge tone={tone(h.status)}>{h.status ?? "unknown"}</Badge>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface-1)] p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--tb-text-muted)]">
            Uptime
          </p>
          <p className="mt-1.5 text-[26px] font-semibold tabular-nums tracking-[-0.02em]">
            {duration(h.uptime)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface-1)] p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--tb-text-muted)]">
            Pool waiting
          </p>
          <p className="mt-1.5 text-[26px] font-semibold tabular-nums tracking-[-0.02em]">
            {pool?.waitingCount ?? 0}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--tb-text-muted)]">
            {pool?.idleCount ?? 0} idle of {pool?.totalCount ?? 0}
          </p>
        </div>
      </div>

      <Card
        title="Dependencies"
        description="Each one as the API last measured it."
      >
        {checks.length === 0 ? (
          <State title="The API reported no dependency checks." />
        ) : (
          <DataTable
            columns={["Dependency", "Status", "Latency", "Detail"]}
            empty="No checks reported."
            rows={checks.map(([name, c]) => ({
              Dependency: <span className="font-medium">{name}</span>,
              Status: <Badge tone={tone(c.status)}>{c.status ?? "unknown"}</Badge>,
              Latency:
                typeof c.latencyMs === "number" ? `${c.latencyMs} ms` : "—",
              Detail:
                Object.entries(c)
                  .filter(([k]) => k !== "status" && k !== "latencyMs")
                  .map(([k, value]) => `${k} ${String(value)}`)
                  .join(" · ") || "—",
            }))}
          />
        )}
      </Card>
    </div>
  );
}