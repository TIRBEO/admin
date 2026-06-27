import { useParams } from "react-router-dom";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { ChatSettings } from "../settings/ChatSettings";

export default function SettingsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];

  if (!app) {
    return (
      <div className="p-6 text-center text-neutral-500">
        <p>App not found</p>
      </div>
    );
  }

  if (app.id === "chat") return <ChatSettings />;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">{app.icon} {app.name} Settings</h1>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center text-neutral-500">
        <p>Settings for this app are not yet implemented.</p>
      </div>
    </div>
  );
}
