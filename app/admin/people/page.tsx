import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";
import { Card, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateOnly, ago, dateTime } from "@/lib/format";

type User = {
  id: string;
  email: string;
  name?: string | null;
  adminRole?: string | null;
  isBanned?: boolean | null;
  isSuspended?: boolean | null;
  createdAt?: string;
  lastActiveAt?: string | null;
  eventId?: string | null;
};

type UsersPayload = {
  users?: User[];
  total?: number;
  page?: number;
  optInCounts?: { recap: number; paused: number; any: number; none: number };
};

type Status = {
  level?: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

type StatusRow = {
  user: User;
  level: number | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

const PAGE_SIZE = 50;

async function setLevel(formData: FormData) {
  "use server";
  const s = String(formData.get("s") ?? "").trim();
  const userId = String(formData.get("userId") ?? "");
  const level = Number(formData.get("level"));

  if (!userId || !Number.isInteger(level) || level < 0) {
    redirect(`/admin/people?error=invalid&s=${encodeURIComponent(s)}`);
  }

  const result = await apiPut("/admin/account-status", { userId, level });
  revalidatePath("/admin/people");
  redirect(
    `/admin/people?${
      result.ok ? "saved=1" : `error=${encodeURIComponent(result.status ? String(result.status) : "unreachable")}`
    }&s=${encodeURIComponent(s)}`,
  );
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    s?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const statusQuery = (sp.s ?? "").trim();

  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
  if (query) params.set("search", query);

  const usersPromise = apiGet<UsersPayload>(`/admin/users?${params}`);

  const statusRowsPromise: Promise<StatusRow[]> = statusQuery
    ? (async () => {
        const list = await apiGet<{ users?: User[] }>(
          `/admin/users?search=${encodeURIComponent(statusQuery)}&limit=10`,
        );
        if (!list.ok) return [];
        const users = list.data?.users ?? [];
        return Promise.all(
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
      })()
    : Promise.resolve([]);

  const [usersRes, statusRows] = await Promise.all([usersPromise, statusRowsPromise]);

  if (!usersRes.ok) return <Failure result={usersRes} what="the account list" />;

  const data = usersRes.data ?? {};
  const users = data.users ?? [];
  const total = data.total ?? users.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const optIns = data.optInCounts;
  const selected = statusRows[0];

  return (
    <div className="flex flex-col gap-5">
      {sp.saved ? (
        <p
          role="status"
          className="rounded-[10px] border border-[var(--tb-ok)] bg-[var(--tb-ok-soft)] px-3.5 py-2.5 text-[13px] text-[var(--tb-ok)]"
        >
          Level saved. The value below was re-read from the API after writing.
        </p>
      ) : null}
      {sp.error ? (
        <p
          role="alert"
          className="rounded-[10px] border border-[var(--tb-danger)] bg-[var(--tb-danger-soft)] px-3.5 py-2.5 text-[13px] text-[var(--tb-danger)]"
        >
          The API refused that change (
          {sp.error === "invalid" ? "invalid level" : sp.error === "unreachable" ? "unreachable" : `status ${sp.error}`}
          ). Nothing was written.
        </p>
      ) : null}

      <Card
        title="Accounts"
        description={`${total} match${total === 1 ? "es" : ""}${query ? ` “${query}”` : ""}. Showing ${users.length}.`}
        action={
          <form action="/admin/people" method="get" className="flex gap-2">
            <label htmlFor="q" className="sr-only">
              Search accounts
            </label>
            <input
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Email, name or ban code"
              className="w-56 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-1.5 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              Search
            </button>
          </form>
        }
      >
        {optIns ? (
          <div className="mb-4 grid grid-cols-2 gap-3 border-b border-[var(--tb-border)] pb-4 sm:grid-cols-4">
            {[
              ["Recap opt-in", optIns.recap],
              ["Paused", optIns.paused],
              ["Either", optIns.any],
              ["Neither", optIns.none],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-[12px] text-[var(--tb-text-muted)]">{label}</p>
                <p className="text-[20px] font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <DataTable
          columns={["Email", "Name", "Role", "State", "Last active", "Joined", "Ref"]}
          empty={query ? `Nothing matches “${query}”.` : "No accounts returned."}
          rows={users.map((u) => ({
            Email: <span className="font-mono text-[12px]">{u.email}</span>,
            Name: u.name ?? "—",
            Role: u.adminRole ? <Badge tone="accent">{u.adminRole}</Badge> : "—",
            State: <Badge tone={stateTone(u)}>{stateLabel(u)}</Badge>,
            "Last active": u.lastActiveAt ? ago(u.lastActiveAt) : "never",
            Joined: dateOnly(u.createdAt),
            Ref: u.eventId ? (
              <span className="font-mono text-[11px] text-[var(--tb-text-muted)]">{u.eventId}</span>
            ) : (
              "—"
            ),
          }))}
        />

        {pages > 1 ? (
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-[13px]">
            {page > 1 ? (
              <a
                href={`/admin/people?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  page: String(page - 1),
                })}`}
                className="btn btn-secondary btn-sm"
              >
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <span className="text-[var(--tb-text-muted)]">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <a
                href={`/admin/people?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  page: String(page + 1),
                })}`}
                className="btn btn-secondary btn-sm"
              >
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Card>

      <Card
        title="Account status"
        description="Look an account up, read the level an admin decided, and set a new one. Level 0 means nothing has been decided — it is the status, not an absence of one."
      >
        <form action="/admin/people" method="get" className="flex gap-2">
          <label htmlFor="s" className="sr-only">
            Find an account
          </label>
          <input
            id="s"
            name="s"
            defaultValue={statusQuery}
            placeholder="Email, name or reference code"
            className="w-full max-w-md rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
          />
          <button
            type="submit"
            className="btn btn-primary"
          >
            Look up
          </button>
        </form>

        {statusRows.length > 0 ? (
          <div className="mt-4">
            <DataTable
              columns={["Email", "Name", "Level", "Decided by", "Decided at"]}
              empty="No accounts matched."
              rows={statusRows.map((r) => ({
                Email: <span className="font-mono text-[12px]">{r.user.email}</span>,
                Name: r.user.name ?? "—",
                Level:
                  r.level === null ? (
                    <Badge tone="danger">unreadable</Badge>
                  ) : (
                    <Badge tone={levelTone(r.level)}>{r.level}</Badge>
                  ),
                "Decided by": r.updatedBy ?? "—",
                "Decided at": r.updatedAt ? dateTime(r.updatedAt) : "never",
              }))}
            />
          </div>
        ) : statusQuery ? (
          <div className="mt-4">
            <State
              title={`Nothing matches “${statusQuery}”.`}
              body="The search runs in the API; this page filters nothing itself."
            />
          </div>
        ) : null}

        {selected && selected.level !== null ? (
          <form action={setLevel} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--tb-border)] pt-4">
            <input type="hidden" name="s" value={statusQuery} />
            <input type="hidden" name="userId" value={selected.user.id} />
            <div>
              <label htmlFor="level" className="block text-[12px] text-[var(--tb-text-muted)]">
                New level for {selected.user.email} (whole number, 0 or above)
              </label>
              <input
                id="level"
                name="level"
                type="number"
                min={0}
                step={1}
                defaultValue={selected.level}
                required
                className="mt-1 w-32 rounded-[10px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none focus:border-[var(--tb-accent)]"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Set level
            </button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}

function stateTone(u: User) {
  if (u.isBanned) return "danger" as const;
  if (u.isSuspended) return "warn" as const;
  if (u.adminRole) return "accent" as const;
  return "ok" as const;
}

function stateLabel(u: User) {
  if (u.isBanned) return "Banned";
  if (u.isSuspended) return "Suspended";
  return "Active";
}

function levelTone(level: number) {
  if (level === 0) return "ok" as const;
  if (level <= 2) return "warn" as const;
  return "danger" as const;
}
