import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Page, Section, Feature } from "@/lib/content";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export default function PagesList() {
  const [pages, setPages] = useState<Page[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<Section>>({});
  const [editingFeature, setEditingFeature] = useState<Partial<Feature>>({});
  const [features, setFeatures] = useState<Feature[]>([]);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: p } = await supabase.from("pages").select("*").order("slug");
    if (p) setPages(p);
  };

  const togglePage = async (slug: string) => {
    if (expanded === slug) { setExpanded(null); return; }
    setExpanded(slug);
    const { data: s } = await supabase.from("sections").select("*").eq("page_slug", slug).order("sort_order");
    setPages((prev) => prev.map((p) => p.slug === slug ? { ...p, sections: (s as Section[]) || [] } : p));
  };

  const saveSection = async () => {
    const record = { ...editingSection };
    if (record.id) {
      await supabase.from("sections").update(record).eq("id", record.id);
    } else {
      const { data } = await supabase.from("sections").insert(record).select().single();
      if (record.type === "features" && data) {
        setEditingSection(data);
      }
    }
    setShowSectionForm(false); setEditingSection({});
    if (expanded) togglePage(expanded);
  };

  const removeSection = async (id: string) => {
    await supabase.from("sections").delete().eq("id", id);
    if (expanded) togglePage(expanded);
  };

  const loadFeatures = async (sectionId: string) => {
    const { data } = await supabase.from("features").select("*").eq("section_id", sectionId).order("sort_order");
    if (data) setFeatures(data);
  };

  const saveFeature = async () => {
    if (editingFeature.id) {
      await supabase.from("features").update(editingFeature).eq("id", editingFeature.id);
    } else {
      await supabase.from("features").insert(editingFeature);
    }
    setShowFeatureForm(false); setEditingFeature({});
    if (editingFeature.section_id) loadFeatures(editingFeature.section_id);
  };

  const removeFeature = async (id: string) => {
    await supabase.from("features").delete().eq("id", id);
    setFeatures((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Pages</h1>
      <div className="space-y-2">
        {pages.map((page) => (
          <div key={page.id} className="rounded-lg border border-gray-200 bg-white">
            <button onClick={() => togglePage(page.slug)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm">
              {expanded === page.slug ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
              <span className="flex-1 font-medium">{page.title}</span>
              <span className="text-xs text-gray-500">/{page.slug}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${page.is_published ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{page.is_published ? "Published" : "Draft"}</span>
            </button>

            {expanded === page.slug && (
              <div className="border-t border-gray-200 px-4 pb-4 pt-3 space-y-2">
                {page.sections?.map((section) => (
                  <div key={section.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-xs uppercase tracking-wider text-gray-500 w-24">{section.type}</span>
                      <span className="flex-1">{section.title || "Untitled"}</span>
                      {section.type === "features" && (
                        <button onClick={() => { setEditingFeature({ section_id: section.id, title: "", sort_order: 0, is_active: true }); setShowFeatureForm(true); loadFeatures(section.id); }} className="text-xs text-gray-500 hover:text-gray-700">Manage Features</button>
                      )}
                      <button onClick={() => { setEditingSection(section); setShowSectionForm(true); }} className="p-1 text-gray-500 hover:text-gray-700"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => removeSection(section.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                    </div>

                    {showFeatureForm && editingFeature.section_id === section.id && (
                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                        {features.map((f) => (
                          <div key={f.id} className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex-1">{f.title}</span>
                            <button onClick={() => { setEditingFeature(f); }} className="p-1 hover:text-gray-700"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => removeFeature(f.id)} className="p-1 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <input placeholder="Title" value={editingFeature.title ?? ""} onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })} className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900" />
                          <input placeholder="Description" value={editingFeature.description ?? ""} onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })} className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900" />
                          <button onClick={saveFeature} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">Save</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button onClick={() => { setEditingSection({ page_slug: page.slug, type: "hero", title: "", sort_order: (page.sections?.length || 0), is_active: true }); setShowSectionForm(true); }}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mt-2">
                  <Plus className="h-3 w-3" /> Add Section
                </button>

                {showSectionForm && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                    <select value={editingSection.type ?? "hero"} onChange={(e) => setEditingSection({ ...editingSection, type: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900">
                      {["hero", "features", "how-it-works", "testimonials", "faq", "pricing", "cta", "stats", "story", "values", "timeline", "team"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input placeholder="Title" value={editingSection.title ?? ""} onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900" />
                    <input placeholder="Subtitle" value={editingSection.subtitle ?? ""} onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900" />
                    <div className="flex gap-2">
                      <button onClick={saveSection} className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white">Save</button>
                      <button onClick={() => { setShowSectionForm(false); setEditingSection({}); }} className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
