import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiGet, apiSend, apiPut, errorMessage } from "@/lib/api";
import { Card, Stat, Badge, DataTable, State } from "@/components/primitives";
import { CopyId } from "@/components/copy-id";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

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
    blockedIPs?: number;
    blockedUsers?: number;
  };
};

type Block = {
  targetType?: string;
  targetId?: string;
  reason?: string | null;
  blockedBy?: string | null;
  isActive?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
};

type BlocksPayload = { items?: Block[]; total?: number };

type Event = {
  id?: string;
  eventType?: string;
  kind?: string;
  title?: string | null;
  detail?: string | null;
  severity?: string | null;
  ipAddress?: string | null;
  userId?: string | null;
  account?: { id?: string; email?: string } | null;
  user?: { id?: string; email?: string } | null;
  createdAt?: string;
};

type EventsPayload = {
  events?: Event[];
  total?: number;
  stats?: {
    today?: { total?: number; critical?: number };
    week?: { total?: number; critical?: number };
    month?: { total?: number; critical?: number };
    total?: number;
    activeBlocks?: number;
  };
};

type Appeal = {
  id?: string;
  decision?: string;
  note?: string;
  createdAt?: string;
  decidedAt?: string | null;
  user?: { id?: string; email?: string; name?: string | null } | null;
  restriction?: {
    id?: string;
    title?: string;
    severity?: string;
    endsAt?: string | null;
  } | null;
};

type AppealsPayload = { appeals?: Appeal[]; total?: number; pending?: number };

const SEVERITIES = ["", "info", "warning", "error", "critical"];
const BLOCK_TYPES = ["", "ip", "user", "email"];
const APPEAL_DECISIONS = ["", "pending", "upheld", "overturned"];
const EVENT_SIZES = [50, 100, 200];

async function unblock(formData: FormData) {
  "use server";
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const back = String(formData.get("back") ?? "/admin/security");

  if (!targetType || !targetId) {
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=missing-target`);
  }

  const res = await apiSend<{ ok?: boolean }>(
    `/admin/security/blocks/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`,
    { method: "DELETE" },
  );
  revalidatePath("/admin/security");
  redirect(
    `${back}${back.includes("?") ? "&" : "?"}${
      res.ok ? `removed=${encodeURIComponent(targetId)}` : "error=unblock-failed"
    }`,
  );
}

async function decideAppeal(formData: FormData) {
  "use server";
  const appealId = String(formData.get("appealId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const back = String(formData.get("back") ?? "/admin/security");

  if (!appealId || (decision !== "upheld" && decision !== "overturned")) {
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=bad-decision`);
  }

  const res = await apiPut<{ ok?: boolean }>("/admin/appeals", {
    id: appealId,
    decision,
  });
  revalidatePath("/admin/security");
  redirect(
    `${back}${back.includes("?") ? "&" : "?"}${
      res.ok ? `decided=${encodeURIComponent(appealId)}` : "error=appeal-failed"
    }`,
  );
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    q?: string;
    all?: string;
    severity?: string;
    eventType?: string;
    ip?: string;
    id?: string;
    page?: string;
    limit?: string;
    appealDecision?: string;
    appealQ?: string;
    removed?: string;
    decided?: string;
    error?: string;
  }>;
}) {
  const sp = await searchParams;
  const targetType = BLOCK_TYPES.includes(sp.type ?? "") ? (sp.type as string) : "";
  const blockQuery = (sp.q ?? "").trim();
  const showAll = sp.all === "1";
  const severity = SEVERITIES.includes(sp.severity ?? "") ? (sp.severity as string) : "";
  const eventType = (sp.eventType ?? "").trim();
  const eventIp = (sp.ip ?? "").trim();
  const eventId = (sp.id ?? "").trim();
  const appealDecision = APPEAL_DECISIONS.includes(sp.appealDecision ?? "")
    ? (sp.appealDecision as string)
    : "";
  const appealQ = (sp.appealQ ?? "").trim();
  const rawLimit = Number(sp.limit);
  const eventLimit = EVENT_SIZES.includes(rawLimit) ? rawLimit : 50;
  const eventPage = Math.max(1, Number(sp.page) || 1);

  // Every filter this page understands — one source for return links, so an
  // unblock or a decided appeal lands back on the same filtered view.
  const all: Record<string, string> = {
    ...(targetType ? { type: targetType } : {}),
    ...(blockQuery ? { q: blockQuery } : {}),
    ...(showAll ? { all: "1" } : {}),
    ...(severity ? { severity } : {}),
    ...(eventType ? { eventType } : {}),
    ...(eventIp ? { ip: eventIp } : {}),
    ...(eventId ? { id: eventId } : {}),
    ...(appealDecision ? { appealDecision } : {}),
    ...(appealQ ? { appealQ } : {}),
    limit: String(eventLimit),
    page: String(eventPage),
  };
  /** Hidden mirrors of every filter a form does not own, so submitting it
      keeps the rest of the page's state (pagination resets on purpose). */
  const hiddenInputs = (own: string[]) =>
    Object.entries(all)
      .filter(([k]) => !own.includes(k) && k !== "page")
      .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);

  const blockBack = `/admin/security${new URLSearchParams(all)}`;

  const blockParams = new URLSearchParams({ limit: "100" });
  if (targetType) blockParams.set("targetType", targetType);
  if (blockQuery) blockParams.set("q", blockQuery);
  if (!showAll) blockParams.set("activeOnly", "true");

  const eventParams = new URLSearchParams({
    limit: String(eventLimit),
    page: String(eventPage),
  });
  if (severity) eventParams.set("severity", severity);
  if (eventType) eventParams.set("eventType", eventType);
  if (eventIp) eventParams.set("ip", eventIp);
  if (eventId) eventParams.set("id", eventId);

  const appealParams = new URLSearchParams({ limit: "50" });
  if (appealDecision) appealParams.set("decision", appealDecision);
  if (appealQ) appealParams.set("q", appealQ);

  const eventHref = (p: number) =>
    `/admin/security${new URLSearchParams({ ...all, page: String(p) })}`;

  const [scoreRes, blocksRes, eventsRes, appealsRes] = await Promise.all([
    apiGet<Score>("/admin/security/score"),
    apiGet<BlocksPayload>(`/admin/security/blocks?${blockParams}`),
    apiGet<EventsPayload>(`/admin/security/events?${eventParams}`),
    apiGet<AppealsPayload>(`/admin/appeals?${appealParams}`),
  ]);

  if (!scoreRes.ok) return <Failure result={scoreRes} what="the security score" />;

  const s = scoreRes.data ?? {};
  const threat = s.threatLevel ?? "low";
  const stats = s.stats ?? {};
  const blocks = blocksRes.data?.items ?? [];
  const blocksTotal = blocksRes.data?.total ?? blocks.length;
  const eventsData = eventsRes.data ?? {};
  const events = eventsData.events ?? [];
  const eventStats = eventsData.stats ?? {};
  const eventPages = Math.max(1, Math.ceil((eventsData.total ?? 0) / eventLimit));
  const appealsData = appealsRes.data ?? {};
  const appeals = appealsData.appeals ?? [];

  return (
    <div className="flex flex-col gap-5">
      {sp.removed ? (
        <p
          role="status"
          className="rounded-[10px] border border-[var(--tb-ok)] bg-[var(--tb-ok-soft)] px-3.5 py-2.5 text-[13px] text-[var(--tb-ok)]"
        >
          {sp.removed} was removed from the blocklist and the removal was written to the audit trail.
        </p>
      ) : null}
      {sp.decided ? (
        <p
          role="status"
          className="rounded-[10px] border border-[var(--tb-ok)] bg-[var(--tb-ok-soft)] px-3.5 py-2.5 text-[13px] text-[var(--tb-ok)]"
        >
          Appeal decided — the account was notified with its reference id, and the answer is written to the audit trail.
        </p>
      ) : null}
      {sp.error ? (
        <p
          role="alert"
          className="rounded-[10px] border border-[var(--tb-danger)] bg-[var(--tb-danger-soft)] px-3.5 py-2.5 text-[13px] text-[var(--tb-danger)]"
        >
          {sp.error === "appeal-failed"
            ? "The API refused that decision. The appeal is unchanged."
            : sp.error === "bad-decision"
              ? "That was not a valid decision."
              : "The API refused that change. Nothing was removed."}
        </p>
      ) : null}

      <section aria-label="Security posture" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          label="Events today"
          value={eventStats.today?.total ?? 0}
          hint={`${eventStats.today?.critical ?? 0} critical · ${eventStats.month?.total ?? 0} this month`}
          tone={(eventStats.today?.critical ?? 0) > 0 ? "danger" : "default"}
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
            Standing: <Badge tone={factorTone(f.status)}>{f.status ?? "unknown"}</Badge>,
            Why: <span className="text-[var(--tb-text-muted)]">{f.description ?? "—"}</span>,
          }))}
        />
      </Card>

      <Card
        title="Blocklist"
        description={`${blocksTotal} entr${blocksTotal === 1 ? "y" : "ies"}${showAll ? "" : " currently in force"}. Unblock is a DELETE and writes a security.block_removed audit event.`}
      >
        <form action="/admin/security" method="get" className="mb-4 flex flex-wrap gap-2">
          {hiddenInputs(["q", "type", "all"])}
          <label htmlFor="q" className="sr-only">
            Search blocks
          </label>
          <input
            id="q"
            name="q"
            defaultValue={blockQuery}
            placeholder="Address, email, account id or reason"
            className="w-full max-w-sm rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="type" className="sr-only">
            Target type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={targetType}
            className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          >
            <option value="">Any target</option>
            <option value="ip">IP</option>
            <option value="user">Account</option>
            <option value="email">Email</option>
          </select>
          <label className="flex items-center gap-2 rounded-[10px] border border-[var(--tb-border)] px-3 py-2 text-[13px]">
            <input type="checkbox" name="all" value="1" defaultChecked={showAll} className="accent-[var(--tb-accent)]" />
            Include expired
          </label>
          <button
            type="submit"
            className="rounded-[10px] bg-[var(--tb-accent-solid)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Apply
          </button>
        </form>

        <DataTable
          columns={["Type", "Target", "Reason", "Blocked", "Expires", "Since", ""]}
          empty={blocksRes.ok ? (blockQuery ? `Nothing matches “${blockQuery}”.` : "Nothing is blocked.") : errorMessage(blocksRes)}
          rows={blocks.map((b) => ({
            Type: <Badge tone={b.isActive === false ? "muted" : "danger"}>{b.targetType ?? "—"}</Badge>,
            Target: <span className="font-mono text-[12px]">{b.targetId ?? "—"}</span>,
            Reason: b.reason ?? "—",
            Blocked: b.blockedBy ? (
              <span className="font-mono text-[11px]">{b.blockedBy.slice(0, 8)}</span>
            ) : (
              "—"
            ),
            Expires: b.expiresAt ? (
              <span title={dateTime(b.expiresAt)}>{ago(b.expiresAt)}</span>
            ) : b.isActive === false ? (
              <span className="text-[var(--tb-text-muted)]">expired</span>
            ) : (
              "never"
            ),
            Since: b.createdAt ? ago(b.createdAt) : "—",
            "": b.targetType && b.targetId ? (
              <form action={unblock}>
                <input type="hidden" name="targetType" value={b.targetType} />
                <input type="hidden" name="targetId" value={b.targetId} />
                <input type="hidden" name="back" value={blockBack} />
                <button
                  type="submit"
                  className="rounded-[8px] border border-[var(--tb-border)] px-2 py-1 text-[12px] text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-danger)]"
                >
                  Unblock
                </button>
              </form>
            ) : (
              "—"
            ),
          }))}
        />
        <p className="mt-3 text-[12px] text-[var(--tb-text-muted)]">
          Adding a block: POST /api/admin/security/blocks takes targetType (ip, user or email), targetId, a reason and optional hours. Every block writes a security.block_created audit event — there is deliberately no one-field form for it here.
        </p>
      </Card>

      <Card
        title="Security events"
        description={`${eventsData.total ?? 0} match. Showing ${events.length}.`}
      >
        <form action="/admin/security" method="get" className="mb-4 flex flex-wrap gap-2">
          {hiddenInputs(["severity", "eventType", "ip", "id", "limit"])}
          <label htmlFor="eventId" className="sr-only">
            Event ID
          </label>
          <input
            id="eventId"
            name="id"
            defaultValue={eventId}
            placeholder="Event ID — exact"
            className="w-56 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 font-mono text-[13px] outline-none placeholder:font-sans placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="severity" className="sr-only">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            defaultValue={severity}
            className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          >
            <option value="">Any severity</option>
            {SEVERITIES.slice(1).map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
          <label htmlFor="eventType" className="sr-only">
            Event type
          </label>
          <input
            id="eventType"
            name="eventType"
            defaultValue={eventType}
            placeholder="Event type, e.g. login_failed"
            className="w-full max-w-xs rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="ip" className="sr-only">
            IP
          </label>
          <input
            id="ip"
            name="ip"
            defaultValue={eventIp}
            placeholder="Filter by IP, e.g. 203.0.113"
            className="w-full max-w-[14rem] rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 font-mono text-[13px] outline-none placeholder:font-sans placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="limit" className="sr-only">
            Rows per page
          </label>
          <select
            id="limit"
            name="limit"
            defaultValue={String(eventLimit)}
            className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          >
            {EVENT_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-[10px] bg-[var(--tb-accent-solid)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Apply
          </button>
        </form>

        {eventsRes.ok ? null : <State tone="warn" title={errorMessage(eventsRes)} />}

        <DataTable
          columns={["Event ID", "When", "Type", "What", "Severity", "IP", "Account"]}
          empty="No security events match."
          rows={events.map((e) => {
            const accountId = e.userId ?? e.account?.id ?? e.user?.id ?? null;
            const accountEmail = e.account?.email ?? e.user?.email ?? null;
            return {
              "Event ID": <CopyId value={e.id} />,
              When: <span title={dateTime(e.createdAt)}>{ago(e.createdAt)}</span>,
              Type: <span className="font-mono text-[12px]">{e.eventType ?? e.kind ?? "—"}</span>,
              What: e.title ?? e.detail ?? "—",
              Severity: e.severity ? <Badge tone={severityTone(e.severity)}>{e.severity}</Badge> : "—",
              IP: e.ipAddress ?? "—",
              Account: accountId ? (
                accountEmail ? (
                  <span className="font-mono text-[12px]">{accountEmail}</span>
                ) : (
                  <span className="font-mono text-[11px]">{accountId.slice(0, 8)}</span>
                )
              ) : (
                <span className="text-[var(--tb-text-muted)]">anonymous</span>
              ),
            };
          })}
        />

        {eventPages > 1 ? (
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-[13px]">
            {eventPage > 1 ? (
              <a href={eventHref(eventPage - 1)} className="rounded-[10px] border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]">
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <span className="text-[var(--tb-text-muted)]">
              Page {eventPage} of {eventPages}
            </span>
            {eventPage < eventPages ? (
              <a href={eventHref(eventPage + 1)} className="rounded-[10px] border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]">
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Card>

      <Card
        title="Appeals"
        description={
          appealsRes.ok
            ? `${appealsData.pending ?? 0} waiting · ${appealsData.total ?? appeals.length} on record. One answer per appeal; overturning lifts the strike it argues with.`
            : "Reviews filed against a restriction on an account."
        }
        action={
          <form action="/admin/security" method="get" className="flex flex-wrap gap-2">
            {hiddenInputs(["appealQ", "appealDecision"])}
            <label htmlFor="appealQ" className="sr-only">
              Search appeals
            </label>
            <input
              id="appealQ"
              name="appealQ"
              defaultValue={appealQ}
              placeholder="Account, appeal id or note…"
              className="w-52 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <label htmlFor="appealDecision" className="sr-only">
              Decision
            </label>
            <select
              id="appealDecision"
              name="appealDecision"
              defaultValue={appealDecision}
              className="rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none focus:border-[var(--tb-accent)]"
            >
              <option value="">Any decision</option>
              <option value="pending">Waiting</option>
              <option value="overturned">Overturned</option>
              <option value="upheld">Upheld</option>
            </select>
            <button
              type="submit"
              className="rounded-[10px] bg-[var(--tb-accent-solid)] px-3 py-1.5 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
            >
              Apply
            </button>
          </form>
        }
      >
        {appealsRes.ok ? null : <State tone="warn" title={errorMessage(appealsRes)} />}

        <DataTable
          columns={["Appeal ID", "Filed", "Account", "Decision", "Decision appealed", "Note", ""]}
          empty={
            appealsRes.ok
              ? appealDecision || appealQ
                ? "No appeal matches."
                : "No appeal has been filed."
              : "The appeals list could not be read."
          }
          rows={appeals.map((a) => {
            const waiting = !a.decision || a.decision === "pending";
            return {
              "Appeal ID": <CopyId value={a.id} />,
              Filed: <span title={dateTime(a.createdAt)}>{ago(a.createdAt)}</span>,
              Account: a.user?.email ? (
                <span className="font-mono text-[12px]" title={a.user.id}>
                  {a.user.email}
                </span>
              ) : (
                <span className="font-mono text-[11px]">{a.user?.id?.slice(0, 8) ?? "—"}</span>
              ),
              Decision: a.decision ? (
                <Badge tone={a.decision === "overturned" ? "ok" : a.decision === "upheld" ? "warn" : "accent"}>
                  {a.decision}
                </Badge>
              ) : (
                <Badge tone="accent">pending</Badge>
              ),
              "Decision appealed": a.restriction ? (
                <span>
                  <span className="font-medium">{a.restriction.title}</span>
                  <span className="block text-[12px] text-[var(--tb-text-muted)]">
                    {a.restriction.severity ?? "—"}
                    {a.restriction.endsAt ? ` · until ${dateTime(a.restriction.endsAt)}` : ""}
                  </span>
                </span>
              ) : (
                "—"
              ),
              Note: (
                <span className="line-clamp-2" title={a.note}>
                  {a.note ?? "—"}
                </span>
              ),
              "": waiting && a.id ? (
                <span className="flex items-center justify-end gap-1.5">
                  <form action={decideAppeal}>
                    <input type="hidden" name="appealId" value={a.id} />
                    <input type="hidden" name="decision" value="overturned" />
                    <input type="hidden" name="back" value={blockBack} />
                    <button
                      type="submit"
                      className="rounded-[8px] border border-[var(--tb-border)] px-2 py-1 text-[12px] text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-ok)]"
                    >
                      Overturn
                    </button>
                  </form>
                  <form action={decideAppeal}>
                    <input type="hidden" name="appealId" value={a.id} />
                    <input type="hidden" name="decision" value="upheld" />
                    <input type="hidden" name="back" value={blockBack} />
                    <button
                      type="submit"
                      className="rounded-[8px] border border-[var(--tb-border)] px-2 py-1 text-[12px] text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-danger)]"
                    >
                      Uphold
                    </button>
                  </form>
                </span>
              ) : a.decidedAt ? (
                <span
                  className="text-right text-[12px] text-[var(--tb-text-muted)]"
                  title={dateTime(a.decidedAt)}
                >
                  decided {ago(a.decidedAt)}
                </span>
              ) : (
                <span />
              ),
            };
          })}
        />
        <p className="mt-3 text-[12px] text-[var(--tb-text-muted)]">
          Overturning sets the strike&apos;s endsAt to now and notifies the account with the appeal id as its reference — paste that id here, in Audit trail or in Messaging to see every side of it. A suspended account also needs its status restored under People.
        </p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Recent critical events" description="Last 30 days.">
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
  );
}

const THREAT_TONE = {
  low: "ok",
  medium: "warn",
  high: "danger",
  critical: "danger",
} as const;

function factorTone(status: Factor["status"]) {
  return status === "good" ? "ok" : status === "warning" ? "warn" : "danger";
}

function severityTone(s: string) {
  return s === "critical" || s === "error"
    ? ("danger" as const)
    : s === "warning"
      ? ("warn" as const)
      : ("muted" as const);
}
