import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card, Stat, Badge, DataTable } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { ago } from "@/lib/format";

/* GET /admin/security/score returns a score out of 100 built from five
   weighted factors, plus the signals behind it: the threat band, the most
   recent critical events, the busiest IPs and the commonest event types. */

type Factor = {
  name?: string;
  score?: number;
  maxScore?: number;
  status?: "good" | "warning" | "critical";
  description?: string;
};

type Score = {
  score?: number;
  threatLevel?: "low" | "medium" | "high" | "critical";
  factors?: Factor[];
  recentCritical?: Array<{
    id?: string;
    severity?: string;
    eventType?: string;
    ipAddress?: string | null;
    createdAt?: string;
    user?: { email?: string; name?: string | null } | null;
  }>;
  topIPs?: Array<{ ip: string; count: number }>;
  topEventTypes?: Array<{ type: string; count: number }>;
  stats?: {
    totalUsers?: number;
    usersWith2FA?: number;
    activeSessions?: number;
    blockedIPs?: number;
    blockedUsers?: number;
  };
};

const THREAT_TONE = {
  low: "ok",
  medium: "warn",
  high: "danger",
  critical: "danger",
} as const;

function factorTone(status: Factor["status"]) {
  return status === "good" ? "ok" : status === "warning" ? "warn" : "danger";
}

export default async function SecurityPage() {
  const res = await apiGet<Score>("/admin/security/score");

  if (!res.ok) return <Failure result={res} what="the security score" />;

  const s = res.data ?? {};
  const threat = s.threatLevel ?? "low";
  const stats = s.stats ?? {};

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Security posture"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          label="Score"
          value={typeof s.score === "number" ? `${s.score} / 100` : "—"}
          hint="Sum of the five factors below"
        />
        <Stat
          label="Threat level"
          value={<Badge tone={THREAT_TONE[threat]}>{threat}</Badge>}
          hint="Derived from the same score"
        />
        <Stat
          label="2FA adoption"
          value={
            stats.totalUsers
              ? `${Math.round(((stats.usersWith2FA ?? 0) / stats.totalUsers) * 100)}%`
              : "—"
          }
          hint={`${stats.usersWith2FA ?? 0} of ${stats.totalUsers ?? 0} accounts`}
        />
        <Stat
          label="Active blocks"
          value={(stats.blockedIPs ?? 0) + (stats.blockedUsers ?? 0)}
          hint={`${stats.blockedIPs ?? 0} IPs · ${stats.blockedUsers ?? 0} accounts`}
        />
      </section>

      <Card title="Factors" description="Each factor's contribution to the score.">
        <DataTable
          columns={["Factor", "Score", "Standing", "Why"]}
          empty="The API reported no factors."
          rows={(s.factors ?? []).map((f) => ({
            Factor: <span className="font-medium">{f.name ?? "—"}</span>,
            Score: (
              <span className="tabular-nums">
                {f.score ?? 0} / {f.maxScore ?? 0}
              </span>
            ),
            Standing: (
              <Badge tone={factorTone(f.status)}>{f.status ?? "unknown"}</Badge>
            ),
            Why: <span className="text-[var(--tb-text-muted)]">{f.description ?? "—"}</span>,
          }))}
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Recent critical events"
          description="Last 30 days."
          action={
            <Link
              href="/admin/security/events"
              className="text-[12px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
            >
              All events
            </Link>
          }
        >
          <DataTable
            columns={["When", "Event", "IP", "Account"]}
            empty="No critical events in the last 30 days."
            rows={(s.recentCritical ?? []).map((e) => ({
              When: ago(e.createdAt),
              Event: <span className="font-mono text-[12px]">{e.eventType ?? "—"}</span>,
              IP: e.ipAddress ?? "—",
              Account: e.user?.email ?? "—",
            }))}
          />
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Busiest IPs" description="By event count, last 30 days.">
            <DataTable
              columns={["IP", "Events"]}
              empty="No IP-attributed events."
              rows={(s.topIPs ?? []).map((i) => ({
                IP: <span className="font-mono text-[12px]">{i.ip}</span>,
                Events: i.count,
              }))}
            />
          </Card>
          <Card title="Commonest events">
            <DataTable
              columns={["Event", "Count"]}
              empty="No events recorded."
              rows={(s.topEventTypes ?? []).map((t) => ({
                Event: <span className="font-mono text-[12px]">{t.type}</span>,
                Count: t.count,
              }))}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}