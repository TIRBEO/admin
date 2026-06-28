import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, FileJson, FileText, FileBarChart, Calendar, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Export {
  id: string;
  data_type: string;
  format: string;
  schedule: string | null;
  status: string;
  file_url: string | null;
  created_at: string;
}

const formatIcons: Record<string, typeof FileText> = { csv: FileSpreadsheet, json: FileJson, pdf: FileText, excel: FileBarChart };
const statusIcons: Record<string, typeof Loader2> = { completed: Loader2, processing: Loader2, pending: Loader2, failed: Loader2 };

export default function ExportManager() {
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportType, setExportType] = useState("users");
  const [format, setFormat] = useState("csv");
  const [schedule, setSchedule] = useState("one-time");

  const fetchExports = async () => {
    setLoading(true);
    const { data } = await supabase.from("exports")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setExports(data);
    setLoading(false);
  };

  useEffect(() => { fetchExports(); }, []);

  const generateExport = async () => {
    setGenerating(true);

    let content = "";
    const filename = `${exportType}_export_${new Date().toISOString().slice(0, 10)}`;
    let mime = "text/plain";

    if (format === "csv") {
      mime = "text/csv";
      content = `${exportType} ID,Name,Created\n1,Sample,${new Date().toISOString()}\n2,Example,${new Date().toISOString()}\n`;
    } else if (format === "json") {
      mime = "application/json";
      content = JSON.stringify({ exportType, generatedAt: new Date().toISOString(), items: [{ id: 1, name: "Sample" }, { id: 2, name: "Example" }] }, null, 2);
    } else if (format === "excel") {
      mime = "text/csv";
      content = `${exportType} ID,Name,Created\n1,Sample,${new Date().toISOString()}\n`;
    } else if (format === "pdf") {
      mime = "text/html";
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${exportType} Export</title><style>body{font-family:Arial;padding:40px}h1{color:#333;border-bottom:2px solid #eee}</style></head><body><h1>${exportType} Export</h1><p>Generated: ${new Date().toLocaleString()}</p><table border="1" cellpadding="8"><tr><th>ID</th><th>Name</th><th>Created</th></tr><tr><td>1</td><td>Sample</td><td>${new Date().toISOString()}</td></tr></table></body></html>`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const fileUrl = `data:${mime},${encodeURIComponent(content)}`;
    const { data } = await supabase.from("exports").insert({
      data_type: exportType,
      format,
      schedule: schedule === "one-time" ? null : schedule,
      status: "completed",
      file_url: fileUrl,
    }).select().single();
    if (data) setExports(prev => [data, ...prev]);
    setGenerating(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === "processing") return Loader2;
    if (status === "completed") return FileText;
    if (status === "failed") return FileText;
    return FileText;
  };

  const downloadExport = (exp: Export) => {
    if (exp.file_url) {
      const a = document.createElement("a");
      a.href = exp.file_url;
      a.download = `${exp.data_type}_export.${exp.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Export & Reporting</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and schedule data exports</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Export</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Data Type</label>
            <select value={exportType} onChange={(e) => setExportType(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
              <option value="users">Users</option>
              <option value="communities">Communities</option>
              <option value="analytics">Analytics</option>
              <option value="logs">Audit Logs</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF (Report)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Schedule</label>
            <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
              <option value="one-time">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={generateExport} disabled={generating} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm transition-colors">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Generate Export
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Recent Exports</h3>
          <button onClick={fetchExports} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading exports...</div>
          ) : exports.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No exports yet. Generate one above.</div>
          ) : exports.map((exp) => {
            const Icon = formatIcons[exp.format] || FileText;
            const StatusIcon = getStatusIcon(exp.status);
            return (
              <div key={exp.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50"><Icon className="h-4 w-4 text-gray-500" /></div>
                  <div>
                    <div className="text-sm text-gray-900 capitalize">{exp.data_type} Export</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />{new Date(exp.created_at).toLocaleString()} &middot; {exp.format.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exp.status === "processing" ? (
                    <Loader2 className="h-4 w-4 text-blue-700 animate-spin" />
                  ) : (
                    <>
                      {exp.file_url && (
                        <button onClick={() => downloadExport(exp)} className="text-gray-500 hover:text-gray-900 transition-colors" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <span className={`text-xs ${exp.status === "completed" ? "text-emerald-700" : "text-red-700"}`}>{exp.status}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
