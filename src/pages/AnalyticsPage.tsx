import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import {
  BarChart3, TrendingUp, Users, MessageSquare, Activity,
  ArrowUp, ArrowDown,
} from "lucide-react";

export default function AnalyticsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalContent: 0,
    growth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app) return;
    Promise.all([
      supabase.from("admin_audit_log").select("*", { count: "exact", head: true }),
      supabase.from("admin_audit_log").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from("pages").select("*", { count: "exact", head: true }),
    ]).then(([users, recent, pages]) => {
      setStats({
        totalUsers: users.count || 0,
        activeUsers: recent.count || 0,
        totalContent: pages.count || 0,
        growth: users.count ? Math.round(((recent.count || 0) / users.count) * 100) : 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [app?.id]);

  if (!app) {
    return <div className="p-6 text-center text-gray-500">App not found</div>;
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, change: stats.growth, trend: stats.growth >= 0 ? "up" : "down" },
    { label: "Active (7d)", value: stats.activeUsers, icon: Activity, change: Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100), trend: "up", suffix: "%" },
    { label: "Content Items", value: stats.totalContent, icon: MessageSquare, change: 0, trend: "up" },
    { label: "Growth Rate", value: stats.growth, icon: TrendingUp, change: stats.growth, trend: stats.growth >= 0 ? "up" : "down", suffix: "%" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        {AppIcon && <AppIcon className="w-6 h-6 text-gray-500" />}
        <h1 className="text-2xl font-semibold tracking-tight">{app.name} Analytics</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-white border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {cards.map(card => (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{card.label}</span>
                  <card.icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {card.value}{card.suffix || ""}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-xs ${card.trend === "up" ? "text-emerald-700" : "text-red-700"}`}>
                  {card.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {card.change}%
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">Activity Overview</h2>
            </div>
            <div className="flex items-center justify-center h-48 text-gray-500">
              <p className="text-sm">Detailed charts available in the next update</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
