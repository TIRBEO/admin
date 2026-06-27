import { useState } from "react";
import { FileText, Check, X, AlertCircle, Clock } from "lucide-react";

interface ApprovalItem {
  id: number;
  type: string;
  title: string;
  author: string;
  content: string;
  submitted: string;
  priority: "high" | "medium" | "low";
}

export default function ContentApproval() {
  const [queue, setQueue] = useState<ApprovalItem[]>([
    { id: 1, type: "post", title: "New Hackathon Announcement", author: "Alex Chen", content: "Join us for the annual hackathon...", submitted: "2026-06-27 10:30", priority: "high" },
    { id: 2, type: "resource", title: "Design System v2.0 PDF", author: "Sarah Kim", content: "Complete design system documentation", submitted: "2026-06-27 09:15", priority: "medium" },
    { id: 3, type: "post", title: "Community Meetup Recap", author: "Jordan Lee", content: "Highlights from last week's community meetup", submitted: "2026-06-26 14:00", priority: "low" },
  ]);

  const handleApprove = (id: number) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleReject = (id: number) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const priorityColors = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  const typeIcons: Record<string, typeof FileText> = { post: FileText, resource: FileText };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Approval</h1>
          <p className="text-sm text-neutral-500 mt-1">Review and moderate user-submitted content</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-neutral-900 border border-amber-500/20 px-4 py-2 text-sm">
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-amber-400 font-medium">{queue.length}</span>
          <span className="text-neutral-500">pending</span>
        </div>
      </div>

      <div className="space-y-3">
        {queue.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-sm">No pending content to approve</div>
        )}
        {queue.map((item) => {
          const Icon = typeIcons[item.type] || FileText;
          return (
            <div key={item.id} className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[item.priority]}`}>{item.priority}</span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1"><Icon className="h-3 w-3" />{item.type}</span>
                  </div>
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-neutral-400 text-sm mt-1">{item.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>By: {item.author}</span>
                    <span>Submitted: {item.submitted}</span>
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
          );
        })}
      </div>
    </div>
  );
}
