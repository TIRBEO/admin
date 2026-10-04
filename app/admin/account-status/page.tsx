import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";
import { Card, DataTable, Badge, State } from "@/components/primitives";
import { dateTime } from "@/lib/format";

/* Account status is a whole number an admin decides about somebody else's
   account. There is no admin-wide list of them — the value is stored per
   account, so this page looks an account up and reads the one number. That
   mirrors the API exactly: GET /api/user/account-status?userId= is readable
   by an admin for any account, and PUT /api/admin/account-status is the only
   write path the platform has.

   The write goes through a POST server action on purpose: a level change is
   not idempotent, and a GET that changed state would fire from a prefetch. */

type User = { id: string; email: string; name?: string | null };
type Status = {
  ok?: boolean;
  level?: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

type Row = {
  user: User;
  level: number | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

async function setLevel(formData: FormData) {
  "use server";
  const q = String(formData.get("q") ?? "").trim();
  const userId = String(formData.get("userId") ?? "");
  const level = Number(formData.get("level"));

  if (!userId || !Number.isInteger(level) || level < 0) {
    redirect(`/admin/account-status?error=invalid&q=${encodeURIComponent(q)}`);
  }

  const result = await apiPut("/admin/account-status", { userId, level });
  revalidatePath("/admin/account-status");
  redirect(
    `/admin/account-status?${
      result.ok ? "saved=1" : `error=${encodeURIComponent(result.status ? String(result.status) : "unreachable")}`
    }&q=${encodeURIComponent(q)}`,
  );
}

export default async function AccountStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();

  const rows: Row[] = query
    ? await (async () => {
        const list = await apiGet<{ users?: User[] }>(
          `/admin/users?search=${encodeURIComponent(query)}&limit=10`,
        );
        if (!list.ok) return [];
        const users = list.data?.users ?? [];
        const results = await Promise.all(
          users.map(async (user) => {
            const res = await apiGet<Status>(
              `/user/account-status?userId=${encodeURIComponent(user.id)}`,
            );
            return {
              user,
              level: res.ok ? (res.data?.level ?? 0) : null,
              updatedAt: res.ok ? (res.data?.updatedAt ?? null) : null,
              updatedBy: res.ok ? (res.data?.updatedBy ?? null) : null,
            };
          }),
        );
        return results;
      })()
    : [];

  const selected = rows[0];

  return (
    <div className="flex flex-col gap-4">
      {sp.saved ? (
        <p
          role="status"
          className="rounded-lg border border-[var(--tb-ok)] bg-[var(--tb-ok-soft)] px-3 py-2 text-[13px] text-[var(--tb-ok)]"
        >
          Level saved. The value below was re-read from the API after writing.
        </p>
      ) : null}
      {sp.error ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--tb-danger)] bg-[var(--tb-danger-soft)] px-3 py-2 text-[13px] text-[var(--tb-danger)]"
        >
          The API refused that change ({sp.error === "unreachable" ? "unreachable" : `status ${sp.error}`}).
          Nothing was written.
        </p>
      ) : null}

      <Card
        title="Look up an account"
        description="Search by email, name or reference code, then read the level an admin decided."
      >
        <form action="/admin/account-status" method="get" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Find an account
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Email, name or reference code"
            className="w-full max-w-md rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
          >
            Look up
          </button>
        </form>
        <p className="mt-3 text-[12px] text-[var(--tb-text-muted)]">
          Level 0 is not &ldquo;no status&rdquo; — it is the status, and it
          means nothing has been decided about the account. Raising it writes
          to <code className="rounded bg-[var(--tb-surface-2)] px-1 py-0.5 text-[11px]">preferences.user_preferences.misc.accountStatus</code>,
          the one place the person themselves cannot reach.
        </p>
      </Card>

      {rows.length > 0 ? (
        <Card title="Results" description={`${rows.length} account(s) matched.`}>
          <DataTable
            columns={["Email", "Name", "Level", "Decided by", "Decided at"]}
            empty="No accounts matched."
            rows={rows.map((r) => ({
              Email: <span className="font-mono text-[12px]">{r.user.email}</span>,
              Name: r.user.name ?? "—",
              Level: r.level === null ? (
                <Badge tone="danger">unreadable</Badge>
              ) : (
                <Badge tone={levelTone(r.level)}>{r.level}</Badge>
              ),
              "Decided by": r.updatedBy ?? "—",
              "Decided at": r.updatedAt ? dateTime(r.updatedAt) : "never",
            }))}
          />
        </Card>
      ) : null}

      {selected && selected.level !== null ? (
        <Card
          title="Set the level"
          description={`${selected.user.email} is currently at ${selected.level}.`}
        >
          <form action={setLevel} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="q" value={query} />
            <input type="hidden" name="userId" value={selected.user.id} />
            <div>
              <label
                htmlFor="level"
                className="block text-[12px] text-[var(--tb-text-muted)]"
              >
                New level (whole number, 0 or above)
              </label>
              <input
                id="level"
                name="level"
                type="number"
                min={0}
                step={1}
                defaultValue={selected.level}
                required
                className="mt-1 w-32 rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
            >
              Set level
            </button>
          </form>
        </Card>
      ) : null}

      {!query ? (
        <State
          title="No account searched yet"
          body="Account status is stored per account, so this page reads one account at a time rather than listing them all."
        />
      ) : rows.length === 0 ? (
        <State
          title={`Nothing matches “${query}”.`}
          body="The search runs in the API; this page filters nothing itself."
        />
      ) : null}
    </div>
  );
}

function levelTone(level: number) {
  if (level === 0) return "ok" as const;
  if (level <= 2) return "warn" as const;
  return "danger" as const;
}