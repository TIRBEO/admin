import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SiteConfig } from "@/lib/content";

export default function SiteConfigPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("site_config").select("*").single().then(({ data }) => setConfig(data));
  }, []);

  const update = (key: string, value: string) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase.from("site_config").update(config).eq("id", 1);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  if (!config) return <p className="text-neutral-400">Loading...</p>;

  const fields = [
    { key: "site_name", label: "Site Name" },
    { key: "tagline", label: "Tagline" },
    { key: "logo_url", label: "Logo URL" },
    { key: "favicon_url", label: "Favicon URL" },
    { key: "seo_title", label: "SEO Title" },
    { key: "seo_description", label: "SEO Description", rows: 3 },
    { key: "seo_keywords", label: "SEO Keywords" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Site Configuration</h1>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50 transition-colors">
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-neutral-300 mb-1">{f.label}</label>
            {"rows" in f ? (
              <textarea value={(config as any)[f.key] ?? ""} onChange={(e) => update(f.key, e.target.value)} rows={f.rows} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            ) : (
              <input value={(config as any)[f.key] ?? ""} onChange={(e) => update(f.key, e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
