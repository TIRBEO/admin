import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { TimelineEvent } from "@/lib/content";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [editing, setEditing] = useState<Partial<TimelineEvent>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("timeline_events").select("*").order("sort_order");
    if (data) setItems(data);
  };

  const save = async () => {
    if (editing.id) await supabase.from("timeline_events").update(editing).eq("id", editing.id);
    else await supabase.from("timeline_events").insert(editing);
    setShowForm(false); setEditing({}); load();
  };

  const remove = async (id: string) => {
    await supabase.from("timeline_events").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <button onClick={() => { setEditing({ year: "", event: "", sort_order: items.length, is_active: true }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <input placeholder="Year" value={editing.year ?? ""} onChange={(e) => setEditing({ ...editing, year: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400" />
          <input placeholder="Event" value={editing.event ?? ""} onChange={(e) => setEditing({ ...editing, event: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400" />
          <textarea placeholder="Description" rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400" />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={() => { setShowForm(false); setEditing({}); }} className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
            <span className="font-mono text-xs text-gray-500 w-12">{item.year}</span>
            <span className="flex-1">{item.event}</span>
            <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1 text-gray-500 hover:text-gray-800"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(item.id)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
