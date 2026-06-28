import { useState, useEffect } from "react";
import { FileText, Check, X, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ApprovalItem {
  id: string;
  content_type: string;
  title: string;
  content: string;
  submitted_by: string;
  created_at: string;
  status: string;
  priority: string;
}

const priorityColors: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function ContentApproval() {
  const [queue, setQueue] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    const { data } = await supabase.from("content_approvals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data) setQueue(data);
    setLoading(false);
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleApprove = async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from("content_approvals").update({ status: "approved", reviewed_at: now }).eq("id", id);
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleReject = async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from("content_approvals").update({ status: "rejected", reviewed_at: now }).eq("id", id);
    setQueue(queue.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Approval</h1>
          <p className="text-sm text-gray-500 mt-1">Review and moderate user-submitted content</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchQueue} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-4 py-2 text-sm">
            <Clock className="h-4 w-4 text-amber-700" />
            <span className="text-amber-700 font-medium">{queue.length}</span>
            <span className="text-gray-500">pending</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading approvals...</div>
        ) : queue.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No pending content to approve</div>
        ) : queue.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[item.priority] || priorityColors.low}`}>{item.priority || "low"}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><FileText className="h-3 w-3" />{item.content_type}</span>
                </div>
                <h4 className="text-gray-900 font-medium">{item.title}</h4>
                <p className="text-gray-500 text-sm mt-1">{item.content}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {item.submitted_by && <span>By: {item.submitted_by}</span>}
                  <span>Submitted: {new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => handleApprove(item.id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm transition-colors">
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button onClick={() => handleReject(item.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors">
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
