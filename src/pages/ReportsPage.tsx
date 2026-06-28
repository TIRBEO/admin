import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import { FileBarChart, Download, Calendar, FileText, FileSpreadsheet, RefreshCw, Loader2 } from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: string;
  format: string;
  file_url: string | null;
  generated_at: string;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateCSV(): string {
  const now = new Date();
  const headers = ["Metric,Value,Date Generated"];
  const rows = [
    `Total Users,0,${now.toISOString()}`,
    `Active Users (7d),0,${now.toISOString()}`,
    `Content Items,0,${now.toISOString()}`,
    `Growth Rate,0%,${now.toISOString()}`,
  ];
  return [...headers, ...rows].join("\n");
}

function generatePDFContent(title: string): string {
  const now = new Date().toLocaleString();
  return [
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>`,
    `<style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#111;border-bottom:2px solid #eee;padding-bottom:10px}`,
    `.stat{margin:20px 0;padding:15px;background:#f5f5f5;border-radius:8px}.stat h3{margin:0 0 5px;font-size:14px;color:#666}`,
    `.stat p{margin:0;font-size:24px;font-weight:bold;color:#111}.footer{margin-top:40px;font-size:12px;color:#999}</style></head><body>`,
    `<h1>${title}</h1>`,
    `<p>Generated: ${now}</p>`,
    `<div class="stat"><h3>Total Users</h3><p>0</p></div>`,
    `<div class="stat"><h3>Active Users (7d)</h3><p>0</p></div>`,
    `<div class="stat"><h3>Content Items</h3><p>0</p></div>`,
    `<div class="stat"><h3>Growth Rate</h3><p>0%</p></div>`,
    `<div class="footer">Tirbeo Analytics Report &mdash; Auto-generated</div>`,
    `</body></html>`,
  ].join("");
}

export default function ReportsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalContent: 0, growth: 0 });

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from("reports")
      .select("*")
      .order("generated_at", { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [users, recent, pages] = await Promise.all([
      supabase.from("admin_audit_log").select("*", { count: "exact", head: true }),
      supabase.from("admin_audit_log").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from("pages").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      totalUsers: users.count || 0,
      activeUsers: recent.count || 0,
      totalContent: pages.count || 0,
      growth: users.count ? Math.round(((recent.count || 0) / users.count) * 100) : 0,
    });
  };

  useEffect(() => { fetchReports(); }, []);

  const generateReport = async (type: string, format: string) => {
    setGenerating(type + format);
    await fetchStats();
    const dateStr = new Date().toLocaleDateString().replace(/\//g, "-");
    const title = `${type} Report - ${dateStr}`;
    let fileUrl = "";

    if (format === "csv") {
      const csv = `Metric,Value\nTotal Users,${stats.totalUsers}\nActive Users (7d),${stats.activeUsers}\nContent Items,${stats.totalContent}\nGrowth Rate,${stats.growth}%\nGenerated,${new Date().toISOString()}\n`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      fileUrl = `data:text/csv,${encodeURIComponent(csv)}`;
    } else if (format === "pdf") {
      const html = generatePDFContent(title);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      fileUrl = `data:text/html,${encodeURIComponent(html)}`;
    }

    const { data } = await supabase.from("reports").insert({
      title,
      type,
      format,
      file_url: fileUrl,
    }).select().single();

    if (data) setReports(prev => [data, ...prev]);
    setGenerating(null);
  };

  const handleDownload = (report: Report) => {
    if (report.file_url) {
      const a = document.createElement("a");
      a.href = report.file_url;
      a.download = `${report.title}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      generateReport(report.type, report.format);
    }
  };

  if (!app) {
    return <div className="p-6 text-center text-neutral-500">App not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
          <FileBarChart className="w-6 h-6 text-neutral-400" />
          <h1 className="text-2xl font-semibold tracking-tight">{app.name} Reports</h1>
        </div>
        <button onClick={fetchReports} className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Generate PDF", icon: FileText, type: "analytics", format: "pdf", desc: "Full report with charts" },
          { label: "Export CSV", icon: FileSpreadsheet, type: "data", format: "csv", desc: "Raw data in spreadsheet" },
          { label: "Schedule Report", icon: Calendar, type: "scheduled", format: "pdf", desc: "Recurring delivery" },
        ].map(action => (
          <button key={action.label} onClick={() => generateReport(action.type, action.format)} disabled={generating === action.type + action.format}
            className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left hover:bg-neutral-800/50 transition-colors disabled:opacity-50">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center mb-3">
              {generating === action.type + action.format
                ? <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                : <action.icon className="w-4 h-4 text-neutral-400" />
              }
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
        {loading ? (
          <div className="px-5 py-6 text-center text-sm text-neutral-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-neutral-500">No reports yet. Generate one above.</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {reports.map(report => (
              <div key={report.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-200">{report.title}</p>
                    <p className="text-xs text-neutral-500">{new Date(report.generated_at).toLocaleDateString()} &middot; {report.format.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">{report.format.toUpperCase()}</span>
                  <button onClick={() => handleDownload(report)} className="text-neutral-500 hover:text-neutral-300 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
