import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";
import { canViewSidebarItem } from "../../lib/permissions";
import { APPS } from "../../lib/apps.config";
import {
  LayoutDashboard, Users, Settings, BarChart3, Shield,
  FileText, Plug, FileBarChart, Trash2, UserCog, ScrollText,
  Activity, Bell, FileCheck, HardDrive, Megaphone, Download, Eye,
} from "lucide-react";

function SidebarItem({ icon: Icon, label, path, active }: {
  icon: any; label: string; path: string; active: boolean;
}) {
  return (
    <NavLink
      to={path}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 border-l-3 ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
          : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

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
    { icon: FileText, label: "Blog", path: "/admin/blog", key: "blog" },
  ];

  const visibleNavItems = navItems.filter(item => role && canViewSidebarItem(role, item.key));
  const visibleAdminItems = adminItems.filter(item => role && canViewSidebarItem(role, item.key));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5">
        {visibleNavItems.map((item) => (
          <SidebarItem key={item.key} icon={item.icon} label={item.label} path={item.path}
            active={location.pathname === item.path} />
        ))}
        {visibleAdminItems.length > 0 && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-gray-200" />
            </div>
            <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Administration</div>
            {visibleAdminItems.map((item) => (
              <SidebarItem key={item.key} icon={item.icon} label={item.label} path={item.path}
                active={location.pathname === item.path} />
            ))}
          </>
        )}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {admin?.display_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{admin?.display_name || "Unknown"}</div>
            <div className="text-xs text-gray-500 truncate">{admin?.email || ""}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
