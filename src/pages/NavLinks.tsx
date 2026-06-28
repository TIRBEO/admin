import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { NavLink } from "@/lib/content";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

export default function NavLinksPage() {
  const [items, setItems] = useState<NavLink[]>([]);
  const [editing, setEditing] = useState<Partial<NavLink>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("nav_links").select("*").order("sort_order", { ascending: true });
    if (data) setItems(data);
  };

  const save = async () => {
    if (editing.id) {
      await supabase.from("nav_links").update(editing).eq("id", editing.id);
    } else {
      await supabase.from("nav_links").insert(editing);
    }
    setShowForm(false);
    setEditing({});
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("nav_links").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Navigation Links</h1>
        <button onClick={() => { setEditing({ label: "", href: "", sort_order: items.length, is_active: true }); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Link
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <input placeholder="Label" value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
          <input placeholder="Href" value={editing.href ?? ""} onChange={(e) => setEditing({ ...editing, href: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={() => { setShowForm(false); setEditing({}); }} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
            <GripVertical className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="flex-1">{item.label}</span>
            <span className="text-gray-500 text-xs">{item.href}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{item.is_active ? "Active" : "Inactive"}</span>
            <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1 text-gray-500 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(item.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
