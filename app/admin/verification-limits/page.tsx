import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";
import { Card, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";

/* GET /api/admin/verification-limits returns { limits } — one row per method,
   each with the maximum and the window it applies over. PUT upserts one row
   by method, so the edit below is an upsert: a method that has never been
   configured can be configured from here. */

type Limit = {
  id?: string;
  method?: string;
  max?: number;
  windowMs?: number;
  createdAt?: string;
  updatedAt?: string;
};

async function save(formData: FormData) {
  "use server";
  const method = String(formData.get("method") ?? "").trim();
  const max = Number(formData.get("max"));
  const windowMinutes = Number(formData.get("windowMinutes"));

  if (!method) redirect("/admin/verification-limits?error=method-required");

  const body: Record<string, unknown> = { method };
  if (Number.isFinite(max)) body.max = max;
  if (Number.isFinite(windowMinutes) && windowMinutes > 0) {
    body.windowMs = Math.round(windowMinutes * 60_000);
  }

  const res = await apiPut("/admin/verification-limits", body);
  revalidatePath("/admin/verification-limits");
  redirect(
    `/admin/verification-limits?${res.ok ? `saved=${encodeURIComponent(method)}` : "error=rejected"}`,
  );
}

const KNOWN = ["email_otp", "sms_otp", "email_verify", "password_reset", "signup_otp"];

export default async function VerificationLimitsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const res = await apiGet<{ limits?: Limit[] }>("/admin/verification-limits");

  if (!res.ok) return <Failure result={res} what="the verification limits" />;

  const limits = res.data?.limits ?? [];
  const configured = new Map(limits.map((l) => [l.method ?? "", l]));
  const missing = KNOWN.filter((m) => !configured.has(m));

  return (
    <div className="flex flex-col gap-4">
      {sp.saved ? (
        <p role="status" className="rounded-lg border border-[var(--tb-ok)] bg-[var(--tb-ok-soft)] px-3 py-2 text-[13px] text-[var(--tb-ok)]">
          {sp.saved} was saved and the table below was re-read from the API.
        </p>
      ) : null}
      {sp.error ? (
        <p role="alert" className="rounded-lg border border-[var(--tb-danger)] bg-[var(--tb-danger-soft)] px-3 py-2 text-[13px] text-[var(--tb-danger)]">
          The API refused that change. Nothing was written.
        </p>
      ) : null}

      <Card
        title="Configured limits"
        description="How many codes of each kind may be issued, and over what window."
      >
        <DataTable
          columns={["Method", "Max", "Window", "Last updated"]}
          empty="No verification method has a configured limit."
          rows={limits.map((l) => ({
            Method: <span className="font-mono text-[12px]">{l.method ?? "—"}</span>,
            Max: l.max ?? "—",
            Window:
              typeof l.windowMs === "number"
                ? `${Math.round(l.windowMs / 60000)} min`
                : "—",
            "Last updated": l.updatedAt ?? "—",
          }))}
        />
      </Card>

      {missing.length > 0 ? (
        <Card
          title="Not configured"
          description="These methods send today on the API's built-in default, with no row of their own."
        >
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <li key={m}>
                <Badge tone="warn">{m}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card
        title="Set a limit"
        description="An upsert: the method is the key, so a new one can be configured here."
      >
        <form action={save} className="flex flex-wrap items-end gap-3">
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
              className="mt-1 w-40 rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <datalist id="known-methods">
              {KNOWN.map((m) => (
                <option key={m} value={m} />
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
              className="mt-1 w-24 rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
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
              className="mt-1 w-32 rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Save limit
          </button>
        </form>
        <p className="mt-3 text-[12px] text-[var(--tb-text-muted)]">
          The API rejects a write without <code className="text-[11px]">max</code>,
          and defaults the window to 15 minutes when one is not supplied.
        </p>
      </Card>

      {limits.length === 0 ? (
        <State
          title="Nothing is configured"
          body="An empty table here means the limiter is running on its compiled-in defaults, not that no limits exist."
        />
      ) : null}
    </div>
  );
}