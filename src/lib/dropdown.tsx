import type { DropdownAction } from "@tirbeo/ui";
import { Shield, Settings, LogOut, Activity, Users, FileText } from "lucide-react";

export function getAdminDropdownActions(onLogout: () => void, onNavigate?: (path: string) => void): DropdownAction[] {
  return [
    { label: "Admin Panel", icon: <Shield className="h-4 w-4" />, action: () => onNavigate?.("/") },
    { label: "Users", icon: <Users className="h-4 w-4" />, action: () => onNavigate?.("/users") },
    { label: "Analytics", icon: <Activity className="h-4 w-4" />, action: () => onNavigate?.("/analytics") },
    { label: "Site Config", icon: <Settings className="h-4 w-4" />, action: () => onNavigate?.("/site-config") },
    { label: "Audit Log", icon: <FileText className="h-4 w-4" />, shortcut: "⌘L", action: () => onNavigate?.("/audit-log") },
    { label: "Sign Out", icon: <LogOut className="h-4 w-4" />, variant: "danger", action: onLogout },
  ];
}
