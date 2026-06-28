import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import {
  Shield, Key, Lock, Globe, Eye, Smartphone, MessageSquare, Fingerprint,
  RefreshCw, CheckCircle, XCircle, Copy, Check, Plus, Trash2,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key_value: string;
  prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface AuthSettings {
  mfa_enabled: boolean;
  mfa_methods: string[];
  phone_verification_enabled: boolean;
  otp_verification_enabled: boolean;
  session_duration_hours: number;
  password_min_length: number;
  max_login_attempts: number;
}

const DEFAULT_AUTH: AuthSettings = {
  mfa_enabled: false,
  mfa_methods: ["totp"],
  phone_verification_enabled: false,
  otp_verification_enabled: true,
  session_duration_hours: 72,
  password_min_length: 8,
  max_login_attempts: 5,
};

function AuditTrailSection() {
  const [failedLogins, setFailedLogins] = useState<number | null>(null);
  const [apiKeyUsage, setApiKeyUsage] = useState<number | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    supabase.from("admin_audit_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday)
      .eq("action", "login_failed")
      .then(({ count }) => setFailedLogins(count ?? 0));

    supabase.from("admin_audit_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo)
      .eq("action", "api_key_used")
      .then(({ count }) => setApiKeyUsage(count ?? 0));

    supabase.from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentEvents(data || []));
  }, []);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
            <Eye className="w-4 h-4 text-neutral-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Audit Trail</h3>
            <p className="text-xs text-neutral-400">All security-related events are logged</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-neutral-400">Failed Logins (24h)</span>
            <span className="text-xs text-neutral-300">{failedLogins !== null ? failedLogins : "..."}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-neutral-400">API Key Usage (7d)</span>
            <span className="text-xs text-neutral-300">{apiKeyUsage !== null ? `${apiKeyUsage} requests` : "..."}</span>
          </div>
          {recentEvents.length > 0 && (
            <div className="border-t border-neutral-800 pt-3 mt-3 space-y-1.5">
              <p className="text-xs text-neutral-400 font-medium">Recent Events</p>
              {recentEvents.map((ev: any) => (
                <div key={ev.id} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 truncate max-w-[200px]">{ev.action}</span>
                  <span className="text-neutral-500">{new Date(ev.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [authSettings, setAuthSettings] = useState<AuthSettings>(DEFAULT_AUTH);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [savingAuth, setSavingAuth] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [rotatingKey, setRotatingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
    fetchAuthSettings();
  }, []);

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    if (data) setApiKeys(data);
    setLoadingKeys(false);
  };

  const fetchAuthSettings = async () => {
    setLoadingAuth(true);
    const { data } = await supabase.from("auth_settings").select("*").single();
    if (data) {
      setAuthSettings({
        mfa_enabled: data.mfa_enabled,
        mfa_methods: data.mfa_methods || ["totp"],
        phone_verification_enabled: data.phone_verification_enabled,
        otp_verification_enabled: data.otp_verification_enabled,
        session_duration_hours: data.session_duration_hours,
        password_min_length: data.password_min_length,
        max_login_attempts: data.max_login_attempts,
      });
    }
    setLoadingAuth(false);
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) return;
    const prefix = "tb_" + Math.random().toString(36).slice(2, 6);
    const keyValue = prefix + "_" + Array.from({ length: 48 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
    ).join("");

    const { data } = await supabase.from("api_keys").insert({
      name: newKeyName,
      key_value: keyValue,
      prefix,
      is_active: true,
    }).select().single();

    if (data) {
      setApiKeys(prev => [data, ...prev]);
      setShowNewKey(data.id);
      setNewKeyName("");
    }
  };

  const rotateKey = async (id: string) => {
    setRotatingKey(id);
    const prefix = "tb_" + Math.random().toString(36).slice(2, 6);
    const keyValue = prefix + "_" + Array.from({ length: 48 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
    ).join("");

    await supabase.from("api_keys").update({ key_value: keyValue, prefix }).eq("id", id);
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, key_value: keyValue, prefix } : k));
    setShowNewKey(id);
    setRotatingKey(null);
  };

  const toggleKeyActive = async (id: string, active: boolean) => {
    await supabase.from("api_keys").update({ is_active: active }).eq("id", id);
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: active } : k));
  };

  const deleteKey = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const copyToClipboard = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const saveAuthSettings = async () => {
    setSavingAuth(true);
    await supabase.from("auth_settings").update({
      mfa_enabled: authSettings.mfa_enabled,
      mfa_methods: authSettings.mfa_methods,
      phone_verification_enabled: authSettings.phone_verification_enabled,
      otp_verification_enabled: authSettings.otp_verification_enabled,
      session_duration_hours: authSettings.session_duration_hours,
      password_min_length: authSettings.password_min_length,
      max_login_attempts: authSettings.max_login_attempts,
    }).eq("id", (await supabase.from("auth_settings").select("id").single()).data?.id);
    setSavingAuth(false);
  };

  const toggleMfaMethod = (method: string) => {
    setAuthSettings(prev => ({
      ...prev,
      mfa_methods: prev.mfa_methods.includes(method)
        ? prev.mfa_methods.filter(m => m !== method)
        : [...prev.mfa_methods, method],
    }));
  };

  if (!app) {
    return <div className="p-6 text-center text-neutral-400">App not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
        <Shield className="w-6 h-6 text-neutral-400" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">{app.name} Security</h1>
      </div>

      {/* ───── API KEYS ───── */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden mb-4">
        <div className="p-5 border-b border-neutral-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
                <Key className="w-4 h-4 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">API Keys</h3>
                <p className="text-xs text-neutral-400">Manage API keys for external integrations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-b border-neutral-800">
          <div className="flex gap-3">
            <input
              type="text" placeholder="New key name..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateKey()}
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button onClick={generateKey} disabled={!newKeyName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm transition-colors">
              <Plus className="h-4 w-4" /> Generate
            </button>
          </div>
        </div>

        <div className="divide-y divide-neutral-800">
          {loadingKeys ? (
            <div className="p-6 text-center text-sm text-neutral-400">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="p-6 text-center text-sm text-neutral-400">No API keys yet. Create one above.</div>
          ) : apiKeys.map(key => (
            <div key={key.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{key.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${key.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-400"}`}>
                      {key.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">Created {new Date(key.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => rotateKey(key.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors">
                    <RefreshCw className={`h-3 w-3 ${rotatingKey === key.id ? "animate-spin" : ""}`} /> Rotate
                  </button>
                  <button onClick={() => toggleKeyActive(key.id, !key.is_active)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors">
                    {key.is_active ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    {key.is_active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => deleteKey(key.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2 font-mono text-xs text-neutral-400 break-all">
                <span>{showNewKey === key.id ? key.key_value : key.prefix + "_••••••••••••••••••••"}</span>
                <button onClick={() => setShowNewKey(showNewKey === key.id ? null : key.id)} className="shrink-0 text-neutral-400 hover:text-neutral-300">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => copyToClipboard(key.key_value, key.id)} className="shrink-0 text-neutral-400 hover:text-neutral-300">
                  {copiedKey === key.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              {key.last_used_at && <p className="text-xs text-neutral-500 mt-1">Last used: {new Date(key.last_used_at).toLocaleString()}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ───── AUTHENTICATION ───── */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden mb-4">
        <div className="p-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Lock className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Authentication</h3>
              <p className="text-xs text-neutral-400">Session, MFA, password, and verification settings</p>
            </div>
          </div>
        </div>

        {loadingAuth ? (
          <div className="p-6 text-center text-sm text-neutral-400">Loading auth settings...</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Session Duration */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-neutral-300">Session Duration</span>
                <p className="text-xs text-neutral-400">Maximum session length before re-authentication</p>
              </div>
              <select value={authSettings.session_duration_hours} onChange={(e) => setAuthSettings(prev => ({ ...prev, session_duration_hours: Number(e.target.value) }))}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white">
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>72 hours</option>
                <option value={168}>7 days</option>
                <option value={720}>30 days</option>
              </select>
            </div>

            {/* Password Policy */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-neutral-300">Min Password Length</span>
                <p className="text-xs text-neutral-400">Minimum characters required for passwords</p>
              </div>
              <input type="number" min={4} max={64} value={authSettings.password_min_length}
                onChange={(e) => setAuthSettings(prev => ({ ...prev, password_min_length: Number(e.target.value) }))}
                className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white text-center" />
            </div>

            {/* Max Login Attempts */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-neutral-300">Max Login Attempts</span>
                <p className="text-xs text-neutral-400">Failed attempts before temporary lockout</p>
              </div>
              <input type="number" min={1} max={20} value={authSettings.max_login_attempts}
                onChange={(e) => setAuthSettings(prev => ({ ...prev, max_login_attempts: Number(e.target.value) }))}
                className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white text-center" />
            </div>

            {/* MFA Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Fingerprint className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <span className="text-sm text-neutral-300">Multi-Factor Authentication</span>
                  <p className="text-xs text-neutral-400">Require MFA for admin accounts</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={authSettings.mfa_enabled}
                  onChange={(e) => setAuthSettings(prev => ({ ...prev, mfa_enabled: e.target.checked }))}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* MFA Methods */}
            {authSettings.mfa_enabled && (
              <div className="pl-7 space-y-3">
                <p className="text-xs text-neutral-400">Allowed MFA Methods</p>
                {[
                  { value: "totp", label: "Authenticator App (TOTP)", icon: Smartphone },
                  { value: "sms", label: "SMS Code", icon: MessageSquare },
                ].map(method => (
                  <label key={method.value} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={authSettings.mfa_methods.includes(method.value)}
                      onChange={() => toggleMfaMethod(method.value)}
                      className="rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-blue-500" />
                    <method.icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-300">{method.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Phone Verification */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <span className="text-sm text-neutral-300">Phone Verification</span>
                  <p className="text-xs text-neutral-400">Collect and verify phone numbers during signup</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={authSettings.phone_verification_enabled}
                  onChange={(e) => setAuthSettings(prev => ({ ...prev, phone_verification_enabled: e.target.checked }))}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* OTP Verification Code */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <span className="text-sm text-neutral-300">6-Digit OTP Verification</span>
                  <p className="text-xs text-neutral-400">Use 6-digit codes instead of magic links for email verification</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={authSettings.otp_verification_enabled}
                  onChange={(e) => setAuthSettings(prev => ({ ...prev, otp_verification_enabled: e.target.checked }))}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <button onClick={saveAuthSettings} disabled={savingAuth}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm transition-colors">
                {savingAuth ? "Saving..." : "Save Auth Settings"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ───── CORS & DOMAINS ───── */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden mb-4">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Globe className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">CORS & Domains</h3>
              <p className="text-xs text-neutral-400">Allowed origins and redirect URLs</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-neutral-400">Allowed Origins</span>
              <span className="text-xs text-neutral-300">3 domains</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-neutral-400">Redirect URLs</span>
              <span className="text-xs text-neutral-300">5 URLs configured</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───── AUDIT TRAIL ───── */}
      <AuditTrailSection />
    </div>
  );
}
