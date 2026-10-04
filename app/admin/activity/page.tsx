import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card, DataTable, Badge } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

/* GET /api/admin/activity?limit= returns { logs, onlineUsers }. Online users
   are derived from sessions used in the last five minutes and deduplicated by
   account, so one person signed in on a laptop and a phone appears once. */

type Actor = { id?: string; email?: string; name?: string | null };
type Log = {
  id?: string;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  ipAddress?: string | null;
  createdAt?: string;
  actor?: Actor | null;
};
type Online = Actor & { id?: string };

type Payload = { logs?: Log[]; onlineUsers?: Online[] };

const SIZES = [25, 50, 100, 200];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const sp = await searchParams;
  const raw = Number(sp.limit);
  const limit = SIZES.includes(raw) ? raw : 50;

  const res = await apiGet<Payload>(`/admin/activity?limit=${limit}`);
  if (!res.ok) return <Failure result={res} what="the activity feed" />;

  const data = res.data ?? {};
  const logs = data.logs ?? [];
  const online = data.onlineUsers ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[var(--tb-text-muted)]">
          Showing the {logs.length} most recent events.
        </span>
        <nav aria-label="How many events" className="ml-auto flex gap-1">
          {SIZES.map((n) => (
            <a
              key={n}
              href={`/admin/activity?limit=${n}`}
              aria-current={n === limit ? "page" : undefined}
              className={`rounded-lg border px-2.5 py-1 text-[12px] ${
                n === limit
                  ? "border-[var(--tb-accent)] text-[var(--tb-accent)]"
                  : "border-[var(--tb-border)] text-[var(--tb-text-muted)] hover:bg-[var(--tb-surface-2)]"
              }`}
            >
              {n}
            </a>
          ))}
        </nav>
      </div>

      <Card
        title="Online now"
        description="Active in the last five minutes."
      >
        <DataTable
          columns={["Account", "Name"]}
          empty="Nobody has been active in the last five minutes."
          rows={online.map((u) => ({
            Account: <span className="font-mono text-[12px]">{u.email ?? u.id ?? "—"}</span>,
            Name: u.name ?? "—",
          }))}
        />
      </Card>

      <Card title="Events" description="Newest first.">
        <DataTable
          columns={["When", "What", "Who", "Severity", "IP"]}
          empty="No activity has been recorded."
          rows={logs.map((l) => ({
            When: <span title={dateTime(l.createdAt)}>{ago(l.createdAt)}</span>,
            What: (
              <span>
                <span className="font-medium">{l.title ?? l.kind ?? "—"}</span>
                {l.detail ? (
                  <span className="block text-[12px] text-[var(--tb-text-muted)]">
                    {l.detail}
                  </span>
                ) : null}
              </span>
            ),
            Who: l.actor?.email ? (
              <Link
                href={`/admin/users?q=${encodeURIComponent(l.actor.email)}`}
                className="font-mono text-[12px] text-[var(--tb-accent)] underline-offset-4 hover:underline"
              >
                {l.actor.email}
              </Link>
            ) : (
              <span className="text-[var(--tb-text-muted)]">system</span>
            ),
            Severity: l.severity ? (
              <Badge tone={severityTone(l.severity)}>{l.severity}</Badge>
            ) : (
              "—"
            ),
            IP: l.ipAddress ?? "—",
          }))}
        />
      </Card>
    </div>
  );
}

function severityTone(s: string) {
  return s === "critical" || s === "error"
    ? ("danger" as const)
    : s === "warning"
      ? ("warn" as const)
      : ("muted" as const);
}