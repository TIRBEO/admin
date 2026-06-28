import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FooterSection, FooterLink } from "@/lib/content";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function FooterPage() {
  const [sections, setSections] = useState<(FooterSection & { links: FooterLink[] })[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: s } = await supabase.from("footer_sections").select("*").order("sort_order");
    const { data: l } = await supabase.from("footer_links").select("*").order("sort_order");
    if (s && l) {
      setSections(s.map((sec) => ({ ...sec, links: l.filter((link) => link.section_id === sec.id) })));
    }
  };

  const addSection = async () => {
    const title = prompt("Section title:");
    if (!title) return;
    await supabase.from("footer_sections").insert({ title, sort_order: sections.length });
    load();
  };

  const addLink = async (sectionId: string) => {
    const label = prompt("Link label:");
    if (!label) return;
    const href = prompt("Link href:");
    if (!href) return;
    await supabase.from("footer_links").insert({ section_id: sectionId, label, href, sort_order: 0 });
    load();
  };

  const removeSection = async (id: string) => {
    await supabase.from("footer_sections").delete().eq("id", id);
    load();
  };

  const removeLink = async (id: string) => {
    await supabase.from("footer_links").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Footer</h1>
        <button onClick={addSection} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>
      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-medium text-sm">{sec.title}</span>
              <button onClick={() => addLink(sec.id)} className="text-xs text-gray-500 hover:text-gray-700 ml-auto"><Plus className="h-3 w-3 inline" /> Add Link</button>
              <button onClick={() => removeSection(sec.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="space-y-1">
              {sec.links.map((link) => (
                <div key={link.id} className="flex items-center gap-3 rounded bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  <span className="flex-1">{link.label}</span>
                  <span>{link.href}</span>
                  <button onClick={() => removeLink(link.id)} className="p-1 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
