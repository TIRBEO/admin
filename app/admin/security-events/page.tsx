import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { fetchSecurityScore, readSecurityEvents } from "@/lib/security";
import { ago, dateTime } from "@/lib/format";

import type { SecurityScore, Severity } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const SEVERITIES: Severity[] = ["info", "warning", "error", "critical"];

const SEVERITY_TONE: Record<Severity, "muted" | "warn" | "danger"> = {
  info: "muted",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

/** What the posture panel shows when the posture query did not answer. */
const UNMEASURED: SecurityScore = {
  score: 0,
  threatLevel: "low",
  factors: [],
  stats: {
    totalUsers: 0,
    usersWith2FA: 0,
    activeSessions: 0,
    revokedSessions: 0,
    blockedIPs: 0,
    blockedUsers: 0,
  },
  topIPs: [],
  topEventTypes: [],
  recentCritical: [],
};

const FACTOR_TONE: Record<string, string> = {
  good: "bg-[var(--success)]",
  warning: "bg-[var(--warn)]",
  critical: "bg-[var(--danger)]",
};

export default async function SecurityEventsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const severity = (one("severity") ?? "") as Severity | "";
  const type = one("type") ?? "";
  const q = one("q") ?? "";
  const page = Math.max(1, Number(one("page")) || 1);

  /* The live ledger and the live posture, read side by side. The posture is
     a second door: if it is the one that failed, the events still stand, and
     an operator is better served by "not measured" than by a zero that looks
     like a measurement. */
  const [load, measured] = await Promise.all([
    readSecurityEvents({ severity, type, q, page }),
    fetchSecurityScore(),
  ]);
  const now = new Date().toISOString();
  const score: SecurityScore = measured ?? UNMEASURED;
  /* The kinds an operator can filter by: the ones this page actually shows,
     topped up with the platform's own ranking of kinds so the list is not
     limited to whatever the current filter happens to return. */
  const eventTypes = Array.from(
    new Set([
      ...(load.status === "ready" ? load.data.items.map((e) => e.eventType) : []),
      ...score.topEventTypes.map((t) => t.type),
    ]),
  ).sort();

  const href = (over: Record<string, string | number>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries({ severity, type, q, page, ...over })) {
      if (value === "" || Number(value) === 1) continue;
      search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
  };

  return (
    <>
      <PageHeader
        title="Security events"
        description="Every anomaly the platform noticed, and the posture score that is those events read as one number."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel title="Posture">
          <div className="flex items-end gap-3">
            <p className="text-[46px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-[var(--fg)]">
              {measured ? score.score : "—"}
            </p>
            <Pill
              tone={
                !measured
                  ? "muted"
                  : score.threatLevel === "low"
                    ? "success"
                    : score.threatLevel === "medium"
                      ? "warn"
                      : "danger"
              }
            >
              <ShieldCheck size={12} aria-hidden />
              {measured ? `${score.threatLevel} threat` : "not measured"}
            </Pill>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {!measured ? (
              <li className="text-[12px] leading-snug text-[var(--muted)]">
                The posture query did not answer, so nothing here is a score. The event list
                below is the ledger itself and stands on its own.
              </li>
            ) : null}
            {score.factors.map((f) => (
              <li key={f.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="truncate text-[13px] text-[var(--text-2)]">{f.name}</span>
                <span className="text-[12px] tabular-nums text-[var(--muted)]">
                  {f.score}/{f.maxScore}
                </span>
                <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded-full ${FACTOR_TONE[f.status] ?? FACTOR_TONE.good}`}
                    style={{ width: `${Math.round((f.score / Math.max(1, f.maxScore)) * 100)}%` }}
                  />
                </div>
                <span className="col-span-2 text-[11px] leading-snug text-[var(--muted)]">
                  {f.description}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric label="Accounts" value={score.stats.totalUsers} />
            <Metric
              label="With 2FA"
              value={score.stats.usersWith2FA}
              hint={`${Math.round((score.stats.usersWith2FA / Math.max(1, score.stats.totalUsers)) * 100)}% of people`}
              tone="warn"
            />
            <Metric
              label="Live sessions"
              value={score.stats.activeSessions}
              hint={`${score.stats.revokedSessions} revoked`}
            />
            <Metric label="Blocked IPs" value={score.stats.blockedIPs} />
            <Metric label="Blocked people" value={score.stats.blockedUsers} tone="danger" />
            <Metric
              label="Critical rows"
              value={score.recentCritical.length}
              hint="in the recent window"
              tone={score.recentCritical.length > 0 ? "danger" : "success"}
            />
          </div>

          <Panel title="Where it is coming from" flush hint="Ranked by event volume, not by severity.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "ip", label: "Address" },
                  { key: "count", label: "Events", align: "right" },
                  { key: "seen", label: "Last seen", align: "right", hideBelow: "sm" },
                ]}
                rows={score.topIPs.map((ip) => ({
                  ip: <code className="text-[12px]">{ip.ip}</code>,
                  count: ip.count,
                  seen: ago(ip.lastSeen, now),
                }))}
                empty="No address has produced an event."
              />
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <form action="/admin/security-events" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Search events</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Event id, address or account"
            className="h-9 min-w-[14rem] flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="sr-only">Severity</span>
          <select
            name="severity"
            defaultValue={severity}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Any severity</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="sr-only">Type</span>
          <select
            name="type"
            defaultValue={type}
            className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Any event</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {q || severity || type ? (
            <a href="/admin/security-events" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState load={load} rows={8} empty="No event matches — a quiet log is the best kind until you suspect the probe is the quiet thing." />

      {load.status !== "ready" ? null : (
        <Panel flush>
          <div className="px-4 py-1">
            <DataTable
              columns={[
                { key: "type", label: "Event" },
                { key: "severity", label: "Severity", hideBelow: "sm" },
                { key: "account", label: "Account", hideBelow: "md" },
                { key: "ip", label: "Address", hideBelow: "lg" },
                { key: "when", label: "When", align: "right" },
              ]}
              rows={load.data.items.map((e) => ({
                type: <code className="text-[12px] text-[var(--fg)]">{e.eventType}</code>,
                severity: <Pill tone={SEVERITY_TONE[e.severity]}>{e.severity}</Pill>,
                account: e.userId ? (
                  <Link
                    href={`/admin/people/${e.userId}`}
                    className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                  >
                    {e.userId}
                  </Link>
                ) : (
                  <span className="text-[12px] text-[var(--muted)]">pre-account</span>
                ),
                ip: <code className="text-[12px]">{e.ipAddress ?? "—"}</code>,
                when: <span title={dateTime(e.createdAt)}>{ago(e.createdAt, now)}</span>,
              }))}
              empty="No event matches this filter."
            />
          </div>

          <nav
            aria-label="Pagination"
            className="flex items-center justify-between gap-3 border-t border-[var(--divider)] px-4 py-3"
          >
            <p className="text-[12px] tabular-nums text-[var(--muted)]">
              {(load.data.page - 1) * load.data.perPage + 1}–
              {Math.min(load.data.page * load.data.perPage, load.data.total)} of{" "}
              {load.data.total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              {load.data.page > 1 ? (
                <Link href={href({ page: load.data.page - 1 })} className="btn btn-secondary btn-sm">
                  Previous
                </Link>
              ) : null}
              {load.data.page * load.data.perPage < load.data.total ? (
                <Link href={href({ page: load.data.page + 1 })} className="btn btn-secondary btn-sm">
                  Next
                </Link>
              ) : null}
            </div>
          </nav>
        </Panel>
      )}
    </>
  );
}
