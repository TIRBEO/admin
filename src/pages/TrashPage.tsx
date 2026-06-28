import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import { Trash2, RotateCcw, AlertTriangle, FileText, RefreshCw } from "lucide-react";

interface TrashItem {
  id: string;
  entity_type: string;
  title: string;
  deleted_at: string;
}

export default function TrashPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    const { data } = await supabase.from("trash_items")
      .select("*")
      .order("deleted_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchTrash(); }, []);

  const restore = async (id: string) => {
    await supabase.from("trash_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const deletePermanently = async (id: string) => {
    await supabase.from("trash_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (!app) {
    return <div className="p-6 text-center text-neutral-400">App not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
          <Trash2 className="w-6 h-6 text-neutral-400" />
          <h1 className="text-2xl font-semibold tracking-tight text-white">{app.name} Trash</h1>
        </div>
        <button onClick={fetchTrash} className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-sm text-neutral-400">Loading trash...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <Trash2 className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
          <p className="text-sm text-neutral-400">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-neutral-500" />
                <div>
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="text-xs text-neutral-400">Deleted {new Date(item.deleted_at).toLocaleDateString()} &middot; {item.entity_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => restore(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors">
                  <RotateCcw className="w-3 h-3" /> Restore
                </button>
                <button onClick={() => deletePermanently(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors">
                  <AlertTriangle className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
