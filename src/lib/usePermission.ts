import { useAuth } from "./useAuth";
import { can, type AdminRole, type PERMISSIONS } from "./session";

export function usePermission() {
  const { session } = useAuth();

  return {
    can: (resource: keyof typeof PERMISSIONS, action: string) => {
      if (!session) return false;
      return can(session.admin.role, resource, action);
    },
    role: session?.admin.role ?? null,
    isSuperAdmin: session?.admin.role === "super_admin",
    isAdmin: session ? ["super_admin", "admin"].includes(session.admin.role) : false,
    isManager: session ? ["super_admin", "admin", "manager"].includes(session.admin.role) : false,
  };
}
