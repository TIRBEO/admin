import Link from "next/link";
import { Search, UserPlus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readPeople, type PeopleFilter } from "@/lib/people";
import { signInUrl } from "@/lib/sign-in";
import { ago, dateOnly } from "@/lib/format";

import type { User, UserStatus } from "@/lib/types";

type Params = Record<string, string | string[] | undefined>;

const STATUSES: UserStatus[] = [
  "active",
  "restricted",
  "banned",
  "suspended",
  "deactivated",
  "deletion_pending",
  "deleted",
];

/* Only the caller knows whether "pending" is good news, but every screen in
   the console must agree on what `banned` looks like — so the tone map is
   written out in full rather than built from the status name, which Tailwind
   could not generate anyway. */
const TONE: Record<UserStatus, "success" | "warn" | "danger" | "muted"> = {
  active: "success",
  restricted: "warn",
  banned: "danger",
  suspended: "danger",
  deactivated: "muted",
  deletion_pending: "warn",
  deleted: "muted",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = one("q") ?? "";
  const status = (STATUSES.includes(one("status") as UserStatus) ? one("status") : "") as
    | UserStatus
    | "";
  const admin = (one("admin") === "yes" || one("admin") === "no" ? one("admin") : "") as
    | "yes"
    | "no"
    | "";
  const sort = (["newest", "oldest", "active", "name"].includes(one("sort") ?? "")
    ? one("sort")
    : "newest") as PeopleFilter["sort"];
  const page = Math.max(1, Number(one("page")) || 1);

  const load = await readPeople({ q, status, admin, sort, page });

  const href = (over: Record<string, string | number>) => {
    const search = new URLSearchParams();
    const next = { q, status, admin, sort, page, ...over };
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === 0) continue;
      if (key === "sort" && value === "newest") continue;
      if (key === "page" && Number(value) === 1) continue;
      search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
  };

  /* The one refusal an operator can end themselves. `not-admin` deliberately
     gets no button — sending someone who is signed in but not an admin to the
     sign-in page starts a loop they cannot leave. */
  const failure =
    load.status === "error" && load.reason === "signed-out"
      ? {
          ...load,
          action: (
            <Link href={await signInUrl("/admin/people")} className="btn btn-primary btn-sm">
              Sign in
            </Link>
          ),
        }
      : load;

  const ready = load.status === "ready" ? load.data : null;

  return (
    <>
      <PageHeader
        title="People"
        description="Every account on the platform, and the one screen that decides what may happen to it."
        actions={
          <Link href="/admin/people/new" className="btn btn-primary btn-sm">
            <UserPlus size={13} aria-hidden />
            Provision account
          </Link>
        }
      />

      <Filters q={q} status={status} admin={admin} sort={sort} page={ready} />

      <PageState load={failure} rows={8} empty={EMPTY} />

      {ready ? (
        <Panel flush>
          <div className="px-4 py-1">
            <DataTable
              columns={[
                { key: "person", label: "Person" },
                { key: "status", label: "Status", hideBelow: "sm" },
                { key: "level", label: "Level", hideBelow: "lg" },
                { key: "active", label: "Last active", align: "right", hideBelow: "md" },
                { key: "joined", label: "Joined", align: "right", hideBelow: "lg", nowrap: true },
                { key: "id", label: "Id", hideBelow: "lg", width: "11ch" },
              ]}
              rows={ready.items.map((u: User) => ({
                person: (
                  <Link
                    href={`/admin/people/${u.id}`}
                    className="flex min-w-0 flex-col text-[var(--fg)] hover:text-[var(--accent-text)]"
                  >
                    <span className="truncate font-medium tracking-[-0.01em]">
                      {u.username ?? u.email}
                    </span>
                    <span className="truncate text-[12px] text-[var(--muted)]">{u.email}</span>
                  </Link>
                ),
                status: <Pill tone={TONE[u.status]}>{u.status.replaceAll("_", " ")}</Pill>,
                level: u.isAdmin ? "admin" : "person",
                active: u.lastActiveAt ? ago(u.lastActiveAt) : "never",
                joined: dateOnly(u.createdAt),
                id: <code className="text-[12px] text-[var(--muted)]">{u.id.slice(0, 8)}</code>,
              }))}
              empty={EMPTY}
            />
          </div>

          <nav
            aria-label="Pagination"
            className="flex items-center justify-between gap-3 border-t border-[var(--divider)] px-4 py-3"
          >
            <p className="text-[12px] tabular-nums text-[var(--muted)]">
              {rangeLabel(ready.page, ready.perPage, ready.total)}
            </p>
            <div className="flex gap-2">
              {ready.page > 1 ? (
                <Link href={href({ page: ready.page - 1 })} className="btn btn-secondary btn-sm">
                  Previous
                </Link>
              ) : null}
              {ready.page * ready.perPage < ready.total ? (
                <Link href={href({ page: ready.page + 1 })} className="btn btn-secondary btn-sm">
                  Next
                </Link>
              ) : null}
            </div>
          </nav>
        </Panel>
      ) : null}
    </>
  );
}

const EMPTY =
  "No account matches this search. A handle, an email, or the id in the first column will all find a person.";

function rangeLabel(page: number, perPage: number, total: number): string {
  if (total === 0) return "no results";
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  return `${first}–${last} of ${total.toLocaleString()}`;
}

function Filters({
  q,
  status,
  admin,
  sort,
  page,
}: {
  q: string;
  status: string;
  admin: string;
  sort: string;
  /** Null while the read is loading or failed — a count nobody fetched is a
      count that must not be printed. */
  page: { items: User[]; total: number } | null;
}) {
  const input =
    "h-9 min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <Panel>
      <form action="/admin/people" method="get" className="flex flex-wrap items-center gap-2">
        <label className="relative flex min-w-[14rem] flex-1 items-center">
          <Search
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-3 text-[var(--muted)]"
          />
          <span className="sr-only">Search people</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name, email, handle or id"
            className={`${input} w-full pl-9`}
          />
        </label>

        <span className="sr-only">Status</span>
        <select name="status" defaultValue={status} className={input}>
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <span className="sr-only">Access level</span>
        <select name="admin" defaultValue={admin} className={input}>
          <option value="">Anyone</option>
          <option value="yes">Admins</option>
          <option value="no">People</option>
        </select>

        <span className="sr-only">Sort by</span>
        <select name="sort" defaultValue={sort} className={input}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="active">Recently active</option>
          <option value="name">Name A–Z</option>
        </select>

        {/* The sort and status selects have no change handler, so a click on
            Apply is how the query reaches the URL — a form that only fired on
            Enter would leave an operator staring at a filter that never ran. */}
        <button type="submit" className="btn btn-primary btn-sm h-9">
          Apply
        </button>
        {q || status || admin ? (
          <a href="/admin/people" className="btn btn-quiet btn-sm h-9">
            Reset
          </a>
        ) : null}
      </form>
      {page ? (
        <p className="mt-2.5 text-[12px] tabular-nums text-[var(--muted)]">
          {page.items.length} of {page.total.toLocaleString()} accounts on this page
        </p>
      ) : null}
    </Panel>
  );
}
