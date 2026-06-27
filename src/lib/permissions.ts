import { type AdminRole, ROLE_HIERARCHY } from "./roles";

export type Resource =
  | "content"
  | "site_config"
  | "admin_users"
  | "audit_log";

export type Permission =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "change_role";

export const PERMISSION_MATRIX: Record<AdminRole, Record<Resource, Permission[]>> = {
  super_admin: {
    content: ["view", "create", "edit", "delete"],
    site_config: ["view", "create", "edit", "delete"],
    admin_users: ["view", "create", "edit", "delete", "change_role"],
    audit_log: ["view"],
  },
  admin: {
    content: ["view", "create", "edit", "delete"],
    site_config: ["view", "create", "edit", "delete"],
    admin_users: ["view", "create", "edit"],
    audit_log: ["view"],
  },
  manager: {
    content: ["view", "create", "edit", "delete"],
    site_config: ["view", "edit"],
    admin_users: ["view"],
    audit_log: [],
  },
  editor: {
    content: ["view", "create", "edit"],
    site_config: ["view"],
    admin_users: ["view"],
    audit_log: [],
  },
  viewer: {
    content: ["view"],
    site_config: ["view"],
    admin_users: ["view"],
    audit_log: [],
  },
};

export function hasPermission(
  role: AdminRole,
  resource: Resource,
  permission: Permission
): boolean {
  return PERMISSION_MATRIX[role]?.[resource]?.includes(permission) ?? false;
}

export const SIDEBAR_VISIBILITY: Record<AdminRole, string[]> = {
  super_admin: [
    "overview", "users", "settings", "analytics",
    "security", "content", "integrations", "reports",
    "trash", "admins", "audit",
    "system-status", "notifications", "content-approval",
    "backups", "announcements", "exports", "impersonation",
    "blog",
  ],
  admin: [
    "overview", "users", "settings", "analytics",
    "security", "content", "integrations", "reports",
    "trash", "admins", "audit",
    "system-status", "notifications", "content-approval",
    "backups", "announcements", "exports",
    "blog",
  ],
  manager: [
    "overview", "settings", "analytics",
    "content", "integrations", "reports", "trash",
    "notifications", "content-approval", "announcements", "exports",
    "blog",
  ],
  editor: [
    "overview", "settings", "analytics",
    "content", "reports",
    "notifications", "exports",
    "blog",
  ],
  viewer: [
    "overview", "analytics", "reports",
  ],
};

export function canViewSidebarItem(role: AdminRole, item: string): boolean {
  return SIDEBAR_VISIBILITY[role]?.includes(item) ?? false;
}
