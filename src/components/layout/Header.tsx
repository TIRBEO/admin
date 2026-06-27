import { LogOut } from "lucide-react";
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
    <header className="h-14 border-b border-white/5 bg-neutral-950 flex items-center justify-between px-6">
      <AppSelector currentApp={currentApp} onAppChange={onAppChange} />
      <div className="flex items-center gap-4">
        {admin?.role && <RoleBadge role={admin.role as any} size="sm" />}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
