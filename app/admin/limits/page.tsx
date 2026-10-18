import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";
import { Card, Stat, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { ago, duration } from "@/lib/format";

type Metric = { count?: number; blocked?: number; lastSeen?: number };
type RatePayload = {
  metrics?: {
    totalHits?: number;
    totalBlocked?: number;
    totalBypassed?: number;
    blockRate?: number;
    bypassRate?: number;
    windowStart?: number;
    windowDuration?: number;
    topIps?: Array<Metric & { ip: string }>;
    topRoutes?: Array<Metric & { route: string }>;
  };
  config?: {
    routeLimits?: Record<string, number>;
    rateLimitEnabled?: boolean;
    rateLimitPerMinute?: number;
    adminRoleMultipliers?: Record<string, number>;
    blockRateAlertThreshold?: number;
    blockRateAlertEnabled?: boolean;
  };
  alerts?: {
    recentAlerts?: Array<{ timestamp: number; blockRate: number; threshold: number; message: string }>;
    alertTriggered?: boolean;
  };
};

type Limit = {
  method?: string;
  max?: number;
  windowMs?: number;
  updatedAt?: string;
};

const KNOWN_METHODS = ["email_otp", "sms_otp", "email_verify", "password_reset", "signup_otp"];

async function saveLimit(formData: FormData) {
  "use server";
  const method = String(formData.get("method") ?? "").trim();
  const max = Number(formData.get("max"));
  const windowMinutes = Number(formData.get("windowMinutes"));

  if (!method) redirect("/admin/limits?error=method-required");

  const body: Record<string, unknown> = { method };
  if (Number.isFinite(max)) body.max = max;
  if (Number.isFinite(windowMinutes) && windowMinutes > 0) {
    body.windowMs = Math.round(windowMinutes * 60_000);
  }

  const res = await apiPut("/admin/verification-limits", body);
  revalidatePath("/admin/limits");
  redirect(
    `/admin/limits?${res.ok ? `saved=${encodeURIComponent(method)}` : "error=rejected"}`,
  );
}

export default async function LimitsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [rateRes, limitsRes] = await Promise.all([
    apiGet<RatePayload>("/admin/rate-limits"),
    apiGet<{ limits?: Limit[] }>("/admin/verification-limits"),
  ]);

  if (!rateRes.ok) return <Failure result={rateRes} what="the rate limiter metrics" />;

  const m = rateRes.data?.metrics ?? {};
  const c = rateRes.data?.config ?? {};
  const alerts = rateRes.data?.alerts ?? {};
  const windowStart = m.windowStart ?? 0;
  const windowEnd = windowStart + (m.windowDuration ?? 0);
  const measuring = windowStart > 0 && (m.totalHits ?? 0) > 0;

  const limits = limitsRes.data?.limits ?? [];
  const configured = new Map(limits.map((l) => [l.method ?? "", l]));
  const missing = KNOWN_METHODS.filter((method) => !configured.has(method));

  return (
    <div className="flex flex-col gap-5">
      {sp.saved ? (
        <p
          role="status"
          className="rounded-[10px] border border-[var(--tb-ok)] bg-[var(--tb-ok-soft)] px-3.5 py-2.5 text-[13px] text-[var(--tb-ok)]"
        >
          {sp.saved} was saved and the table below was re-read from the API.
        </p>
      ) : null}
      {sp.error ? (
        <p
          role="alert"
          className="rounded-[10px] border border-[var(--tb-danger)] bg-[var(--tb-danger-soft)] px-3.5 py-2.5 text-[13px] text-[var(--tb-danger)]"
        >
          The API refused that change. Nothing was written.
        </p>
      ) : null}

      <section aria-label="Rate limiting" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Blocked"
          value={m.totalBlocked ?? 0}
          hint={`${m.blockRate ?? 0}% of ${m.totalHits ?? 0} requests in the window`}
          tone={(m.totalBlocked ?? 0) > 0 ? "danger" : "default"}
        />
        <Stat
          label="Bypassed"
          value={m.totalBypassed ?? 0}
          hint={`${m.bypassRate ?? 0}% allowed past the limiter by role`}
        />
        <Stat
          label="Budget"
          value={`${c.rateLimitPerMinute ?? "—"}/min`}
          hint={c.rateLimitEnabled === false ? "Limiter disabled" : "Per address, before role multipliers"}
        />
        <Stat
          label="Block-rate alert"
          value={
            <Badge tone={alerts.alertTriggered ? "danger" : "ok"}>
              {alerts.alertTriggered ? "latched" : "clear"}
            </Badge>
          }
          hint={
            c.blockRateAlertEnabled === false
              ? "Watcher disabled"
              : `Fires above ${c.blockRateAlertThreshold ?? "—"}%`
          }
        />
      </section>

      {!measuring ? (
        <State
          title="The metrics window is empty"
          body={`These counters live in the API process and reset on restart${
            windowStart ? ` — the current window opened ${ago(new Date(windowStart))}` : ""
          }. An empty window is not evidence of no traffic.`}
        />
      ) : (
        <p className="text-[12px] text-[var(--tb-text-muted)]">
          Window {ago(new Date(windowStart))} ·{" "}
          {windowEnd ? `closes ${ago(new Date(windowEnd))}` : "length unreported"} ·{" "}
          {duration((m.windowDuration ?? 0) / 1000)}
        </p>
      )}

      {(alerts.recentAlerts ?? []).length > 0 ? (
        <Card title="Alerts" description="Raised by the block-rate watcher on its own.">
          <DataTable
            columns={["When", "Block rate", "Threshold", "Message"]}
            empty="No alerts."
            rows={(alerts.recentAlerts ?? []).map((a) => ({
              When: ago(new Date(a.timestamp)),
              "Block rate": `${a.blockRate}%`,
              Threshold: `${a.threshold}%`,
              Message: a.message,
            }))}
          />
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Busiest addresses" description="By request count in the window.">
          <DataTable
            columns={["IP", "Requests", "Blocked", "Last seen"]}
            empty="No addresses have hit the limiter this window."
            rows={(m.topIps ?? []).map((i) => ({
              IP: <span className="font-mono text-[12px]">{i.ip}</span>,
              Requests: i.count ?? 0,
              Blocked: i.blocked ?? 0,
              "Last seen": i.lastSeen ? ago(new Date(i.lastSeen)) : "—",
            }))}
          />
        </Card>
        <Card title="Busiest routes" description="By request count in the window.">
          <DataTable
            columns={["Route", "Requests", "Blocked", "Last seen"]}
            empty="No routes have hit the limiter this window."
            rows={(m.topRoutes ?? []).map((r) => ({
              Route: <span className="font-mono text-[12px]">{r.route}</span>,
              Requests: r.count ?? 0,
              Blocked: r.blocked ?? 0,
              "Last seen": r.lastSeen ? ago(new Date(r.lastSeen)) : "—",
            }))}
          />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Route budgets" description="Compiled into the limiter.">
          <DataTable
            columns={["Route", "Per window"]}
            empty="No per-route budgets are compiled in."
            rows={Object.entries(c.routeLimits ?? {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([route, limit]) => ({
                Route: <span className="font-mono text-[12px]">{route}</span>,
                "Per window": limit,
              }))}
          />
        </Card>
        <Card title="Role multipliers" description="What an administrator's own traffic is scaled by.">
          <DataTable
            columns={["Role", "Multiplier"]}
            empty="No role multipliers are configured."
            rows={Object.entries(c.adminRoleMultipliers ?? {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([role, mult]) => ({
                Role: <Badge tone="accent">{role}</Badge>,
                Multiplier: `×${mult}`,
              }))}
          />
        </Card>
      </div>

      <Card
        title="Verification limits"
        description="How many codes of each kind may be issued, and over what window. An upsert: the method is the key."
      >
        {limitsRes.ok ? null : <State tone="warn" title="The verification limits could not be read." />}

        <DataTable
          columns={["Method", "Max", "Window", "Last updated"]}
          empty="No verification method has a configured limit — the API is running on compiled-in defaults."
          rows={limits.map((l) => ({
            Method: <span className="font-mono text-[12px]">{l.method ?? "—"}</span>,
            Max: l.max ?? "—",
            Window: typeof l.windowMs === "number" ? `${Math.round(l.windowMs / 60000)} min` : "—",
            "Last updated": l.updatedAt ?? "—",
          }))}
        />

        {missing.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-[12px] text-[var(--tb-text-muted)]">
              Not configured — these send on the API&apos;s built-in default:
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {missing.map((method) => (
                <li key={method}>
                  <Badge tone="warn">{method}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <form action={saveLimit} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--tb-border)] pt-4">
          <div>
            <label htmlFor="method" className="block text-[12px] text-[var(--tb-text-muted)]">
              Method
            </label>
            <input
              id="method"
              name="method"
              list="known-methods"
              required
              placeholder="email_otp"
              className="mt-1 w-40 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <datalist id="known-methods">
              {KNOWN_METHODS.map((method) => (
                <option key={method} value={method} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="max" className="block text-[12px] text-[var(--tb-text-muted)]">
              Max
            </label>
            <input
              id="max"
              name="max"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={5}
              className="mt-1 w-24 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
            />
          </div>
          <div>
            <label htmlFor="windowMinutes" className="block text-[12px] text-[var(--tb-text-muted)]">
              Window (minutes)
            </label>
            <input
              id="windowMinutes"
              name="windowMinutes"
              type="number"
              min={1}
              step={1}
              defaultValue={15}
              className="mt-1 w-32 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
            />
          </div>
          <button
            type="submit"
            className="rounded-[10px] bg-[var(--tb-accent-solid)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Save limit
          </button>
        </form>
      </Card>
    </div>
  );
}
