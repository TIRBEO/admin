import { LogOut, Search, Bell } from "lucide-react";
import { AppSelector } from "./AppSelector";
import { RoleBadge } from "../common/RoleBadge";
import { useAuth } from "../../lib/useAuth";

export function Header({ currentApp, onAppChange, onLogout }: {
  currentApp: string;
  onAppChange: (appId: string) => void;
  onLogout: () => void;
}) {
  const { admin } = useAuth();

  return (
    <header className="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">T</span>
          <span className="font-semibold text-white">Tirbeo Admin</span>
        </div>
        <AppSelector currentApp={currentApp} onAppChange={onAppChange} />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text" placeholder="Search settings..."
            className="w-64 rounded-lg border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button className="p-2 rounded-full hover:bg-neutral-800 text-neutral-500 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        {admin?.role && <RoleBadge role={admin.role as any} size="sm" />}
        <div className="flex items-center gap-3 pl-3 border-l border-neutral-800">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-white">{admin?.display_name || "Admin"}</div>
            <div className="text-xs text-neutral-500">{admin?.email || ""}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {admin?.display_name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
