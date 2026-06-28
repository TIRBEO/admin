import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FAQ } from "@/lib/content";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function FAQPage() {
  const [items, setItems] = useState<FAQ[]>([]);
  const [editing, setEditing] = useState<Partial<FAQ>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("faqs").select("*").order("sort_order");
    if (data) setItems(data);
  };

  const save = async () => {
    if (editing.id) {
      await supabase.from("faqs").update(editing).eq("id", editing.id);
    } else {
      await supabase.from("faqs").insert(editing);
    }
    setShowForm(false); setEditing({}); load();
  };

  const remove = async (id: string) => {
    await supabase.from("faqs").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
        <button onClick={() => { setEditing({ question: "", answer: "", sort_order: items.length, is_active: true }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
          <input placeholder="Question" value={editing.question ?? ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white" />
          <textarea placeholder="Answer" rows={4} value={editing.answer ?? ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white" />
          <input placeholder="Category" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white" />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={() => { setShowForm(false); setEditing({}); }} className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium">{item.question}</span>
              <span className="text-xs text-neutral-500">{item.category}</span>
              <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1 text-neutral-500 hover:text-neutral-300"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(item.id)} className="p-1 text-neutral-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
