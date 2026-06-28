import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { Save, RefreshCw } from "lucide-react";
import type { AppSettingField } from "../lib/apps.config";

export function CompanySettings() {
  const { admin } = useAuth();
  const { getAppSettings, updateAppSettings } = useAppStore();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getAppSettings("company"));
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    updateAppSettings("company", settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const app = APPS.company;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <app.icon className="w-6 h-6 text-neutral-400" />
            <h1 className="text-2xl font-semibold tracking-tight">Company Settings</h1>
          </div>
          <p className="text-sm text-neutral-500 mt-1">Configure company info, branding, and contact details</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-emerald-400 text-sm">✓ Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(app.settingsSchema).map(([sectionKey, section]) => (
          <div key={sectionKey} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{section.label}</h2>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <FieldRenderer field={field} value={settings[field.key] ?? field.default} onChange={(v) => handleChange(field.key, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldRenderer({ field, value, onChange }: { field: AppSettingField; value: any; onChange: (v: any) => void }) {
  switch (field.type) {
    case "text":
    case "email":
    case "url":
      return (
        <input
          type={field.type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
        />
      );
    case "textarea":
      return (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 4}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
        />
      );
    case "toggle":
      return (
        <button
          onClick={() => onChange(!value)}
          className={`relative w-12 h-6 rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-neutral-600"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-neutral-200 transition-transform ${value ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      );
    case "select":
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
        >
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case "multiselect": {
      const selected = value || [];
      return (
        <div className="flex flex-wrap gap-2">
          {field.options?.map(opt => (
            <button
              key={opt}
              onClick={() => {
                const next = selected.includes(opt)
                  ? selected.filter((v: string) => v !== opt)
                  : [...selected, opt];
                onChange(next);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selected.includes(opt)
                  ? "bg-indigo-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}
