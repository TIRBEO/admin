import { useParams } from "react-router-dom";
import { useState } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { FileBarChart, Download, Calendar, FileText, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;

  const [reports] = useState([
    { name: "User Activity Report", type: "PDF", date: "2026-06-25", size: "2.4 MB" },
    { name: "Content Summary", type: "CSV", date: "2026-06-24", size: "1.1 MB" },
    { name: "Monthly Analytics", type: "PDF", date: "2026-06-01", size: "4.7 MB" },
    { name: "Audit Log Export", type: "JSON", date: "2026-05-28", size: "8.3 MB" },
  ]);

  if (!app) {
    return <div className="p-6 text-center text-neutral-500">App not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
        <FileBarChart className="w-6 h-6 text-neutral-400" />
        <h1 className="text-2xl font-semibold tracking-tight">{app.name} Reports</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Generate PDF", icon: FileText, desc: "Full report with charts" },
          { label: "Export CSV", icon: FileSpreadsheet, desc: "Raw data in spreadsheet" },
          { label: "Schedule Report", icon: Calendar, desc: "Recurring delivery" },
        ].map(action => (
          <button key={action.label} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left hover:bg-neutral-800/50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center mb-3">
              <action.icon className="w-4 h-4 text-neutral-400" />
            </div>
            <h3 className="text-sm font-medium text-neutral-200 mb-1">{action.label}</h3>
            <p className="text-xs text-neutral-500">{action.desc}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-200">Recent Reports</h2>
        </div>
        <div className="divide-y divide-neutral-800">
          {reports.map(report => (
            <div key={report.name} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-neutral-600" />
                <div>
                  <p className="text-sm text-neutral-200">{report.name}</p>
                  <p className="text-xs text-neutral-500">{report.date} &middot; {report.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">{report.type}</span>
                <button className="text-neutral-500 hover:text-neutral-300 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
