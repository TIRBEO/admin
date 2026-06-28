import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PricingPlan } from "@/lib/content";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function PricingPage() {
  const [items, setItems] = useState<PricingPlan[]>([]);
  const [editing, setEditing] = useState<Partial<PricingPlan>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("pricing_plans").select("*").order("sort_order");
    if (data) setItems(data);
  };

  const save = async () => {
    const record = { ...editing };
    if (record.features && typeof record.features === "string") {
      record.features = (record.features as string).split("\n").map((f) => f.trim()).filter(Boolean);
    }
    if (record.id) await supabase.from("pricing_plans").update(record).eq("id", record.id);
    else await supabase.from("pricing_plans").insert(record);
    setShowForm(false); setEditing({}); load();
  };

  const remove = async (id: string) => {
    await supabase.from("pricing_plans").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pricing Plans</h1>
        <button onClick={() => { setEditing({ name: "", price_monthly: 0, price_yearly: 0, features: [], sort_order: items.length, is_active: true, cta_label: "Get Started" }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>
      {showForm && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
          <input placeholder="Plan Name" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600" />
          <input placeholder="Description" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-neutral-500">Monthly Price</label><input type="number" value={editing.price_monthly ?? 0} onChange={(e) => setEditing({ ...editing, price_monthly: Number(e.target.value) })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 mt-1" /></div>
            <div><label className="text-xs text-neutral-500">Yearly Price</label><input type="number" value={editing.price_yearly ?? 0} onChange={(e) => setEditing({ ...editing, price_yearly: Number(e.target.value) })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 mt-1" /></div>
          </div>
          <div><label className="text-xs text-neutral-500">Features (one per line)</label>
            <textarea rows={4} value={Array.isArray(editing.features) ? editing.features.join("\n") : ""} onChange={(e) => setEditing({ ...editing, features: e.target.value.split("\n").map((f) => f.trim()).filter(Boolean) })} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={editing.is_popular ?? false} onChange={(e) => setEditing({ ...editing, is_popular: e.target.checked })} className="rounded" />
            <label className="text-xs text-neutral-500">Popular plan</label>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={() => { setShowForm(false); setEditing({}); }} className="rounded-lg bg-neutral-950 border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl border p-4 text-sm ${item.is_popular ? "border-blue-500 bg-blue-500/10" : "border-neutral-800 bg-neutral-900"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                {item.is_popular && <span className="text-[10px] text-amber-700">Popular</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1 text-neutral-500 hover:text-white"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => remove(item.id)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            <p className="text-lg font-semibold">${item.price_monthly}<span className="text-xs text-neutral-500 font-normal">/mo</span></p>
            <p className="text-xs text-neutral-500 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
