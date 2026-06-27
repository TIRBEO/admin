import { useParams } from "react-router-dom";
import { useState } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import {
  Shield, Key, Lock, Globe, Eye,
  RefreshCw, CheckCircle, XCircle,
} from "lucide-react";

export default function SecurityPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;
  const [rotating, setRotating] = useState(false);
  const [apiKey, setApiKey] = useState("sk-••••••••" + Math.random().toString(36).slice(2, 8));

  const handleRotateKey = () => {
    setRotating(true);
    setTimeout(() => {
      setApiKey("sk-" + Math.random().toString(36).slice(2, 14));
      setRotating(false);
    }, 1000);
  };

  if (!app) {
    return <div className="p-6 text-center text-neutral-500">App not found</div>;
  }

  const sections = [
    {
      icon: Key, label: "API Keys",
      desc: "Manage API keys for external integrations",
      action: { label: rotating ? "Rotating..." : "Rotate Key", onClick: handleRotateKey, disabled: rotating },
      value: apiKey,
    },
    {
      icon: Lock, label: "Authentication",
      desc: "Session timeout, MFA, and password policies",
      items: [
        { label: "Session Duration", value: "24 hours" },
        { label: "MFA Status", value: "Not Required", color: "text-yellow-400" },
        { label: "Password Policy", value: "Strong (12+ chars)" },
      ],
    },
    {
      icon: Globe, label: "CORS & Domains",
      desc: "Allowed origins and redirect URLs",
      items: [
        { label: "Allowed Origins", value: "3 domains" },
        { label: "Redirect URLs", value: "5 URLs configured" },
      ],
    },
    {
      icon: Eye, label: "Audit Trail",
      desc: "All security-related events are logged",
      items: [
        { label: "Failed Logins (24h)", value: "0" },
        { label: "API Key Usage (7d)", value: "1,234 requests" },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
        <Shield className="w-6 h-6 text-neutral-400" />
        <h1 className="text-2xl font-semibold tracking-tight">{app.name} Security</h1>
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.label} className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-200">{section.label}</h3>
                    <p className="text-xs text-neutral-500">{section.desc}</p>
                  </div>
                </div>
                {section.action && (
                  <button
                    onClick={section.action.onClick}
                    disabled={section.action.disabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${section.action.disabled ? "animate-spin" : ""}`} />
                    {section.action.label}
                  </button>
                )}
              </div>
              {section.value && (
                <div className="bg-neutral-950 rounded-lg px-3 py-2 font-mono text-xs text-neutral-400 break-all">
                  {section.value}
                </div>
              )}
              {section.items && (
                <div className="space-y-2">
                  {section.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1">
                      <span className="text-xs text-neutral-500">{item.label}</span>
                      <span className={`text-xs font-medium ${item.color || "text-neutral-300"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
