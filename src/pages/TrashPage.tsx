import { useParams } from "react-router-dom";
import { useState } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import { Trash2, RotateCcw, AlertTriangle, FileText } from "lucide-react";

export default function TrashPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;

  const [items, setItems] = useState([
    { id: "1", title: "Draft: Welcome Post", deleted_at: "2026-06-26", type: "page" },
    { id: "2", title: "Old FAQ Section", deleted_at: "2026-06-25", type: "section" },
    { id: "3", title: "Testimonial: John D.", deleted_at: "2026-06-24", type: "testimonial" },
  ]);

  const restore = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const deletePermanently = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (!app) {
    return <div className="p-6 text-center text-neutral-500">App not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
        <Trash2 className="w-6 h-6 text-neutral-400" />
        <h1 className="text-2xl font-semibold tracking-tight">{app.name} Trash</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <Trash2 className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
          <p className="text-sm text-neutral-500">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-neutral-600" />
                <div>
                  <p className="text-sm text-neutral-200">{item.title}</p>
                  <p className="text-xs text-neutral-500">Deleted {item.deleted_at}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => restore(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
                <button
                  onClick={() => deletePermanently(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs transition-colors"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
