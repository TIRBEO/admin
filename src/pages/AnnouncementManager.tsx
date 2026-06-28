import { useState, useEffect } from "react";
import { Megaphone, Info, AlertTriangle, XCircle, CheckCircle, Edit2, Plus, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "error" | "success";
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

const typeIcons = { info: Info, warning: AlertTriangle, error: XCircle, success: CheckCircle };
const typeColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400",
  warning: "bg-amber-500/10 text-amber-400",
  error: "bg-red-500/10 text-red-400",
  success: "bg-emerald-500/10 text-emerald-400",
};

const emptyForm = { title: "", content: "", type: "info" as const, is_active: true, starts_at: new Date().toISOString().slice(0, 16), ends_at: "" };

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const createAnnouncement = async () => {
    if (!form.title.trim()) return;
    const { data } = await supabase.from("announcements").insert({
      title: form.title,
      content: form.content,
      type: form.type,
      is_active: form.is_active,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
    }).select().single();
    if (data) setAnnouncements(prev => [data, ...prev]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("announcements").update({ is_active: active }).eq("id", id);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: active } : a));
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcement Banner</h1>
          <p className="text-sm text-neutral-500 mt-1">Create and manage global announcements across all apps</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnnouncements} className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm text-white transition-colors">
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        </div>
      </div>

      {/* New Announcement Form */}
      {showForm && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Announcement title" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Message</label>
              <textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={2}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Announcement message" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Starts At</label>
                <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Ends At (optional)</label>
                <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-neutral-700 bg-neutral-900 text-indigo-600" />
                <span className="text-xs text-neutral-400">Active immediately</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={createAnnouncement} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm transition-colors">Create</button>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-neutral-500 text-sm">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">No announcements yet. Create one above.</div>
        ) : announcements.map((ann) => {
          const Icon = typeIcons[ann.type] || Info;
          return (
            <div key={ann.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-2 rounded-lg ${typeColors[ann.type] || typeColors.info}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${ann.is_active ? "bg-emerald-400" : "bg-neutral-600"}`} />
                    <h4 className="text-white font-medium text-sm">{ann.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[ann.type] || typeColors.info}`}>{ann.type}</span>
                  </div>
                  <p className="text-neutral-400 text-sm mt-1">{ann.content}</p>
                  <div className="text-xs text-neutral-500 mt-1">
                    {new Date(ann.starts_at).toLocaleDateString()}
                    {ann.ends_at ? ` → ${new Date(ann.ends_at).toLocaleDateString()}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => toggleActive(ann.id, !ann.is_active)} className={`text-xs px-2 py-1 rounded-lg transition-colors ${ann.is_active ? "text-amber-400 hover:bg-amber-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}>
                  {ann.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteAnnouncement(ann.id)} className="text-neutral-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
