import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { Activity, Clock, User } from "lucide-react";

interface AuditEntry {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-600",
  update: "text-blue-600",
  delete: "text-red-600",
  login: "text-amber-600",
  default: "text-gray-500",
};

export default function AuditLogPage() {
  const { hasPermission } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission("auditLog", "view")) return;
    supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setEntries(data);
        setLoading(false);
      });
  }, []);

  if (!hasPermission("auditLog", "view")) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">You don't have permission to view the audit log.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-5 w-5 text-gray-500" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all admin actions</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No audit entries yet.</p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
              <div className="mt-0.5">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p>
                  <span className={`font-medium ${ACTION_COLORS[entry.action] || ACTION_COLORS.default}`}>
                    {entry.action}
                  </span>
                    <span className="text-gray-700"> {entry.entity_type}</span>
                  {entry.entity_id && (
                    <span className="text-gray-500"> /{entry.entity_id}</span>
                  )}
                </p>
                {Object.keys(entry.details || {}).length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {JSON.stringify(entry.details)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <Clock className="h-3 w-3" />
                {new Date(entry.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
