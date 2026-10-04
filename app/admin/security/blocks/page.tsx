import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiGet, apiSend } from "@/lib/api";
import { Card, DataTable, Badge } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateTime, ago } from "@/lib/format";

/* GET /api/admin/security/blocks returns { items, total, page, limit } where
   an item is one blocklist entry: what was refused, why, by whom and until
   when. Active entries are the default view — an expired block is history,
   not something an operator needs to act on.

   Unblocking is a DELETE behind a POST server action: it removes something,
   and a link or a GET must never do that by accident. The API records a
   security.block_removed audit event itself, so the trail does not depend
   on this page behaving. */

type Block = {
  targetType?: string;
  targetId?: string;
  reason?: string | null;
  blockedBy?: string | null;
  isActive?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
};

type Payload = { items?: Block[]; total?: number; page?: number; limit?: number };

const TYPES: string[] = ["", "ip", "user", "email"];

async function unblock(formData: FormData) {
  "use server";
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const back = String(formData.get("back") ?? "/admin/security/blocks");

  if (!targetType || !targetId) {
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=missing-target`);
  }

  const res = await apiSend<{ ok?: boolean }>(
    `/admin/security/blocks/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`,
    { method: "DELETE" },
  );
  revalidatePath("/admin/security/blocks");
  redirect(
    `${back}${back.includes("?") ? "&" : "?"}${
      res.ok ? `removed=${encodeURIComponent(targetId)}` : "error=unblock-failed"
    }`,
  );
}

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    q?: string;
    all?: string;
    removed?: string;
    error?: string;
  }>;
}) {
  const sp = await searchParams;
  const targetType = TYPES.includes(sp.type ?? "") ? (sp.type as string) : "";
  const q = (sp.q ?? "").trim();
  const showAll = sp.all === "1";

  const params = new URLSearchParams({ limit: "100" });
  if (targetType) params.set("targetType", targetType);
  if (q) params.set("q", q);
  if (!showAll) params.set("activeOnly", "true");

  const back = `/admin/security/blocks${new URLSearchParams({
    ...(targetType ? { type: targetType } : {}),
    ...(q ? { q } : {}),
    ...(showAll ? { all: "1" } : {}),
  })}`;

  const res = await apiGet<Payload>(`/admin/security/blocks?${params}`);
  if (!res.ok) return <Failure result={res} what="the blocklist" />;

  const data = res.data ?? {};
  const items = data.items ?? [];
  const total = data.total ?? items.length;

  return (
    <div className="flex flex-col gap-4">
      {sp.removed ? (
        <p
          role="status"
          className="rounded-lg border border-[var(--tb-ok)] bg-[var(--tb-ok-soft)] px-3 py-2 text-[13px] text-[var(--tb-ok)]"
        >
          {sp.removed} was removed from the blocklist and the removal was
          written to the audit trail.
        </p>
      ) : null}
      {sp.error ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--tb-danger)] bg-[var(--tb-danger-soft)] px-3 py-2 text-[13px] text-[var(--tb-danger)]"
        >
          The API refused that change. Nothing was removed.
        </p>
      ) : null}

      <Card
        title="Find a block"
        description="Filter by what was blocked, or search the target and reason."
      >
        <form action="/admin/security/blocks" method="get" className="flex flex-wrap gap-2">
          <label htmlFor="q" className="sr-only">
            Search blocks
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Address, email, account id or reason"
            className="w-full max-w-sm rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <label htmlFor="type" className="sr-only">
            Target type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={targetType}
            className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
          >
            <option value="">Any target</option>
            <option value="ip">IP</option>
            <option value="user">Account</option>
            <option value="email">Email</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--tb-border)] px-3 py-2 text-[13px]">
            <input
              type="checkbox"
              name="all"
              value="1"
              defaultChecked={showAll}
              className="accent-[var(--tb-accent)]"
            />
            Include expired
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Apply
          </button>
        </form>
      </Card>

      <Card
        title="Blocklist"
        description={`${total} entr${total === 1 ? "y" : "ies"}${showAll ? "" : " currently in force"}.`}
      >
        <DataTable
          columns={["Type", "Target", "Reason", "Blocked", "Expires", "Since", ""]}
          empty={q ? `Nothing matches “${q}”.` : "Nothing is blocked."}
          rows={items.map((b) => ({
            Type: (
              <Badge tone={b.isActive === false ? "muted" : "danger"}>
                {b.targetType ?? "—"}
              </Badge>
            ),
            Target: (
              <span className="font-mono text-[12px]">{b.targetId ?? "—"}</span>
            ),
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
                <input type="hidden" name="back" value={back} />
                <button
                  type="submit"
                  className="rounded-md border border-[var(--tb-border)] px-2 py-1 text-[12px] text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-danger)]"
                >
                  Unblock
                </button>
              </form>
            ) : (
              "—"
            ),
          }))}
        />
      </Card>

      <Card title="Adding a block">
        <p className="text-[13px] text-[var(--tb-text-secondary)]">
          <code className="rounded bg-[var(--tb-surface-2)] px-1 text-[11px]">POST /api/admin/security/blocks</code>{" "}
          takes <code className="text-[11px]">targetType</code> (ip, user or
          email), <code className="text-[11px]">targetId</code>, a{" "}
          <code className="text-[11px]">reason</code> and an optional{" "}
          <code className="text-[11px]">hours</code> until it expires. Every
          block it writes is recorded as a{" "}
          <code className="text-[11px]">security.block_created</code> audit
          event. There is deliberately no one-field form for it here: a block
          is a decision about a real address, and a form that can post it as
          easily as it can post a filter is the wrong shape for that.
        </p>
      </Card>
    </div>
  );
}