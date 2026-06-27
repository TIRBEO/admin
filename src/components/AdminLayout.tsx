import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Globe, FileText, Menu, LinkIcon, Users, Clock,
  MessageSquare, HelpCircle, CreditCard, BookOpen, Shield, LogOut,
  ChevronLeft, UserCog, Activity,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { hasMinRole, type AdminRole } from "@/lib/session";

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  minRole: AdminRole;
}

const navItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", minRole: "viewer" },
  { href: "/site-config", icon: Globe, label: "Site Config", minRole: "admin" },
  { href: "/pages", icon: FileText, label: "Pages", minRole: "editor" },
  { href: "/nav", icon: LinkIcon, label: "Navigation", minRole: "editor" },
  { href: "/footer", icon: Menu, label: "Footer", minRole: "editor" },
  { href: "/team", icon: Users, label: "Team", minRole: "editor" },
  { href: "/timeline", icon: Clock, label: "Timeline", minRole: "editor" },
  { href: "/testimonials", icon: MessageSquare, label: "Testimonials", minRole: "editor" },
  { href: "/faq", icon: HelpCircle, label: "FAQ", minRole: "editor" },
  { href: "/pricing", icon: CreditCard, label: "Pricing", minRole: "editor" },
  { href: "/docs", icon: BookOpen, label: "Documentation", minRole: "editor" },
  { href: "/admins", icon: Shield, label: "Admins", minRole: "admin" },
  { href: "/audit-log", icon: Activity, label: "Audit Log", minRole: "admin" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout, role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter(
    (item) => role && hasMinRole(role, item.minRole)
  );

  const roleBadgeColors: Record<string, string> = {
    super_admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    editor: "bg-green-500/20 text-green-400 border-green-500/30",
    viewer: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <aside className={`flex flex-col border-r border-neutral-800 bg-neutral-950 transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}>
        <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-3">
          {!collapsed && <span className="font-semibold tracking-tight">Tirbeo Admin</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {!collapsed && session && (
          <div className="border-b border-neutral-800 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-neutral-300">
                {session.admin.display_name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {session.admin.display_name || session.user.email}
                </p>
                <span className={`inline-block mt-0.5 rounded border px-1.5 py-0.5 text-[10px] uppercase leading-tight ${roleBadgeColors[session.admin.role] || "text-neutral-500"}`}>
                  {session.admin.role.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleItems.map((item) => {
            const active = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-800 p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
