import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readLedger, readPosture, type SecurityEvent, type Severity } from "@/lib/security";
import { ago, dateTime, device } from "@/lib/format";

/* What the platform noticed, and how much of it it can actually stand behind.
 *
 * This screen used to lead with a number out of 100. Three of the five things
 * inside that number were constants in the route — "Password Policy: 18,
 * // Assuming strong password policy" — so the headline was mostly an
 * assumption wearing a decimal, and the plate below it printed zeros as if a
 * query had returned them whenever the read failed.
 *
 * What is here instead is the ledger and its real volume, the one factor that
 * is a ratio of two counts, and a plainly-labelled list of what this build
 * cannot measure. An operator can act on that. On a 83 they could only be
 * soothed.
 */

type Params = Record<string, string | string[] | undefined>;

const SEVERITIES: Severity[] = ["critical", "error", "warning", "info"];

const SEVERITY_TONE: Record<Severity, "muted" | "warn" | "danger"> = {
  info: "muted",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

const SEVERITY_WORD: Record<Severity, string> = {
  info: "info",
  warning: "warning",
  error: "error",
  critical: "critical",
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
  const severity = (one("severity") ?? "") as "" | Severity;
  const kind = one("kind") ?? "";
  const q = one("q") ?? "";
  const from = one("from") ?? "";
  const page = Math.max(1, Number(one("page") ?? 1) || 1);

  const [ledger, posture] = await Promise.all([
    readLedger({ severity, kind, q, from, page }),
    readPosture(),
  ]);

  const shown = ledger.status === "ready" ? ledger.data : null;
  const stats = shown?.stats ?? null;
  const view = posture.status === "ready" ? posture.data : null;
  const kinds = posture.status === "ready" ? posture.data.eventKinds : [];
  const filtered = !!(severity || kind || q || from);

  const field =
    "h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <>
      <PageHeader
        title="Security events"
        description="Every anomaly the platform wrote down, newest first. A row is a fact the API recorded at the time — not a conclusion drawn about it afterwards."
        actions={
          <Link href="/admin/activity" className="btn btn-quiet btn-sm">
            Whole activity log
          </Link>
        }
      />

      {/* Volume first: this is a log, and the first question about a log is how
          much of it there is and whether today is worse than the week. */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="Today"
            value={stats.today.total}
            hint={stats.today.serious ? `${stats.today.serious} serious` : "nothing serious"}
            tone={stats.today.serious > 0 ? "danger" : "default"}
          />
          <Metric label="This week" value={stats.week.total} hint={`${stats.week.serious} serious`} />
          <Metric label="This month" value={stats.month.total} hint={`${stats.month.serious} serious`} />
          <Metric
            label="Active blocks"
            value={stats.activeBlocks}
            hint={`${stats.lifetime} rows in the log`}
            tone={stats.activeBlocks > 0 ? "success" : "default"}
          />
        </div>
      ) : null}

      <Panel
        title="What this build measures"
        hint="A factor appears here only when a query produced it. The list beside it is everything the screen used to score anyway."
      >
        {posture.status === "error" ? (
          <div className="flex items-start gap-2.5 rounded-[10px] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3.5 py-3">
            <ShieldAlert size={15} aria-hidden className="mt-0.5 shrink-0 text-[var(--danger-text)]" />
            <p className="text-[13px] leading-relaxed text-[var(--fg)]">
              {posture.message} The ledger above is a separate read and is unaffected — this
              panel has no number to show, so it shows none.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col gap-4">
              {view?.measured.length ? (
                view.measured.map((factor) => (
                  <div key={factor.name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] font-semibold text-[var(--fg)]">{factor.name}</p>
                      <p className="text-[12px] tabular-nums text-[var(--text-2)]">
                        {factor.score} / {factor.maxScore}
                      </p>
                    </div>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"
                      role="img"
                      aria-label={`${factor.observed} percent`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, Math.min(100, factor.observed))}%`,
                          background: `var(--${factor.status === "good" ? "success" : factor.status === "warning" ? "warn" : "danger"})`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
                      {factor.detail} — {factor.observed}% observed
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-[var(--muted)]">No factor could be computed.</p>
              )}

              {view ? (
                <dl className="grid grid-cols-2 gap-x-4 border-t border-[var(--divider)] pt-3 text-[12px]">
                  {[
                    ["Accounts", view.counts.totalUsers],
                    ["With 2FA", view.counts.usersWith2FA],
                    ["Active sessions", view.counts.activeSessions],
                    ["Revoked sessions", view.counts.revokedSessions],
                    ["Blocked addresses", view.counts.blockedIPs],
                    ["Blocked accounts", view.counts.blockedUsers],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between gap-2 py-1">
                      <dt className="text-[var(--muted)]">{label}</dt>
                      <dd className="tabular-nums font-medium text-[var(--fg)]">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            <div className="rounded-[10px] bg-[var(--surface-2)] px-3.5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">
                Not measured
              </p>
              <ul className="mt-2.5 flex flex-col gap-2.5">
                {(view?.unmeasured ?? []).map((item) => (
                  <li key={item.name} className="min-w-0">
                    <p className="text-[12px] font-semibold text-[var(--fg)]">{item.name}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted)]">{item.why}</p>
                  </li>
                ))}
                {!view ? (
                  <li className="text-[12px] leading-relaxed text-[var(--muted)]">
                    Nothing drawn while the posture read is failing — see the notice above.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <form action="/admin/security-events" method="get" className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Search events</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Address, kind, account or reference code"
            className={`${field} min-w-[14rem] flex-1`}
          />
          <span className="sr-only">Severity</span>
          <select name="severity" defaultValue={severity} className={field}>
            <option value="">Any severity</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_WORD[s]}
              </option>
            ))}
          </select>
          <span className="sr-only">Kind</span>
          <select name="kind" defaultValue={kind} className={field}>
            <option value="">Any kind</option>
            {kinds.map((k) => (
              <option key={k.type} value={k.type}>
                {k.type} ({k.count})
              </option>
            ))}
          </select>
          <span className="sr-only">From</span>
          <input type="date" name="from" defaultValue={from} className={field} title="Only rows from this day" />
          <button type="submit" className="btn btn-primary btn-sm h-9">
            Apply
          </button>
          {filtered ? (
            <a href="/admin/security-events" className="btn btn-quiet btn-sm h-9">
              Reset
            </a>
          ) : null}
        </form>
      </Panel>

      <PageState
        load={ledger}
        rows={8}
        empty={
          filtered
            ? "No event matches this view. Widen the dates — a security log is rarely empty, it is usually filtered."
            : "The log holds nothing. That is either a very quiet platform or a write path that has stopped recording."
        }
      />

      {shown ? (
        <Panel
          flush
          title="The ledger"
          hint={`${shown.total} row${shown.total === 1 ? "" : "s"} match${shown.total === 1 ? "s" : ""} this view — ${shown.perPage} to a page.`}
          action={
            shown.page > 1 ? (
              <Link
                href={pageHref(params, shown.page - 1)}
                className="btn btn-quiet btn-sm"
              >
                Previous
              </Link>
            ) : null
          }
        >
          <div className="px-4 py-1">
            <DataTable
              columns={[
                { key: "event", label: "Event" },
                { key: "ref", label: "Reference", hideBelow: "md" },
                { key: "account", label: "Account", hideBelow: "md" },
                { key: "where", label: "Reached from", hideBelow: "lg", nowrap: true },
                { key: "severity", label: "Severity" },
                { key: "at", label: "When", align: "right", hideBelow: "sm", nowrap: true },
              ]}
              rows={shown.rows.map((row) => eventCells(row))}
              empty="No event matches this view."
            />
            {shown.rows.length === shown.perPage ? (
              <div className="flex justify-end border-t border-[var(--divider)] px-4 py-3">
                <Link href={pageHref(params, shown.page + 1)} className="btn btn-quiet btn-sm">
                  Next {shown.perPage}
                </Link>
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {view && view.busiestIPs.length ? (
        <Panel
          title={`Busiest addresses · last ${view.windowDays} days`}
          hint="Counted from the same log, so an address that appears here generated that many rows — including perfectly ordinary ones. It is a lead, not an accusation."
        >
          <ul className="flex flex-col divide-y divide-[var(--divider)]">
            {view.busiestIPs.map((entry) => (
              <li key={entry.ip} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <Link
                  href={`/admin/security-events?q=${encodeURIComponent(entry.ip)}`}
                  className="min-w-0 truncate font-mono text-[12px] tabular-nums text-[var(--text-2)] hover:text-[var(--accent-text)]"
                >
                  {entry.ip}
                </Link>
                <span className="flex shrink-0 items-center gap-3 text-[12px] text-[var(--muted)]">
                  {entry.lastSeen ? (
                    <span title={dateTime(entry.lastSeen)}>seen {ago(entry.lastSeen)}</span>
                  ) : (
                    <span>no timestamp</span>
                  )}
                  <span className="tabular-nums font-medium text-[var(--fg)]">{entry.count}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}

function eventCells(row: SecurityEvent) {
  return {
    event: (
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          {row.severity === "critical" || row.severity === "error" ? (
            <AlertTriangle
              size={13}
              aria-hidden
              className="shrink-0 text-[var(--danger-text)]"
            />
          ) : null}
          <span className="truncate font-medium text-[var(--fg)]">
            {row.title ?? row.kind}
          </span>
        </span>
        <span className="mt-0.5 truncate text-[11px] text-[var(--muted)]" title={row.detail ?? undefined}>
          {row.kind === row.title ? "security event" : row.kind}
          {row.detail ? ` · ${row.detail}` : ""}
        </span>
      </span>
    ),
    ref: row.ref ? (
      <Link
        href={`/admin/security-events?q=${encodeURIComponent(row.ref)}`}
        title="Filter the log by this reference"
        className="font-mono text-[12px] tabular-nums text-[var(--accent-text)] hover:underline"
      >
        {row.ref}
      </Link>
    ) : (
      <span className="text-[12px] text-[var(--text-4)]">no code</span>
    ),
    account: row.account ? (
      <Link
        href={`/admin/people/${row.account.id}`}
        className="text-[12px] text-[var(--accent-text)] hover:underline"
        title={row.account.email}
      >
        {row.account.username ?? row.account.name ?? row.account.email}
        {row.account.staff ? " · staff" : ""}
      </Link>
    ) : row.id ? (
      <span className="text-[12px] text-[var(--muted)]">no account on the row</span>
    ) : null,
    where: (
      <span
        className="flex min-w-0 max-w-[26ch] flex-col"
        title={[row.device, row.ip].filter(Boolean).join(" · ")}
      >
        <span className="truncate font-mono text-[12px] tabular-nums text-[var(--text-2)]">
          {row.ip ?? "address not recorded"}
        </span>
        {/* A user-agent string is 120 characters of which six are worth
            reading; the whole thing is in the row's title. */}
        <span className="truncate text-[11px] text-[var(--muted)]">
          {device(row.device) ?? "no device string"}
        </span>
      </span>
    ),
    severity: <Pill tone={SEVERITY_TONE[row.severity]}>{SEVERITY_WORD[row.severity]}</Pill>,
    at: (
      <span title={dateTime(row.at)} className="text-[12px] tabular-nums">
        {ago(row.at)}
      </span>
    ),
  };
}

/** Keep every filter while moving pages. */
function pageHref(params: Params, next: number): string {
  const search = new URLSearchParams();
  for (const key of ["severity", "kind", "q", "from"]) {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single) search.set(key, String(single));
  }
  search.set("page", String(next));
  return `/admin/security-events?${search.toString()}`;
}
