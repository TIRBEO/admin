import Link from "next/link";
import { apiGet, num } from "@/lib/api";
import { getDash } from "@/lib/dash";
import { Card, Stat, DataTable, Badge } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { duration, ago } from "@/lib/format";

/* "Monitor" is the runtime view: how long the process has been up, how the
   cache and the connection pool are doing, which queries are slow, and what
   the CAPTCHA has blocked. There is no restart or deploy control here — the
   API exposes none, and a panel that could restart the thing it reads from
   would be a panel that can take itself down. */

type Block = {
  targetType?: string;
  targetId?: string;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  isActive?: boolean;
};

export default async function MonitorPage() {
  const [dashRes, blockedRes] = await Promise.all([
    getDash(7),
    apiGet<{ items?: Block[] }>("/admin/monitor/blocked"),
  ]);

  if (!dashRes.ok) return <Failure result={dashRes} what="the runtime telemetry" />;

  const d = dashRes.data ?? {};
  const captcha = d.captcha ?? {};
  const redis = (d.redis?.summary ?? {}) as Record<string, unknown>;
  const blocked = blockedRes.ok ? (blockedRes.data?.items ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Runtime" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Process uptime" value={duration(d.uptime)} hint="This API process" />
        <Stat
          label="Tracked queries"
          value={num(d.queryPerf?.totalTrackedQueries) ?? 0}
          hint={`${num(d.queryPerf?.slowQueryCount) ?? 0} over the slow threshold`}
        />
        <Stat
          label="CAPTCHA"
          value={`${num(captcha.solved) ?? 0} / ${num(captcha.challenges) ?? 0}`}
          hint={`${num(captcha.solvedRate) ?? 0}% solved · ${num(captcha.activeBlocks) ?? 0} blocks in force`}
        />
        <Stat
          label="Blocked IPs"
          value={blocked.filter((b) => b.targetType === "ip").length}
          hint={`${blocked.length} blocks of every kind`}
        />
      </section>

      <Card
        title="What this page cannot do"
        description="Stated up front, so nobody goes looking for a button that is not here."
      >
        <p className="text-[13px] text-[var(--tb-text-secondary)]">
          The API exposes no restart, redeploy or process-control route, so
          neither does this panel. Operations that need a restart go through
          the deployment platform;{" "}
          <Link
            href="/admin/operations/health"
            className="text-[var(--tb-accent)] underline-offset-4 hover:underline"
          >
            health
          </Link>{" "}
          is where you confirm whether one is warranted first.
        </p>
      </Card>

      <Card title="Slowest queries" description="p95 measured in the running process.">
        <DataTable
          columns={["Query", "Calls", "Avg", "p95", "Max"]}
          empty="No query timings have been recorded yet."
          rows={(d.queryPerf?.slowest ?? []).map((q) => ({
            Query: <span className="font-mono text-[12px]">{q.name}</span>,
            Calls: q.count,
            Avg: `${q.avgMs} ms`,
            p95: (
              <span className={q.p95Ms > 500 ? "text-[var(--tb-warn)]" : undefined}>
                {q.p95Ms} ms
              </span>
            ),
            Max: `${q.maxMs} ms`,
          }))}
        />
      </Card>

      <Card
        title="Cache"
        description={Object.keys(redis).length ? "As summarised by the API." : "No summary reported."}
      >
        {Object.keys(redis).length === 0 ? (
          <p className="text-[13px] text-[var(--tb-text-muted)]">
            The API returned no cache summary.
          </p>
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
      </Card>

      <Card
        title="Blocked addresses"
        description="Read from the monitor route, which is a different reader of the same blocklist."
        action={
          <Link
            href="/admin/security/blocks"
            className="text-[12px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
          >
            Manage
          </Link>
        }
      >
        <DataTable
          columns={["Type", "Target", "Reason", "Expires", "Since"]}
          empty="Nothing is blocked."
          rows={blocked.map((b) => ({
            Type: <Badge tone={b.isActive === false ? "muted" : "danger"}>{b.targetType ?? "—"}</Badge>,
            Target: <span className="font-mono text-[12px]">{b.targetId ?? "—"}</span>,
            Reason: b.reason ?? "—",
            Expires: b.expiresAt ? ago(b.expiresAt) : "never",
            Since: b.createdAt ? ago(b.createdAt) : "—",
          }))}
        />
      </Card>
    </div>
  );
}