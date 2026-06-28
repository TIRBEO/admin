import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS, type AppSettingField } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import { Save, Settings } from "lucide-react";

export default function SettingsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!app) return;
    const defaults: Record<string, any> = {};
    Object.values(app.settingsSchema).forEach(section => {
      section.fields.forEach(field => {
        defaults[field.key] = field.default ?? "";
      });
    });
    setValues(defaults);

    supabase.from("app_configs").select("*").eq("app_id", app.id).single().then(({ data }) => {
      if (data?.config) {
        setValues((prev: Record<string, any>) => ({ ...prev, ...data.config }));
      }
    });
  }, [app?.id]);

  const updateValue = (key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_configs").upsert({
      app_id: app!.id,
      config: values,
      updated_at: new Date().toISOString(),
    }, { onConflict: "app_id" });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!app) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>App not found</p>
      </div>
    );
  }

  const schemaKeys = Object.keys(app.settingsSchema);
  if (schemaKeys.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <app.icon className="w-6 h-6 text-gray-500" />
          <h1 className="text-2xl font-semibold tracking-tight">{app.name} Settings</h1>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Configure settings from the app itself.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <app.icon className="w-6 h-6 text-gray-500" />
          <h1 className="text-2xl font-semibold tracking-tight">{app.name} Settings</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {schemaKeys.map(sectionKey => {
          const section = app.settingsSchema[sectionKey];
          return (
            <div key={sectionKey} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-800">{section.label}</h2>
              </div>
              <div className="p-6 space-y-5">
                {section.fields.map(field => (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={values[field.key]}
                    onChange={(v: any) => updateValue(field.key, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldRenderer({ field, value, onChange }: { field: AppSettingField; value: any; onChange: (v: any) => void }) {
  if (field.type === "toggle") {
    return (
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-700">{field.label}</label>
        <button
          onClick={() => onChange(!value)}
          className={`w-10 h-5 rounded-full transition-colors relative ${value ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="block text-sm text-gray-700 mb-1.5">{field.label}</label>
        <select
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        >
          {(field.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div>
        <label className="block text-sm text-gray-700 mb-1.5">{field.label}</label>
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          rows={field.rows || 3}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{field.label}</label>
      <input
        type={field.type === "number" ? "number" : "text"}
        value={value || ""}
        onChange={e => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={field.placeholder}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
      />
    </div>
  );
}
