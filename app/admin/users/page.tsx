import { apiGet } from "@/lib/api";
import { Card, DataTable, Badge } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { dateOnly, ago } from "@/lib/format";

/* GET /api/admin/users returns { users, total, page, limit, optInCounts }.
   The list is ordered by last activity, so "no account has ever been
   active" sorts them by creation date instead — visible below. */

type User = {
  id: string;
  email: string;
  name?: string | null;
  adminRole?: string | null;
  isBanned?: boolean | null;
  isSuspended?: boolean | null;
  status?: string;
  eventId?: string | null;
  createdAt?: string;
  lastActiveAt?: string | null;
  lastLoginAt?: string | null;
};

type UsersPayload = {
  users?: User[];
  total?: number;
  page?: number;
  limit?: number;
  optInCounts?: { recap: number; paused: number; any: number; none: number };
};

const PAGE_SIZE = 50;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
  if (query) params.set("search", query);

  const res = await apiGet<UsersPayload>(`/admin/users?${params}`);

  if (!res.ok) return <Failure result={res} what="the account list" />;

  const data = res.data ?? {};
  const users = data.users ?? [];
  const total = data.total ?? users.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const optIns = data.optInCounts;

  return (
    <div className="flex flex-col gap-4">
      <form action="/admin/users" method="get" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search accounts
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Email, name, ban code or suspend code"
          className="w-full max-w-md rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tb-text-muted)] focus:border-[var(--tb-accent)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
        >
          Search
        </button>
      </form>

      {optIns ? (
        <Card
          title="Notification opt-ins"
          description="Across every account matching this search."
        >
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Recap", optIns.recap],
              ["Paused", optIns.paused],
              ["Either", optIns.any],
              ["Neither", optIns.none],
            ].map(([label, value]) => (
              <li key={label as string}>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--tb-text-muted)]">
                  {label}
                </p>
                <p className="text-[22px] font-semibold tabular-nums">{value}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card
        title="Accounts"
        description={`${total} match${total === 1 ? "es" : ""}${query ? ` “${query}”` : ""}. Showing ${users.length}.`}
      >
        <DataTable
          columns={["Email", "Name", "Role", "State", "Last active", "Joined", "Ref"]}
          empty={query ? `Nothing matches “${query}”.` : "No accounts returned."}
          rows={users.map((u) => ({
            Email: <span className="font-mono text-[12px]">{u.email}</span>,
            Name: u.name ?? "—",
            Role: u.adminRole ? (
              <Badge tone="accent">{u.adminRole}</Badge>
            ) : (
              "—"
            ),
            State: <Badge tone={stateTone(u)}>{stateLabel(u)}</Badge>,
            "Last active": u.lastActiveAt ? ago(u.lastActiveAt) : "never",
            Joined: dateOnly(u.createdAt),
            Ref: u.eventId ? (
              <span className="font-mono text-[11px] text-[var(--tb-text-muted)]">
                {u.eventId}
              </span>
            ) : (
              "—"
            ),
          }))}
        />

        {pages > 1 ? (
          <nav
            aria-label="Pagination"
            className="mt-4 flex items-center justify-between text-[13px]"
          >
            {page > 1 ? (
              <a
                href={`/admin/users?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  page: String(page - 1),
                })}`}
                className="rounded-lg border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]"
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
                href={`/admin/users?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  page: String(page + 1),
                })}`}
                className="rounded-lg border border-[var(--tb-border)] px-3 py-1.5 hover:bg-[var(--tb-surface-2)]"
              >
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
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