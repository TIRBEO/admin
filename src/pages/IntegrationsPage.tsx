import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import {
  Plug, X, Save, Check, CheckCircle, XCircle, Settings2,
  Bot, MessageSquare, Mail, Database, Cloud, Lock, Globe,
  Webhook, Code, Smartphone, Activity, Zap,
} from "lucide-react";

const AVAILABLE_INTEGRATIONS = [
  { name: "Slack", type: "slack", icon: "MessageSquare", desc: "Send notifications and alerts to Slack channels", color: "bg-[#4A154B]/20 text-[#E01E5A]", config: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }, { key: "channel", label: "Channel", type: "text", placeholder: "#general" }] },
  { name: "Discord", type: "discord", icon: "Bot", desc: "Post messages and updates to Discord servers", color: "bg-[#5865F2]/20 text-[#5865F2]", config: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://discord.com/api/webhooks/..." }, { key: "bot_token", label: "Bot Token", type: "password", placeholder: "Optional bot token" }] },
  { name: "GitHub", type: "github", icon: "Code", desc: "Track issues, PRs, and repository events", color: "bg-gray-100 text-gray-700", config: [{ key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }, { key: "repo", label: "Default Repository", type: "text", placeholder: "owner/repo" }] },
  { name: "GitLab", type: "gitlab", icon: "Code", desc: "Connect with GitLab projects and pipelines", color: "bg-[#FC6D26]/20 text-[#FC6D26]", config: [{ key: "url", label: "GitLab URL", type: "url", placeholder: "https://gitlab.com" }, { key: "token", label: "Access Token", type: "password", placeholder: "glpat-..." }] },
  { name: "Email (SMTP)", type: "email", icon: "Mail", desc: "Send transactional emails via SMTP", color: "bg-blue-500/20 text-blue-400", config: [{ key: "host", label: "SMTP Host", type: "text", placeholder: "smtp.example.com" }, { key: "port", label: "Port", type: "number", placeholder: "587" }, { key: "username", label: "Username", type: "text" }, { key: "password", label: "Password", type: "password" }, { key: "from", label: "From Address", type: "email", placeholder: "noreply@example.com" }] },
  { name: "Resend", type: "resend", icon: "Mail", desc: "Email delivery via Resend API", color: "bg-black/20 text-white", config: [{ key: "api_key", label: "API Key", type: "password", placeholder: "re_..." }, { key: "from", label: "From Address", type: "email", placeholder: "noreply@tirbeo.com" }] },
  { name: "Twilio SMS", type: "twilio", icon: "Smartphone", desc: "SMS notifications via Twilio", color: "bg-[#F22F46]/20 text-[#F22F46]", config: [{ key: "account_sid", label: "Account SID", type: "password" }, { key: "auth_token", label: "Auth Token", type: "password" }, { key: "from_number", label: "From Number", type: "text", placeholder: "+1234567890" }] },
  { name: "SendGrid", type: "sendgrid", icon: "Mail", desc: "Email delivery via Twilio SendGrid", color: "bg-[#1A82E2]/20 text-[#1A82E2]", config: [{ key: "api_key", label: "API Key", type: "password", placeholder: "SG...." }, { key: "from", label: "From Address", type: "email" }] },
  { name: "Stripe", type: "stripe", icon: "Zap", desc: "Payment processing and subscription management", color: "bg-[#635BFF]/20 text-[#635BFF]", config: [{ key: "secret_key", label: "Secret Key", type: "password", placeholder: "sk_live_..." }, { key: "publishable_key", label: "Publishable Key", type: "text", placeholder: "pk_live_..." }, { key: "webhook_secret", label: "Webhook Secret", type: "password" }] },
  { name: "PostHog", type: "posthog", icon: "Activity", desc: "Product analytics and feature flags", color: "bg-[#F7762E]/20 text-[#F7762E]", config: [{ key: "api_key", label: "API Key", type: "password", placeholder: "phx_..." }, { key: "host", label: "Host URL", type: "url", placeholder: "https://app.posthog.com" }] },
  { name: "Sentry", type: "sentry", icon: "Activity", desc: "Error tracking and performance monitoring", color: "bg-[#FB4226]/20 text-[#FB4226]", config: [{ key: "dsn", label: "DSN", type: "password", placeholder: "https://..." }, { key: "org", label: "Organization", type: "text" }, { key: "project", label: "Project", type: "text" }] },
  { name: "Google Analytics", type: "google_analytics", icon: "Globe", desc: "Website traffic and user behavior analytics", color: "bg-[#E37400]/20 text-[#E37400]", config: [{ key: "measurement_id", label: "Measurement ID", type: "text", placeholder: "G-XXXXXXXXXX" }, { key: "api_secret", label: "API Secret", type: "password" }] },
  { name: "OpenAI", type: "openai", icon: "Bot", desc: "AI-powered features using GPT models", color: "bg-[#10A37F]/20 text-[#10A37F]", config: [{ key: "api_key", label: "API Key", type: "password", placeholder: "sk-..." }, { key: "model", label: "Default Model", type: "text", placeholder: "gpt-4o" }, { key: "org_id", label: "Organization ID", type: "text", placeholder: "Optional" }] },
  { name: "Anthropic", type: "anthropic", icon: "Bot", desc: "AI features using Claude models", color: "bg-[#D4A574]/20 text-[#D4A574]", config: [{ key: "api_key", label: "API Key", type: "password", placeholder: "sk-ant-..." }, { key: "model", label: "Default Model", type: "text", placeholder: "claude-sonnet-4-20250514" }] },
  { name: "Supabase", type: "supabase", icon: "Database", desc: "Configure additional Supabase project connections", color: "bg-[#3ECF8E]/20 text-[#3ECF8E]", config: [{ key: "url", label: "Project URL", type: "url", placeholder: "https://xxxxxx.supabase.co" }, { key: "anon_key", label: "Anon Key", type: "password" }, { key: "service_key", label: "Service Role Key", type: "password" }] },
  { name: "Vercel", type: "vercel", icon: "Cloud", desc: "Deployments and environment management", color: "bg-black/20 text-white", config: [{ key: "token", label: "API Token", type: "password", placeholder: "vcp_..." }, { key: "team_id", label: "Team ID", type: "text", placeholder: "Optional" }] },
  { name: "Cloudflare", type: "cloudflare", icon: "Cloud", desc: "CDN, DNS, and edge functions", color: "bg-[#F38020]/20 text-[#F38020]", config: [{ key: "api_token", label: "API Token", type: "password" }, { key: "zone_id", label: "Zone ID", type: "text", placeholder: "Optional" }, { key: "account_id", label: "Account ID", type: "text" }] },
  { name: "AWS", type: "aws", icon: "Cloud", desc: "S3, Lambda, SES and other AWS services", color: "bg-[#FF9900]/20 text-[#FF9900]", config: [{ key: "access_key", label: "Access Key ID", type: "text" }, { key: "secret_key", label: "Secret Access Key", type: "password" }, { key: "region", label: "Default Region", type: "text", placeholder: "us-east-1" }] },
  { name: "Google Cloud", type: "gcp", icon: "Cloud", desc: "Cloud Run, Cloud Storage, and GCP services", color: "bg-[#4285F4]/20 text-[#4285F4]", config: [{ key: "project_id", label: "Project ID", type: "text" }, { key: "client_email", label: "Service Account Email", type: "email" }, { key: "private_key", label: "Private Key", type: "password" }] },
  { name: "YouTube", type: "youtube", icon: "Smartphone", desc: "Video integration and channel management", color: "bg-[#FF0000]/20 text-[#FF0000]", config: [{ key: "api_key", label: "API Key", type: "password" }, { key: "channel_id", label: "Channel ID", type: "text" }] },
  { name: "Twitter/X", type: "twitter", icon: "MessageSquare", desc: "Social media posting and analytics", color: "bg-gray-100 text-gray-700", config: [{ key: "bearer_token", label: "Bearer Token", type: "password" }, { key: "api_key", label: "API Key", type: "password" }, { key: "api_secret", label: "API Secret", type: "password" }] },
  { name: "Figma", type: "figma", icon: "Globe", desc: "Access design files and components", color: "bg-[#F24E1E]/20 text-[#F24E1E]", config: [{ key: "access_token", label: "Access Token", type: "password" }, { key: "file_key", label: "Default File Key", type: "text" }] },
  { name: "Jira", type: "jira", icon: "Code", desc: "Issue tracking and project management", color: "bg-[#0052CC]/20 text-[#0052CC]", config: [{ key: "url", label: "Jira URL", type: "url", placeholder: "https://your-domain.atlassian.net" }, { key: "email", label: "Email", type: "email" }, { key: "api_token", label: "API Token", type: "password" }] },
  { name: "Linear", type: "linear", icon: "Zap", desc: "Issue tracking and product management", color: "bg-[#5E6AD2]/20 text-[#5E6AD2]", config: [{ key: "api_key", label: "API Key", type: "password", placeholder: "lin_api_..." }, { key: "team_id", label: "Team ID", type: "text" }] },
  { name: "Notion", type: "notion", icon: "MessageSquare", desc: "Sync content with Notion databases", color: "bg-white/10 text-white", config: [{ key: "api_key", label: "Integration Token", type: "password", placeholder: "ntn_..." }, { key: "database_id", label: "Database ID", type: "text" }] },
  { name: "Webhook", type: "webhook", icon: "Webhook", desc: "Custom webhook endpoint for events", color: "bg-gray-100 text-gray-700", config: [{ key: "url", label: "Endpoint URL", type: "url", placeholder: "https://example.com/webhook" }, { key: "secret", label: "Secret Key", type: "password", placeholder: "Optional HMAC secret" }, { key: "events", label: "Events to send", type: "text", placeholder: "comma-separated event types" }] },
  { name: "Custom API", type: "custom_api", icon: "Code", desc: "Generic REST API integration", color: "bg-gray-100 text-gray-700", config: [{ key: "base_url", label: "Base URL", type: "url", placeholder: "https://api.example.com" }, { key: "api_key", label: "API Key", type: "password" }, { key: "headers", label: "Custom Headers (JSON)", type: "text", placeholder: '{"X-Custom":"value"}' }] },
  { name: "Zapier", type: "zapier", icon: "Zap", desc: "Connect with 5000+ apps via Zapier", color: "bg-[#FF4A00]/20 text-[#FF4A00]", config: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.zapier.com/..." }, { key: "api_key", label: "API Key", type: "password" }] },
  { name: "Datadog", type: "datadog", icon: "Activity", desc: "Infrastructure and application monitoring", color: "bg-[#632CA6]/20 text-[#632CA6]", config: [{ key: "api_key", label: "API Key", type: "password" }, { key: "app_key", label: "Application Key", type: "password" }, { key: "site", label: "Site", type: "text", placeholder: "datadoghq.com" }] },
  { name: "Logtail", type: "logtail", icon: "Database", desc: "Centralized logging and observability", color: "bg-[#4A4A4A]/20 text-gray-700", config: [{ key: "source_token", label: "Source Token", type: "password" }] },
  { name: "Redis", type: "redis", icon: "Database", desc: "In-memory cache and message broker", color: "bg-[#DC382D]/20 text-[#DC382D]", config: [{ key: "url", label: "Connection URL", type: "url", placeholder: "redis://localhost:6379" }, { key: "password", label: "Password", type: "password" }] },
  { name: "PostgreSQL", type: "postgres", icon: "Database", desc: "Additional database connection", color: "bg-[#336791]/20 text-[#336791]", config: [{ key: "connection_string", label: "Connection String", type: "password", placeholder: "postgresql://user:pass@host:5432/db" }, { key: "max_connections", label: "Max Connections", type: "number", placeholder: "10" }] },
  { name: "MongoDB", type: "mongodb", icon: "Database", desc: "Document database connection", color: "bg-[#47A248]/20 text-[#47A248]", config: [{ key: "uri", label: "Connection URI", type: "password", placeholder: "mongodb+srv://..." }, { key: "database", label: "Database Name", type: "text" }] },
];

const ICONS: Record<string, React.ElementType> = {
  Bot, MessageSquare, Mail, Database, Cloud, Lock, Globe,
  Webhook, Code, Smartphone, Activity, Zap,
};

export default function IntegrationsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;

  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<any | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchIntegrations = async () => {
    setLoading(true);
    const { data } = await supabase.from("integrations").select("*").order("name");
    if (data) setIntegrations(data);
    setLoading(false);
  };

  useEffect(() => { fetchIntegrations(); }, []);

  const toggleConnection = async (id: string, current: boolean) => {
    await supabase.from("integrations").update({ is_connected: !current }).eq("id", id);
    fetchIntegrations();
  };

  const addIntegration = async (tmpl: typeof AVAILABLE_INTEGRATIONS[0]) => {
    const { data: existing } = await supabase.from("integrations")
      .select("id").eq("type", tmpl.type).maybeSingle();
    if (existing) return;
    await supabase.from("integrations").insert({
      name: tmpl.name, type: tmpl.type, is_connected: false, config: {}, webhook_url: null,
    });
    fetchIntegrations();
  };

  const removeIntegration = async (id: string) => {
    await supabase.from("integrations").delete().eq("id", id);
    fetchIntegrations();
  };

  const openConfig = (integration: any) => {
    const tmpl = AVAILABLE_INTEGRATIONS.find(i => i.type === integration.type);
    if (!tmpl) return;
    setConfiguring(integration);
    const defaults: Record<string, string> = {};
    for (const field of tmpl.config) {
      defaults[field.key] = integration.config?.[field.key] || "";
    }
    setConfigForm(defaults);
  };

  const saveConfig = async () => {
    if (!configuring) return;
    setSaving(true);
    await supabase.from("integrations").update({ config: configForm }).eq("id", configuring.id);
    setSaving(false);
    setConfiguring(null);
    fetchIntegrations();
  };

  const connectedTypes = new Set(integrations.map(i => i.type));
  const connected = integrations.filter(i => i.is_connected);
  const disconnected = integrations.filter(i => !i.is_connected);
  const availableToAdd = AVAILABLE_INTEGRATIONS.filter(i => !connectedTypes.has(i.type));

  if (!app) {
    return <div className="p-6 text-center text-gray-500">App not found</div>;
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        {AppIcon && <AppIcon className="w-6 h-6 text-gray-500" />}
        <Plug className="w-6 h-6 text-gray-500" />
        <h1 className="text-2xl font-semibold tracking-tight">{app.name} Integrations</h1>
      </div>

      {/* Config Modal */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg max-h-[80vh] overflow-y-auto m-4 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Configure {configuring.name}</h2>
                <button onClick={() => setConfiguring(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {AVAILABLE_INTEGRATIONS.find(i => i.type === configuring.type)?.config.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm text-gray-500 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={configForm[field.key] || ""}
                      onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setConfiguring(null)} className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={saveConfig} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  <Save className="w-4 h-4" />{saving ? "Saving..." : "Save Config"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white border border-gray-200 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-8">
          {/* Connected Integrations */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Connected</h2>
            {connected.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <Plug className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No integrations connected yet</p>
                <p className="text-xs text-gray-400 mt-1">Add an integration from the marketplace below</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {connected.map(integration => {
                  const tmpl = AVAILABLE_INTEGRATIONS.find(i => i.type === integration.type);
                  const IconComp = ICONS[tmpl?.icon || ""] || Plug;
                  return (
                    <div key={integration.id} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${tmpl?.color || "bg-gray-100"} flex items-center justify-center shrink-0`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">{integration.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{tmpl?.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openConfig(integration)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Configure">
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleConnection(integration.id, true)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg text-xs transition-colors">
                          Disconnect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Disconnected (installed but not connected) */}
          {disconnected.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Installed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {disconnected.map(integration => {
                  const tmpl = AVAILABLE_INTEGRATIONS.find(i => i.type === integration.type);
                  const IconComp = ICONS[tmpl?.icon || ""] || Plug;
                  return (
                    <div key={integration.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${tmpl?.color || "bg-gray-100"} flex items-center justify-center shrink-0`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">{integration.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{tmpl?.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openConfig(integration)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Configure">
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleConnection(integration.id, false)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors">
                          Connect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Marketplace */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Integration Marketplace ({availableToAdd.length} available)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_INTEGRATIONS.map(tmpl => {
                const installed = connectedTypes.has(tmpl.type);
                const IconComp = ICONS[tmpl.icon] || Plug;
                return (
                  <div key={tmpl.type}
                    className={`rounded-xl border p-4 transition-all ${
                      installed
                        ? "border-emerald-200 bg-emerald-50 opacity-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl ${tmpl.color} flex items-center justify-center shrink-0`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">{tmpl.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{tmpl.desc}</p>
                      </div>
                    </div>
                    {installed ? (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                        <Check className="w-3 h-3" /> Installed
                      </div>
                    ) : (
                      <button onClick={() => addIntegration(tmpl)}
                        className="mt-3 w-full px-3 py-1.5 bg-gray-100 hover:bg-blue-600 text-gray-700 hover:text-white rounded-lg text-xs transition-colors">
                        Add Integration
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
