import { useParams } from "react-router-dom";
import { useState } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { Plug, Webhook, Bot, Globe, Code, ExternalLink, CheckCircle, XCircle } from "lucide-react";

export default function IntegrationsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;
  const [integrations] = useState([
    { name: "Slack", icon: Bot, connected: false, desc: "Post messages to Slack channels" },
    { name: "Discord", icon: Bot, connected: false, desc: "Sync with Discord communities" },
    { name: "GitHub", icon: Code, connected: false, desc: "Link repositories and track issues" },
    { name: "Webhook URL", icon: Webhook, connected: true, desc: "Send events to any HTTP endpoint" },
    { name: "Custom API", icon: Globe, connected: true, desc: "REST API for custom integrations" },
  ]);

  if (!app) {
    return <div className="p-6 text-center text-neutral-500">App not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
        <Plug className="w-6 h-6 text-neutral-400" />
        <h1 className="text-2xl font-semibold tracking-tight">{app.name} Integrations</h1>
      </div>

      <div className="space-y-3">
        {integrations.map(integration => (
          <div key={integration.name} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                <integration.icon className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-200">{integration.name}</h3>
                <p className="text-xs text-neutral-500">{integration.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {integration.connected ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <XCircle className="w-3.5 h-3.5" />
                  Not Connected
                </span>
              )}
              <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors">
                {integration.connected ? "Configure" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
