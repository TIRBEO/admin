import { useState } from "react";
import { HardDrive, Download, Trash2, AlertTriangle, Plus, RefreshCw } from "lucide-react";

interface Backup {
  id: number;
  name: string;
  size: string;
  created: string;
  type: "full" | "incremental" | "custom";
  status: "success" | "failed" | "processing";
}

export default function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([
    { id: 1, name: "Full Backup - 2026-06-27", size: "256 MB", created: "2026-06-27 00:00", type: "full", status: "success" },
    { id: 2, name: "Incremental Backup - 2026-06-26", size: "12 MB", created: "2026-06-26 12:00", type: "incremental", status: "success" },
    { id: 3, name: "User Data Backup - 2026-06-25", size: "45 MB", created: "2026-06-25 18:30", type: "custom", status: "failed" },
  ]);

  const typeIcons: Record<string, string> = { full: "HardDrive", incremental: "RefreshCw", custom: "HardDrive" };
  const statusColors = {
    success: "bg-emerald-500/10 text-emerald-400",
    failed: "bg-red-500/10 text-red-400",
    processing: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Backup Manager</h1>
          <p className="text-sm text-neutral-500 mt-1">Database backup and restore management</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm text-white transition-colors">
            <Plus className="h-4 w-4" /> Full Backup
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white transition-colors">
            <RefreshCw className="h-4 w-4" /> Incremental
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {backups.map((backup) => (
          <div key={backup.id} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-neutral-800">
                <HardDrive className="h-4 w-4 text-neutral-400" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">{backup.name}</div>
                <div className="text-xs text-neutral-500">{backup.size} &middot; {backup.created}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[backup.status]}`}>{backup.status}</span>
              <button className="text-neutral-400 hover:text-white transition-colors"><Download className="h-4 w-4" /></button>
              <button className="text-neutral-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-medium">Restore Database</h4>
            <p className="text-sm text-neutral-500 mt-1">Restoring will overwrite current data. This action cannot be undone.</p>
            <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white text-sm transition-colors">
              Restore from Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
