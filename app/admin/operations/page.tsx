import Link from "next/link";
import { apiGet, num } from "@/lib/api";
import { getDash } from "@/lib/dash";
import { Card, Stat, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { duration, dateTime, ago } from "@/lib/format";

type Health = {
  status?: string;
  uptime?: number;
  checks?: Record<string, { status?: string; latencyMs?: number } & Record<string, unknown>>;
  pool?: { totalCount?: number; idleCount?: number; waitingCount?: number };
};

type Block = {
  targetType?: string;
  targetId?: string;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  isActive?: boolean;
};

type Log = {
  id?: string;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  ipAddress?: string | null;
  createdAt?: string;
};

type Maintenance = {
  enabled?: boolean;
  message?: string | null;
  estimatedEnd?: string | null;
  allowedUsers?: string[] | null;
  startTime?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

const LOG_SIZES = [50, 100, 200, 500];

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const sp = await searchParams;
  const raw = Number(sp.limit);
  const logLimit = LOG_SIZES.includes(raw) ? raw : 100;

  const [healthRes, dashRes, blockedRes, logsRes, maintRes] = await Promise.all([
    apiGet<Health>("/health"),
    getDash(7),
    apiGet<{ items?: Block[] }>("/admin/monitor/blocked"),
    apiGet<Log[]>(`/admin/monitor/logs?limit=${logLimit}`),
    apiGet<Maintenance>("/admin/maintenance"),
  ]);

  if (!healthRes.ok) return <Failure result={healthRes} what="the health endpoint" />;

  const h = healthRes.data ?? {};
  const checks = Object.entries(h.checks ?? {});
  const pool = h.pool;
  const d = dashRes.data ?? {};
  const captcha = d.captcha ?? {};
  const redis = (d.redis?.summary ?? {}) as Record<string, unknown>;
  const blocked = blockedRes.ok ? (blockedRes.data?.items ?? []) : [];
  const logs = Array.isArray(logsRes.data) ? logsRes.data : [];
  const captchaBlocks = d.recentCaptcha ?? [];
  const failedLogins = (d.recentLogins ?? []).filter((l) => l.eventType === "login_failed");
  const otherLogins = (d.recentLogins ?? []).filter((l) => l.eventType !== "login_failed");
  const m = maintRes.data ?? {};
  const allowed = m.allowedUsers ?? [];
  const scheduled = !!(m.scheduledStart || m.scheduledEnd);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Service health" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Status"
          value={<Badge tone={healthTone(h.status)}>{h.status ?? "unknown"}</Badge>}
          hint="Every dependency as the API last measured it"
        />
        <Stat label="Uptime" value={duration(h.uptime)} hint="This API process" />
        <Stat
          label="Pool waiting"
          value={pool?.waitingCount ?? 0}
          hint={`${pool?.idleCount ?? 0} idle of ${pool?.totalCount ?? 0}`}
          tone={(pool?.waitingCount ?? 0) > 0 ? "warn" : "default"}
        />
        <Stat
          label="Tracked queries"
          value={num(d.queryPerf?.totalTrackedQueries) ?? 0}
          hint={`${num(d.queryPerf?.slowQueryCount) ?? 0} over the slow threshold`}
        />
      </section>

      <Card title="Dependencies" description="Each one as the API last measured it.">
        {checks.length === 0 ? (
          <State title="The API reported no dependency checks." />
        ) : (
          <DataTable
            columns={["Dependency", "Status", "Latency", "Detail"]}
            empty="No checks reported."
            rows={checks.map(([name, c]) => ({
              Dependency: <span className="font-medium">{name}</span>,
              Status: <Badge tone={healthTone(c.status)}>{c.status ?? "unknown"}</Badge>,
              Latency: typeof c.latencyMs === "number" ? `${c.latencyMs} ms` : "—",
              Detail:
                Object.entries(c)
                  .filter(([k]) => k !== "status" && k !== "latencyMs")
                  .map(([k, value]) => `${k} ${String(value)}`)
                  .join(" · ") || "—",
            }))}
          />
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Slowest queries" description="p95 measured in the running process.">
          <DataTable
            columns={["Query", "Calls", "Avg", "p95", "Max"]}
            empty="No query timings have been recorded yet."
            rows={(d.queryPerf?.slowest ?? []).map((q) => ({
              Query: <span className="font-mono text-[12px]">{q.name}</span>,
              Calls: q.count,
              Avg: `${q.avgMs} ms`,
              p95: (
                <span className={q.p95Ms > 500 ? "font-medium text-[var(--tb-warn)]" : undefined}>
                  {q.p95Ms} ms
                </span>
              ),
              Max: `${q.maxMs} ms`,
            }))}
          />
        </Card>

        <Card title="Cache" description={Object.keys(redis).length ? "As summarised by the API." : "No summary reported."}>
          {Object.keys(redis).length === 0 ? (
            <p className="text-[13px] text-[var(--tb-text-muted)]">The API returned no cache summary.</p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-3">
              {Object.entries(redis).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <dt className="text-[var(--tb-text-muted)]">{k}</dt>
                  <dd className="font-medium tabular-nums">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--tb-border)] pt-3.5 text-[13px] sm:grid-cols-3">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[var(--tb-text-muted)]">CAPTCHA</dt>
              <dd className="font-medium">
                {captcha.configured
                  ? "Turnstile on"
                  : captcha.secretPresent || captcha.siteKeyPresent
                    ? "Misconfigured"
                    : "Off"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[var(--tb-text-muted)]">Challenges 24h</dt>
              <dd className="font-medium tabular-nums">{num(captcha.challenges) ?? 0}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[var(--tb-text-muted)]">Blocked IPs</dt>
              <dd className="font-medium tabular-nums">
                {blocked.filter((b) => b.targetType === "ip").length}
              </dd>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="API activity log"
        description={`${logs.length} entries, newest first. stdout is not readable over HTTP — this is what the server chose to write about itself.`}
        action={
          <nav aria-label="How many entries" className="flex gap-1">
            {LOG_SIZES.map((n) => (
              <a
                key={n}
                href={`/admin/operations?limit=${n}`}
                aria-current={n === logLimit ? "page" : undefined}
                className={`rounded-[8px] border px-2.5 py-1 text-[12px] ${
                  n === logLimit
                    ? "border-[var(--tb-accent)] text-[var(--tb-accent)]"
                    : "border-[var(--tb-border)] text-[var(--tb-text-muted)] hover:bg-[var(--tb-surface-2)]"
                }`}
              >
                {n}
              </a>
            ))}
          </nav>
        }
      >
        <DataTable
          columns={["When", "Kind", "Detail", "Severity", "IP"]}
          empty={logsRes.ok ? "The API has written no activity." : "The activity log could not be read."}
          rows={logs.map((l) => ({
            When: <span title={dateTime(l.createdAt)}>{ago(l.createdAt)}</span>,
            Kind: <span className="font-mono text-[12px]">{l.kind ?? "—"}</span>,
            Detail: l.title ?? l.detail ?? "—",
            Severity: l.severity ? <Badge tone={severityTone(l.severity)}>{l.severity}</Badge> : "—",
            IP: l.ipAddress ?? "—",
          }))}
        />
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Failed sign-ins" description="The most recent refusals, newest first.">
          <DataTable
            columns={["When", "IP", "Account"]}
            empty="No failed sign-in has been recorded."
            rows={failedLogins.map((l) => ({
              When: ago(l.createdAt),
              IP: l.ipAddress ?? "—",
              Account: l.userId ? (
                <Link
                  href={`/admin/people?q=${encodeURIComponent(l.userId)}`}
                  className="font-mono text-[11px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
                >
                  {l.userId.slice(0, 8)}
                </Link>
              ) : (
                "unknown"
              ),
            }))}
          />
        </Card>
        <Card title="Successful sign-ins" description="The most recent, newest first.">
          <DataTable
            columns={["When", "IP", "Account"]}
            empty="No successful sign-in has been recorded."
            rows={otherLogins.map((l) => ({
              When: ago(l.createdAt),
              IP: l.ipAddress ?? "—",
              Account: l.userId ? (
                <Link
                  href={`/admin/people?q=${encodeURIComponent(l.userId)}`}
                  className="font-mono text-[11px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
                >
                  {l.userId.slice(0, 8)}
                </Link>
              ) : (
                "unknown"
              ),
            }))}
          />
        </Card>
      </div>

      <Card title="CAPTCHA blocks" description="Imposed automatically. An operator has not reviewed these.">
        <DataTable
          columns={["When", "IP", "Reason", "Difficulty", "State"]}
          empty="No CAPTCHA block has been imposed."
          rows={captchaBlocks.map((b) => ({
            When: ago(b.blockedAt),
            IP: b.ipAddress ?? "—",
            Reason: b.reason ?? "—",
            Difficulty: b.difficulty ?? "—",
            State: b.unblockedAt ? (
              <span className="text-[var(--tb-text-muted)]">lifted {ago(b.unblockedAt)}</span>
            ) : (
              <Badge tone="danger">in force</Badge>
            ),
          }))}
        />
      </Card>

      <Card
        title="Maintenance"
        description="Held in the API process, so it does not survive a restart. Turning it on is a super_admin PUT that notifies users — deliberately no control here."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={m.enabled ? "danger" : "ok"}>{m.enabled ? "Maintenance on" : "Service normal"}</Badge>
          {m.enabled && m.message ? (
            <p className="text-[13px] text-[var(--tb-text-secondary)]">{m.message}</p>
          ) : null}
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3">
          <Row label="Started" value={m.startTime ? dateTime(m.startTime) : "—"} />
          <Row
            label="Expected to end"
            value={m.estimatedEnd ? `${dateTime(m.estimatedEnd)} (${ago(m.estimatedEnd)})` : "—"}
          />
          <Row label="Scheduled window" value={scheduled ? `${dateTime(m.scheduledStart)} → ${dateTime(m.scheduledEnd)}` : "None"} />
          <Row label="Exempt accounts" value={String(allowed.length)} />
        </dl>
        {allowed.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {allowed.map((id) => (
              <li key={id}>
                <Badge tone="accent">{id}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <p className="text-[12px] text-[var(--tb-text-muted)]">
        The API exposes no restart, redeploy or process-control route, so neither does this panel. For raw stdout, read the deployment&apos;s log drain.
      </p>
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

function healthTone(status: string | undefined) {
  if (status === "ok") return "ok" as const;
  if (status === undefined) return "muted" as const;
  return "danger" as const;
}

function severityTone(s: string) {
  return s === "critical" || s === "error"
    ? ("danger" as const)
    : s === "warning"
      ? ("warn" as const)
      : ("muted" as const);
}
