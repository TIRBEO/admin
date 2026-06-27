import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "admin" | "manager" | "editor" | "viewer";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: AdminRole;
  permissions: Record<string, unknown>;
  created_at: string;
}

export interface AppSession {
  user: User;
  admin: AdminUser;
}

const SESSION_KEY = "tirbeo_admin_session";

export function getSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

export function setSession(session: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Role hierarchy: higher index = more power
const ROLE_HIERARCHY: AdminRole[] = ["viewer", "editor", "manager", "admin", "super_admin"];

export function roleLevel(role: AdminRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasMinRole(role: AdminRole, minimum: AdminRole): boolean {
  return roleLevel(role) >= roleLevel(minimum);
}

// Allowed roles for each action
export const PERMISSIONS = {
  // Content management (CRUD on content tables)
  content: {
    view: ["super_admin", "admin", "manager", "editor", "viewer"] as AdminRole[],
    write: ["super_admin", "admin", "manager", "editor"] as AdminRole[],
    delete: ["super_admin", "admin", "manager"] as AdminRole[],
  },
  // Site configuration
  siteConfig: {
    view: ["super_admin", "admin", "manager", "editor", "viewer"] as AdminRole[],
    write: ["super_admin", "admin"] as AdminRole[],
  },
  // Admin user management
  admins: {
    view: ["super_admin", "admin", "manager", "editor", "viewer"] as AdminRole[],
    add: ["super_admin", "admin"] as AdminRole[],
    changeRole: ["super_admin", "admin"] as AdminRole[],
    delete: ["super_admin"] as AdminRole[],
  },
  // Audit log
  auditLog: {
    view: ["super_admin", "admin"] as AdminRole[],
  },
};

export function can(adminRole: AdminRole, resource: keyof typeof PERMISSIONS, action: string): boolean {
  const resourcePermissions = PERMISSIONS[resource] as Record<string, AdminRole[]>;
  const allowed = resourcePermissions[action];
  if (!allowed) return false;
  return allowed.includes(adminRole);
}

// Auto-register first ever user as super_admin
export async function autoRegisterFirstAdmin(userId: string, email: string): Promise<AdminUser | null> {
  // Check if any admin exists
  const { count } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return null; // already have admins

  // Become the first super_admin
  const { data } = await supabase
    .from("admin_users")
    .insert({
      user_id: userId,
      email,
      display_name: email,
      role: "super_admin",
    })
    .select()
    .single();

  return data as AdminUser | null;
}

// Refresh admin record from DB
export async function refreshAdminSession(): Promise<AppSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { clearSession(); return null; }

  let { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Auto-register first ever user as super_admin
  if (!admin) {
    admin = await autoRegisterFirstAdmin(user.id, user.email || "");
  }

  if (!admin) { clearSession(); return null; }

  const session: AppSession = { user, admin };
  setSession(session);
  return session;
}
