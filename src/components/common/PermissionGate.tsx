import type { ReactNode } from "react";
import { useAuth } from "../../lib/useAuth";
import { hasPermission, type Resource, type Permission } from "../../lib/permissions";

export function PermissionGate({ resource, permission, children, fallback = null }: {
  resource: Resource;
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useAuth();
  if (!role) return fallback;
  if (!hasPermission(role as any, resource, permission)) return fallback;
  return <>{children}</>;
}

export function RoleGate({ roles, children, fallback = null }: {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useAuth();
  if (!role || !roles.includes(role)) return fallback;
  return <>{children}</>;
}
