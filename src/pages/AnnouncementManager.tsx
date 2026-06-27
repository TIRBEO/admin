import { useState } from "react";
import { Megaphone, Info, AlertTriangle, XCircle, CheckCircle, Edit2, Plus } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  startDate: string;
  endDate: string;
  active: boolean;
  target: string;
}

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: 1, title: "New Feature: Dark Mode", message: "Dark mode is now available for all users!", type: "info", startDate: "2026-06-01", endDate: "2026-07-01", active: true, target: "all" },
    { id: 2, title: "Scheduled Maintenance", message: "System maintenance on June 28th at 2AM UTC", type: "warning", startDate: "2026-06-25", endDate: "2026-06-28", active: true, target: "admins" },
  ]);

  const typeIcons = { info: Info, warning: AlertTriangle, error: XCircle, success: CheckCircle };
  const typeColors = {
    info: "bg-blue-500/10 text-blue-400",
    warning: "bg-amber-500/10 text-amber-400",
    error: "bg-red-500/10 text-red-400",
    success: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcement Banner</h1>
          <p className="text-sm text-neutral-500 mt-1">Create and manage global announcements across all apps</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm text-white transition-colors">
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      <div className="space-y-3">
        {announcements.map((ann) => {
          const Icon = typeIcons[ann.type];
          return (
            <div key={ann.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-2 rounded-lg ${typeColors[ann.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${ann.active ? "bg-emerald-400" : "bg-neutral-600"}`} />
                    <h4 className="text-white font-medium text-sm">{ann.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[ann.type]}`}>{ann.type}</span>
                  </div>
                  <p className="text-neutral-400 text-sm mt-1">{ann.message}</p>
                  <div className="text-xs text-neutral-500 mt-1">{ann.startDate} &rarr; {ann.endDate} &middot; Target: {ann.target}</div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button className="text-neutral-400 hover:text-white transition-colors"><Edit2 className="h-4 w-4" /></button>
                <button className="text-neutral-400 hover:text-red-400 transition-colors"><XCircle className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
