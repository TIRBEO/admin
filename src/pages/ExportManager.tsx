import { useState } from "react";
import { Download, FileSpreadsheet, FileJson, FileText, FileBarChart, Calendar, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function ExportManager() {
  const [exportType, setExportType] = useState("users");
  const [format, setFormat] = useState("csv");
  const [schedule, setSchedule] = useState("one-time");

  const exports = [
    { name: "Users Export", date: "2026-06-27 14:30", size: "2.4 MB", status: "completed" },
    { name: "Analytics Report", date: "2026-06-26 09:15", size: "1.8 MB", status: "completed" },
    { name: "Full Database Backup", date: "2026-06-25 23:00", size: "156 MB", status: "processing" },
  ];

  const formatIcons = { csv: FileSpreadsheet, json: FileJson, pdf: FileText, excel: FileBarChart };
  const statusIcons = { completed: CheckCircle, processing: Loader2 };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Export & Reporting</h1>
        <p className="text-sm text-neutral-500 mt-1">Generate and schedule data exports</p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Generate Export</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Data Type</label>
            <select value={exportType} onChange={(e) => setExportType(e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white">
              <option value="users">Users</option>
              <option value="communities">Communities</option>
              <option value="analytics">Analytics</option>
              <option value="logs">Audit Logs</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF (Report)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Schedule</label>
            <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white">
              <option value="one-time">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm transition-colors">
              <Download className="h-4 w-4" /> Generate Export
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Recent Exports</h3>
        <div className="space-y-2">
          {exports.map((exp) => {
            const Icon = formatIcons[format as keyof typeof formatIcons] || FileText;
            const StatusIcon = statusIcons[exp.status as keyof typeof statusIcons] || CheckCircle;
            return (
              <div key={exp.name} className="flex items-center justify-between rounded-lg bg-neutral-900/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-800"><Icon className="h-4 w-4 text-neutral-400" /></div>
                  <div>
                    <div className="text-sm text-white">{exp.name}</div>
                    <div className="text-xs text-neutral-500 flex items-center gap-2"><Calendar className="h-3 w-3" />{exp.date} &middot; {exp.size}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${exp.status === "completed" ? "text-emerald-400" : "text-blue-400 animate-spin"}`} />
                  <span className={`text-xs ${exp.status === "completed" ? "text-emerald-400" : "text-blue-400"}`}>{exp.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
