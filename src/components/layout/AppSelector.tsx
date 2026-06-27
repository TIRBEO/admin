import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { useAppStore } from "../../hooks/useAppStore";
import { APPS, APP_OPTIONS } from "../../lib/apps.config";

export function AppSelector({ currentApp, onAppChange }: {
  currentApp: string;
  onAppChange: (appId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { recentApps, setRecentApp } = useAppStore();
  const { role } = useAuth();

  const currentAppConfig = APPS[currentApp];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAppSelect = (appId: string) => {
    onAppChange(appId);
    setRecentApp(appId);
    setIsOpen(false);
  };

  const getVisibleApps = () => {
    const allApps = APP_OPTIONS.filter(app => APPS[app.value].isActive);
    if (role === "super_admin" || role === "admin") return allApps;
    return allApps.filter(app => !["identity", "company"].includes(app.value));
  };

  const visibleApps = getVisibleApps();
  const filteredApps = visibleApps.filter(app =>
    app.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 min-w-[200px]"
      >
        <span className="text-2xl">{currentAppConfig?.icon || "📱"}</span>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-white">{currentAppConfig?.name || "Select App"}</div>
          <div className="text-xs text-neutral-400">{currentAppConfig?.version || "v1.0.0"}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[340px] bg-neutral-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
          <div className="p-2">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-neutral-400 border border-white/10 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {recentApps.length > 0 && !searchQuery && (
              <>
                <div className="px-3 py-1 text-xs text-neutral-500 uppercase tracking-wider">Recent</div>
                {recentApps
                  .filter(id => visibleApps.some(app => app.value === id))
                  .slice(0, 3)
                  .map(appId => (
                    <AppOption key={appId} appId={appId} isActive={appId === currentApp} onClick={() => handleAppSelect(appId)} />
                  ))}
                <div className="h-px bg-white/5 my-2" />
              </>
            )}

            <div className="px-3 py-1 text-xs text-neutral-500 uppercase tracking-wider">
              {searchQuery ? "Results" : "All Apps"}
            </div>
            {filteredApps.map(({ value: appId }) => (
              <AppOption key={appId} appId={appId} isActive={appId === currentApp} onClick={() => handleAppSelect(appId)} />
            ))}

            {filteredApps.length === 0 && (
              <div className="px-3 py-4 text-center text-neutral-500 text-sm">No apps found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppOption({ appId, isActive, onClick }: { appId: string; isActive: boolean; onClick: () => void }) {
  const app = APPS[appId];
  if (!app) return null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
          : "hover:bg-white/5 text-neutral-300 hover:text-white"
      }`}
    >
      <span className="text-xl">{app.icon}</span>
      <div className="flex-1 text-left">
        <div className="text-sm font-medium">{app.name}</div>
        <div className="text-xs text-neutral-500 truncate">{app.description}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          app.isActive
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-neutral-500/20 text-neutral-400"
        }`}>
          {app.isActive ? "● Live" : "Coming Soon"}
        </span>
        {isActive && <Check className="w-4 h-4 text-indigo-400" />}
      </div>
    </button>
  );
}
