import { cache } from "react";

import { apiGet } from "@/lib/api";

/* What the account holding this request may do.

   The API is the only authority: `/admin/me` returns the whole permission
   catalogue resolved for this operator's role, key by key, and nothing here
   infers a power from a role name. A screen that decided its own rights with
   `adminRole === "admin"` is how a moderator ends up with a button that answers
   403 after they have filled in the form, which is worse than no button.

   `readMe` is wrapped in React's `cache` so the layout, this helper and the
   account screen share one HTTP call per request rather than three. It is a
   per-request dedupe, not a cache: permissions are read afresh on every
   navigation, so revoking a role takes effect on the next click rather than at
   the next deploy.

   Hiding a control is courtesy, not security. Every door below still refuses on
   its own; this file exists so the console does not offer what it will not do. */

export type RoleView = {
  key: string;
  label: string;
  purpose: string;
  rank: number;
  /** False for an account that is staff only because `is_admin` was never
      paired with a role row — the console says so rather than presenting an
      invented assignment as somebody's decision. */
  assigned: boolean;
};

export type MeView = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  adminRole: string;
  role: RoleView;
  permissions: Record<string, boolean>;
  canManageStaff: boolean;
};

export const readMe = cache(() => apiGet<MeView>("/admin/me"));

async function set(): Promise<Record<string, boolean>> {
  const me = await readMe();
  return me.ok && me.data ? me.data.permissions ?? {} : {};
}

/** May this operator do the thing that needs `permission`? */
export async function can(permission: string): Promise<boolean> {
  return (await set())[permission] === true;
}

/** May this operator do any of these things — for a screen whose one button
    covers two doors, e.g. ban (people.manage) and delete (people.delete). */
export async function canAny(...permissions: string[]): Promise<boolean> {
  const granted = await set();
  return permissions.some((p) => granted[p] === true);
}
