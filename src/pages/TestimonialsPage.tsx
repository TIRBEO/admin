import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Testimonial } from "@/lib/content";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Partial<Testimonial>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("sort_order");
    if (data) setItems(data);
  };

  const save = async () => {
    if (editing.id) await supabase.from("testimonials").update(editing).eq("id", editing.id);
    else await supabase.from("testimonials").insert(editing);
    setShowForm(false); setEditing({}); load();
  };

  const remove = async (id: string) => {
    await supabase.from("testimonials").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
        <button onClick={() => { setEditing({ quote: "", author: "", sort_order: items.length, is_active: true }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <textarea placeholder="Quote" rows={3} value={editing.quote ?? ""} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400" />
          <input placeholder="Author" value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400" />
          <input placeholder="Role" value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400" />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={() => { setShowForm(false); setEditing({}); }} className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
            <p className="text-gray-700 italic mb-2">"{item.quote}"</p>
            <p className="text-xs text-gray-500">— {item.author}{item.role ? `, ${item.role}` : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
