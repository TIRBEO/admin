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
    return <div className="p-6 text-center text-gray-500">App not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {AppIcon && <AppIcon className="w-6 h-6 text-gray-500" />}
          <Trash2 className="w-6 h-6 text-gray-500" />
          <h1 className="text-2xl font-semibold tracking-tight">{app.name} Trash</h1>
        </div>
        <button onClick={fetchTrash} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">Loading trash...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Trash2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-500">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">Deleted {new Date(item.deleted_at).toLocaleDateString()} &middot; {item.entity_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => restore(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-colors">
                  <RotateCcw className="w-3 h-3" /> Restore
                </button>
                <button onClick={() => deletePermanently(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs transition-colors">
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
