import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APPS } from "../lib/apps.config";

interface AppState {
  currentApp: string;
  recentApps: string[];
  appSettings: Record<string, Record<string, any>>;
  setCurrentApp: (appId: string) => void;
  setRecentApp: (appId: string) => void;
  getAppSettings: (appId: string) => Record<string, any>;
  updateAppSettings: (appId: string, settings: Record<string, any>) => void;
  resetAppSettings: (appId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentApp: "company",
      recentApps: ["company", "chat"],
      appSettings: {},

      setCurrentApp: (appId: string) => {
        set({ currentApp: appId });
        get().setRecentApp(appId);
      },

      setRecentApp: (appId: string) => {
        const { recentApps } = get();
        const filtered = recentApps.filter(id => id !== appId);
        set({ recentApps: [appId, ...filtered].slice(0, 5) });
      },

      getAppSettings: (appId: string) => {
        const { appSettings } = get();
        const app = APPS[appId];
        if (!app) return {};

        const defaults: Record<string, any> = {};
        Object.values(app.settingsSchema).forEach(section => {
          section.fields.forEach(field => {
            if (field.default !== undefined) {
              defaults[field.key] = field.default;
            }
          });
        });

        return { ...defaults, ...appSettings[appId] };
      },

      updateAppSettings: (appId: string, settings: Record<string, any>) => {
        const { appSettings } = get();
        set({
          appSettings: {
            ...appSettings,
            [appId]: { ...appSettings[appId], ...settings },
          },
        });
      },

      resetAppSettings: (appId: string) => {
        const { appSettings } = get();
        const newSettings = { ...appSettings };
        delete newSettings[appId];
        set({ appSettings: newSettings });
      },
    }),
    {
      name: "tirbeo-admin-storage",
    }
  )
);
