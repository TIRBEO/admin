import { useState } from "react";
import { Bell, CheckCheck, AlertTriangle, CheckCircle, XCircle, Info, ExternalLink } from "lucide-react";

interface Notification {
  id: number;
  type: "warning" | "success" | "error" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: "warning", title: "Server Load High", message: "CPU usage at 85% for 10 minutes", time: "2 mins ago", read: false },
    { id: 2, type: "success", title: "Backup Complete", message: "Database backup completed successfully", time: "1 hour ago", read: true },
    { id: 3, type: "error", title: "Payment Failed", message: "User payment failed for subscription", time: "3 hours ago", read: false },
    { id: 4, type: "info", title: "New Update Available", message: "Version 2.5.0 is ready to deploy", time: "5 hours ago", read: false },
    { id: 5, type: "success", title: "Deployment Successful", message: "Chat app deployed to production", time: "1 day ago", read: true },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const typeIcons = { warning: AlertTriangle, success: CheckCircle, error: XCircle, info: Info };
  const typeColors = {
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-1">System alerts and updates</p>
        </div>
        <div className="flex items-center gap-3">
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
        {notifications.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-sm">No notifications</div>
        )}
        {notifications.map((n) => {
          const Icon = typeIcons[n.type];
          return (
            <div
              key={n.id}
              onClick={() => toggleRead(n.id)}
              className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                n.read ? "border-neutral-800 bg-neutral-900/20" : "border-neutral-700 bg-neutral-900/60"
              }`}
            >
              <div className={`p-2 rounded-lg border ${typeColors[n.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${n.read ? "text-neutral-400" : "text-white"}`}>{n.title}</span>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-blue-400" />}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-neutral-600 mt-1 block">{n.time}</span>
              </div>
              <ExternalLink className="h-4 w-4 text-neutral-600 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
