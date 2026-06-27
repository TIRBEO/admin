import { useState, useEffect } from "react";
import { Activity, Zap, Users, Database, Server, Globe, HardDrive, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface StatusMetric {
  icon: typeof Activity;
  label: string;
  value: string;
  color: string;
}

export default function SystemStatus() {
  const [metrics, setMetrics] = useState<StatusMetric[]>([
    { icon: Activity, label: "Uptime", value: "99.98%", color: "text-emerald-400" },
    { icon: Zap, label: "Response Time", value: "45ms", color: "text-blue-400" },
    { icon: Users, label: "Active Users", value: "127", color: "text-indigo-400" },
    { icon: Database, label: "DB Connections", value: "8", color: "text-amber-400" },
    { icon: Server, label: "Cache Hit Rate", value: "94%", color: "text-green-400" },
    { icon: Globe, label: "API Status", value: "Operational", color: "text-emerald-400" },
    { icon: HardDrive, label: "Storage Used", value: "45%", color: "text-cyan-400" },
    { icon: Wifi, label: "Network", value: "1.2 Gbps", color: "text-violet-400" },
  ]);

  const [services, setServices] = useState([
    { name: "Authentication", status: "operational", uptime: "99.99%" },
    { name: "Database", status: "operational", uptime: "99.97%" },
    { name: "Storage", status: "operational", uptime: "99.95%" },
    { name: "Real-time", status: "operational", uptime: "99.99%" },
    { name: "Edge Functions", status: "degraded", uptime: "98.50%" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Status</h1>
        <p className="text-sm text-neutral-500 mt-1">Real-time monitoring of platform infrastructure</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-neutral-800`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
            </div>
            <div className="text-2xl font-semibold text-white">{m.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Service Health</h2>
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  s.status === "operational" ? "bg-emerald-400" : "bg-amber-400"
                }`} />
                <span className="text-sm text-white">{s.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-neutral-500">{s.uptime} uptime</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  s.status === "operational"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
