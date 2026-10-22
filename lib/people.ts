import { apiFailure, apiGet } from "@/lib/api";
import type { Load, LoadError } from "@/lib/load-state";

import type { Page, User, UserStatus } from "@/lib/types";

/** The People screen's one read: GET /api/admin/users.
 *
 *  The door answers in its own words — `search` where the form says `q`,
 *  `limit` where the console says perPage, `adminRole: "admin" | null` where
 *  the row type says `isAdmin`, and a display `status` label that collapses
 *  restricted and deactivated into ACTIVE. All of that is translated here and
 *  nowhere else, so the page keeps talking the console's own language and a
 *  second screen that reads the same door cannot invent its own mapping. */

const PER_PAGE = 25;

/** The lifecycle kinds, in the schema's own words. */
const KINDS: UserStatus[] = [
  "active",
  "restricted",
  "banned",
  "suspended",
  "deactivated",
  "deletion_pending",
  "deleted",
];

export type PeopleFilter = {
  q: string;
  status: UserStatus | "";
  admin: "yes" | "no" | "";
  sort: "newest" | "oldest" | "active" | "name";
  page: number;
};

type ApiRow = {
  id: string;
  email: string;
  username: string | null;
  statusKind?: string;
  adminRole: string | null;
  createdAt: string;
  updatedAt?: string;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
};

type ApiList = { users?: ApiRow[]; total?: number; page?: number; limit?: number };

function toKind(raw: string | null | undefined): UserStatus {
  // `status` on the door is a label; `statusKind` is the column. A kind the
  // enum does not have would be a schema we have not caught up with, and the
  // column's own default is the honest thing to fall back to.
  return (KINDS as string[]).includes(raw ?? "") ? (raw as UserStatus) : "active";
}

function toUser(row: ApiRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username ?? null,
    status: toKind(row.statusKind),
    isAdmin: row.adminRole != null,
    lastActiveAt: row.lastActiveAt ?? null,
    lastLoginAt: row.lastLoginAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
  };
}

function query(f: PeopleFilter): string {
  const p = new URLSearchParams({ page: String(f.page), limit: String(PER_PAGE) });
  if (f.q) p.set("search", f.q);
  if (f.status) p.set("status", f.status);
  if (f.admin) p.set("admin", f.admin);
  if (f.sort !== "active") p.set("sort", f.sort);
  return p.toString();
}

export async function readPeople(f: PeopleFilter): Promise<Load<Page<User>>> {
  const result = await apiGet<ApiList>(`/admin/users?${query(f)}`);

  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.users)) {
    return { status: "error", message: "The API answered with no user list in it." };
  }

  const data = result.data!;
  const page = {
    items: data.users!.map(toUser),
    total: data.total ?? data.users!.length,
    page: data.page ?? f.page,
    perPage: data.limit ?? PER_PAGE,
  };
  return page.items.length === 0 ? { status: "empty" } : { status: "ready", data: page };
}

/** What the platform already says about one account. Enough to name a person
 *  on a screen whose full read does not exist yet. */
export type PersonSummary = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  status: UserStatus;
  isAdmin: boolean;
  createdAt: string;
};

/** "Is there such an account?" has three answers and they must not collapse
 *  into each other: an id the API does not recognise is a 404 the operator
 *  should see, and an id the API was never able to be asked about is a
 *  failure — reporting that as "no such person" would tell an operator an
 *  account does not exist because the console could not reach the database. */
export type PersonLookup =
  | { kind: "found"; person: PersonSummary }
  | { kind: "absent" }
  | { kind: "error"; load: LoadError };

type ApiDetail = {
  id?: string;
  email?: string;
  username?: string | null;
  name?: string | null;
  statusKind?: string;
  adminRole?: string | null;
  createdAt?: string;
};

export async function readPersonSummary(id: string): Promise<PersonLookup> {
  const result = await apiGet<ApiDetail>(`/admin/users/${encodeURIComponent(id)}`);
  if (result.status === 404) return { kind: "absent" };

  const d = result.data;
  if (!result.ok || !d?.id || !d.email || !d.createdAt) {
    return { kind: "error", load: apiFailure(result) };
  }

  return {
    kind: "found",
    person: {
      id: d.id,
      email: d.email,
      username: d.username ?? null,
      name: d.name ?? null,
      status: toKind(d.statusKind),
      isAdmin: d.adminRole != null,
      createdAt: d.createdAt,
    },
  };
}
