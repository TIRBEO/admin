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
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
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
          <p className="text-sm text-gray-500 mt-1">System alerts and updates</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchNotifications} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 text-sm">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-gray-900 font-medium">{unreadCount}</span>
            <span className="text-gray-500">unread</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No notifications</div>
        ) : notifications.map((n) => {
          const Icon = typeIcons[n.type] || Info;
          return (
            <div
              key={n.id}
              onClick={() => toggleRead(n.id, n.is_read)}
              className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                n.is_read ? "border-gray-200 bg-white" : "border-gray-300 bg-gray-50"
              }`}
            >
              <div className={`p-2 rounded-lg border ${typeColors[n.type] || typeColors.info}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${n.is_read ? "text-gray-500" : "text-gray-900"}`}>{n.title}</span>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-gray-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
