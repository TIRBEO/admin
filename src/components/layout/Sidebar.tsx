import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";
import { canViewSidebarItem } from "../../lib/permissions";
import {
  LayoutDashboard, Users, Settings, BarChart3, Shield,
  FileText, Plug, FileBarChart, Trash2, UserCog, ScrollText,
  Activity, Bell, FileCheck, HardDrive, Megaphone, Download, Eye,
} from "lucide-react";
import { APPS } from "../../lib/apps.config";

export function Sidebar({ currentApp }: { currentApp: string }) {
  const { role, admin } = useAuth();
  const app = APPS[currentApp];

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", path: `/apps/${currentApp}/overview`, key: "overview" },
    { icon: Users, label: "Users", path: `/apps/${currentApp}/users`, key: "users" },
    { icon: Settings, label: "Settings", path: `/apps/${currentApp}/settings`, key: "settings" },
    { icon: BarChart3, label: "Analytics", path: `/apps/${currentApp}/analytics`, key: "analytics" },
    { icon: Shield, label: "Security", path: `/apps/${currentApp}/security`, key: "security" },
    { icon: FileText, label: "Content", path: `/apps/${currentApp}/content`, key: "content" },
    { icon: Plug, label: "Integrations", path: `/apps/${currentApp}/integrations`, key: "integrations" },
    { icon: FileBarChart, label: "Reports", path: `/apps/${currentApp}/reports`, key: "reports" },
    { icon: Trash2, label: "Trash", path: `/apps/${currentApp}/trash`, key: "trash" },
  ];

  const adminItems = [
    { icon: Activity, label: "System Status", path: "/admin/system-status", key: "system-status" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications", key: "notifications" },
    { icon: UserCog, label: "Admins", path: "/admin/admins", key: "admins" },
    { icon: ScrollText, label: "Audit Log", path: "/admin/audit", key: "audit" },
    { icon: FileCheck, label: "Content Approval", path: "/admin/content-approval", key: "content-approval" },
    { icon: HardDrive, label: "Backups", path: "/admin/backups", key: "backups" },
    { icon: Megaphone, label: "Announcements", path: "/admin/announcements", key: "announcements" },
    { icon: Download, label: "Exports", path: "/admin/exports", key: "exports" },
    { icon: Eye, label: "Impersonation", path: "/admin/impersonation", key: "impersonation" },
  ];

  const visibleNavItems = navItems.filter(item => role && canViewSidebarItem(role, item.key));
  const visibleAdminItems = adminItems.filter(item => role && canViewSidebarItem(role, item.key));

  return (
    <aside className="w-64 bg-neutral-950 border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{app?.icon || "📱"}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{app?.name || "Select App"}</div>
            <div className="text-xs text-neutral-500">v{app?.version || "1.0.0"}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}

        {visibleAdminItems.length > 0 && (
          <>
            <div className="h-px bg-white/5 my-3" />
            <div className="px-3 py-1 text-xs text-neutral-500 uppercase tracking-wider">Administration</div>
            {visibleAdminItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 font-semibold text-sm">
            {admin?.display_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{admin?.display_name || "Unknown"}</div>
            <div className="text-xs text-neutral-500 truncate">{admin?.email || ""}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
