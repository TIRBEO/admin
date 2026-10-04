import Link from "next/link";
import { apiGet } from "@/lib/api";
import { getDash } from "@/lib/dash";
import { Card, DataTable, Badge } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

/* Server output is not something the API can read back — it goes to the
   process's stdout. What it can read is the three places a problem shows
   up as data: the activity log the API writes itself, the CAPTCHA blocks
   it has imposed, and the sign-in failures it has recorded. That is what
   this page shows, and it says plainly that it is not a log viewer. */

type Log = {
  id?: string;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  ipAddress?: string | null;
  createdAt?: string;
};

const SIZES = [50, 100, 200, 500];

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const sp = await searchParams;
  const raw = Number(sp.limit);
  const limit = SIZES.includes(raw) ? raw : 100;

  const [logsRes, dashRes] = await Promise.all([
    apiGet<Log[]>(`/admin/monitor/logs?limit=${limit}`),
    getDash(1),
  ]);

  if (!logsRes.ok) return <Failure result={logsRes} what="the server activity log" />;

  const logs = Array.isArray(logsRes.data) ? logsRes.data : [];
  const dash = dashRes.data;
  const captchaBlocks = dash?.recentCaptcha ?? [];
  const failedLogins = (dash?.recentLogins ?? []).filter(
    (l) => l.eventType === "login_failed",
  );
  const otherLogins = (dash?.recentLogins ?? []).filter(
    (l) => l.eventType !== "login_failed",
  );

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="What this is not"
        description="stdout is not readable over HTTP, so there is no log viewer here."
      >
        <p className="text-[13px] text-[var(--tb-text-secondary)]">
          An admin panel cannot show a process&apos;s console output without
          shipping that output somewhere queryable, and nothing in the API
          does that. What it can read is where problems leave a record. The
          three tables below are those records: what the API wrote about
          itself, the CAPTCHA blocks it has imposed, and recent sign-ins.
          For raw output, read the deployment&apos;s log drain.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[var(--tb-text-muted)]">
          {logs.length} entries, newest first.
        </span>
        <nav aria-label="How many entries" className="ml-auto flex gap-1">
          {SIZES.map((n) => (
            <a
              key={n}
              href={`/admin/operations/logs?limit=${n}`}
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

      <Card title="API activity log" description="What the server wrote about itself.">
        <DataTable
          columns={["When", "Kind", "Detail", "Severity", "IP"]}
          empty="The API has written no activity."
          rows={logs.map((l) => ({
            When: <span title={dateTime(l.createdAt)}>{ago(l.createdAt)}</span>,
            Kind: <span className="font-mono text-[12px]">{l.kind ?? "—"}</span>,
            Detail: l.title ?? l.detail ?? "—",
            Severity: l.severity ? (
              <Badge tone={sevTone(l.severity)}>{l.severity}</Badge>
            ) : (
              "—"
            ),
            IP: l.ipAddress ?? "—",
          }))}
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Failed sign-ins"
          description="The most recent refusals, newest first."
        >
          <DataTable
            columns={["When", "IP", "Account"]}
            empty="No failed sign-in has been recorded."
            rows={failedLogins.map((l) => ({
              When: ago(l.createdAt),
              IP: l.ipAddress ?? "—",
              Account: l.userId ? (
                <Link
                  href={`/admin/users?q=${encodeURIComponent(l.userId)}`}
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
                  href={`/admin/users?q=${encodeURIComponent(l.userId)}`}
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

      <Card
        title="CAPTCHA blocks"
        description="Imposed automatically. An operator has not reviewed these."
      >
        <DataTable
          columns={["When", "IP", "Reason", "Difficulty", "State"]}
          empty="No CAPTCHA block has been imposed."
          rows={captchaBlocks.map((b) => ({
            When: ago(b.blockedAt),
            IP: b.ipAddress ?? "—",
            Reason: b.reason ?? "—",
            Difficulty: b.difficulty ?? "—",
            State: b.unblockedAt ? (
              <span className="text-[var(--tb-text-muted)]">
                lifted {ago(b.unblockedAt)}
              </span>
            ) : (
              <Badge tone="danger">in force</Badge>
            ),
          }))}
        />
      </Card>
    </div>
  );
}

function sevTone(s: string) {
  return s === "critical" || s === "error"
    ? ("danger" as const)
    : s === "warning"
      ? ("warn" as const)
      : ("muted" as const);
}