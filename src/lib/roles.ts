export type AdminRole = "super_admin" | "admin" | "manager" | "editor" | "viewer";

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  editor: 2,
  viewer: 1,
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "amber",
  admin: "red",
  manager: "blue",
  editor: "green",
  viewer: "neutral",
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  editor: "Editor",
  viewer: "Viewer",
};

export const ROLE_ICONS: Record<AdminRole, string> = {
  super_admin: "👑",
  admin: "🛡️",
  manager: "📊",
  editor: "✏️",
  viewer: "👁️",
};

export function roleLevel(role: AdminRole): number {
  return ROLE_HIERARCHY[role] ?? 0;
}

export function hasMinRole(role: AdminRole, minimum: AdminRole): boolean {
  return roleLevel(role) >= roleLevel(minimum);
}

export function canAssignRole(currentRole: AdminRole, targetRole: AdminRole): boolean {
  if (currentRole === "super_admin") return true;
  if (currentRole === "admin") return targetRole === "editor" || targetRole === "viewer";
  return false;
}

export function canManageRole(currentRole: AdminRole): boolean {
  return currentRole === "super_admin" || currentRole === "admin";
}
