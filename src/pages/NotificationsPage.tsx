import { useState, useEffect } from "react";
import { Bell, CheckCheck, AlertTriangle, CheckCircle, XCircle, Info, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Notification {
  id: string;
  type: "warning" | "success" | "error" | "info";
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const typeIcons = { warning: AlertTriangle, success: CheckCircle, error: XCircle, info: Info };
const typeColors: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase.from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const toggleRead = async (id: string, current: boolean) => {
    await supabase.from("notifications").update({ is_read: !current }).eq("id", id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: !n.is_read } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-1">System alerts and updates</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchNotifications} className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm">
            <Bell className="h-4 w-4 text-neutral-400" />
            <span className="text-white font-medium">{unreadCount}</span>
            <span className="text-neutral-500">unread</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-neutral-500 text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">No notifications</div>
        ) : notifications.map((n) => {
          const Icon = typeIcons[n.type] || Info;
          return (
            <div
              key={n.id}
              onClick={() => toggleRead(n.id, n.is_read)}
              className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                n.is_read ? "border-neutral-800 bg-neutral-900/20" : "border-neutral-700 bg-neutral-900/60"
              }`}
            >
              <div className={`p-2 rounded-lg border ${typeColors[n.type] || typeColors.info}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${n.is_read ? "text-neutral-400" : "text-white"}`}>{n.title}</span>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-blue-400" />}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-neutral-600 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <ExternalLink className="h-4 w-4 text-neutral-600 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
