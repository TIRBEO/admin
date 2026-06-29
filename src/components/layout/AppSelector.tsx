import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search, Grid } from "lucide-react";
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

  const currentAppConfig = APPS[currentApp];
  const CurrentIcon = currentAppConfig?.icon;

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

  const visibleApps = APP_OPTIONS;
  const filteredApps = visibleApps.filter(app =>
    app.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-soft hover:bg-secondary rounded-lg transition-colors"
        >
          {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
          <span className="font-medium text-foreground/80">{currentAppConfig?.name || "Select App"}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-ink-soft transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50">
            <div className="p-2">
              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
                <input
                  type="text" placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-background rounded-lg text-sm text-foreground placeholder:text-ink-soft/50 border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {recentApps.length > 0 && !searchQuery && (
                <>
                  <div className="px-3 py-1 text-xs font-medium text-ink-soft">Recent</div>
                  {recentApps
                    .filter(id => visibleApps.some(app => app.value === id))
                    .slice(0, 3)
                    .map(appId => (
                      <AppOption key={appId} appId={appId} isActive={appId === currentApp} onClick={() => handleAppSelect(appId)} />
                    ))}
                  <div className="h-px bg-border my-1" />
                </>
              )}

              <div className="px-3 py-1 text-xs font-medium text-ink-soft">
                {searchQuery ? "Results" : "All Apps"}
              </div>
              {filteredApps.map(({ value: appId }) => (
                <AppOption key={appId} appId={appId} isActive={appId === currentApp} onClick={() => handleAppSelect(appId)} />
              ))}

              {filteredApps.length === 0 && (
                <div className="px-3 py-4 text-center text-ink-soft text-sm">No apps found</div>
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
  const AppIcon = app.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-600/10 text-blue-400"
          : "text-foreground/80 hover:bg-secondary"
      }`}
    >
      <AppIcon className="h-5 w-5 shrink-0" />
      <div className="flex-1 text-left">
        <div className="text-sm font-medium">{app.name}</div>
        <div className="text-xs text-ink-soft truncate">{app.description}</div>
      </div>
      {isActive && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
    </button>
  );
}
