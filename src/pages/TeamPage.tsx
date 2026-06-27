import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/lib/content";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<Partial<TeamMember>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("team_members").select("*").order("sort_order");
    if (data) setMembers(data);
  };

  const save = async () => {
    const record = { ...editing };
    if (record.id) {
      await supabase.from("team_members").update(record).eq("id", record.id);
    } else {
      await supabase.from("team_members").insert(record);
    }
    setShowForm(false); setEditing({}); load();
  };

  const remove = async (id: string) => {
    await supabase.from("team_members").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
        <button onClick={() => { setEditing({ name: "", role: "", bio: "", color: "#6366f1", sort_order: members.length, is_active: true }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200">
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
          <input placeholder="Name" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm" />
          <input placeholder="Role" value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm" />
          <textarea placeholder="Bio" rows={3} value={editing.bio ?? ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm" />
          <input placeholder="Color" value={editing.color ?? "#6366f1"} onChange={(e) => setEditing({ ...editing, color: e.target.value })} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200">Save</button>
            <button onClick={() => { setShowForm(false); setEditing({}); }} className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-3 text-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: m.color || "#6366f1" }}>
              {m.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-neutral-500">{m.role}</p>
            </div>
            <button onClick={() => { setEditing(m); setShowForm(true); }} className="p-1 text-neutral-500 hover:text-neutral-200"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(m.id)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
