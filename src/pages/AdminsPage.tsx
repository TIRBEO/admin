import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { hasMinRole, type AdminRole } from "@/lib/session";
import { Trash2, Shield, ShieldAlert, ShieldCheck, UserPlus, Pencil, X, Check } from "lucide-react";

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: AdminRole;
  created_at: string;
}

const ROLE_OPTIONS: { value: AdminRole; label: string; color: string }[] = [
  { value: "super_admin", label: "Super Admin", color: "text-amber-600" },
  { value: "admin", label: "Admin", color: "text-red-600" },
  { value: "manager", label: "Manager", color: "text-blue-600" },
  { value: "editor", label: "Editor", color: "text-green-600" },
  { value: "viewer", label: "Viewer", color: "text-gray-500" },
];

export default function AdminsPage() {
  const { session: currentSession, hasPermission } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("editor");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: string; role: AdminRole } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_users").select("*").order("created_at", { ascending: true });
    if (data) setAdmins(data);
    setLoading(false);
  };

  const addAdmin = async () => {
    setError("");
    if (!newEmail) { setError("Email is required"); return; }

    // Look up the user via serverless API (uses service_role key server-side)
    let found;
    try {
      const resp = await fetch("/api/lookup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.toLowerCase().trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Failed to look up user"); return; }
      found = data;
    } catch {
      setError("Failed to look up user. Server error.");
      return;
    }

    if (!found) { setError(`User "${newEmail}" not found. They must sign up first.`); return; }

    // Check if already admin
    const exists = admins.find((a) => a.user_id === found.id);
    if (exists) { setError("This user already has admin access."); return; }

    const { error: insertError } = await supabase.from("admin_users").insert({
      user_id: found.id,
      email: newEmail.toLowerCase().trim(),
      display_name: newDisplayName || found.display_name || found.email,
      role: newRole,
    });

    if (insertError) { setError(insertError.message); return; }

    setNewEmail(""); setNewDisplayName(""); setNewRole("editor"); setShowAddForm(false);
    load();
  };

  const updateRole = async (id: string, role: AdminRole) => {
    const { error: updateError } = await supabase.from("admin_users").update({ role }).eq("id", id);
    if (updateError) { setError(updateError.message); return; }
    setEditingRole(null);
    load();
  };

  const removeAdmin = async (id: string, userRole: AdminRole) => {
    if (!hasPermission("admins", "delete")) {
      if (!confirm("Only super admins can delete admin users. Continue?")) return;
    }
    if (!confirm("Remove this admin user?")) return;
    await supabase.from("admin_users").delete().eq("id", id);
    load();
  };

  const canChangeRole = (targetRole: AdminRole): boolean => {
    if (!currentSession) return false;
    return hasMinRole(currentSession.admin.role, "admin") && hasMinRole(currentSession.admin.role, targetRole);
  };

  const canDelete = hasPermission("admins", "delete");

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage who has access to the admin panel</p>
        </div>
        {hasPermission("admins", "add") && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Add Admin
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <input
            placeholder="Email address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
          />
          <input
            placeholder="Display name (optional)"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === "super_admin" || (currentSession?.admin.role !== "super_admin" && opt.value === "admin")}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addAdmin} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add User
            </button>
            <button onClick={() => { setShowAddForm(false); setError(""); }} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-1">
          {admins.length === 0 && (
            <p className="text-sm text-gray-500 py-8 text-center">No admin users yet.</p>
          )}
          {admins.map((a) => {
            const isSelf = currentSession?.admin.id === a.id;
            const roleMeta = ROLE_OPTIONS.find((r) => r.value === a.role);

            return (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {a.display_name?.charAt(0)?.toUpperCase() || a.email?.charAt(0).toUpperCase() || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {a.display_name || a.email}
                    {isSelf && <span className="ml-2 text-[10px] text-gray-500">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{a.email}</p>
                </div>

                {editingRole?.id === a.id ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={editingRole.role}
                      onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value as AdminRole })}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
                      autoFocus
                    >
                      {ROLE_OPTIONS.filter((opt) => canChangeRole(opt.value)).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button onClick={() => updateRole(a.id, editingRole.role)} className="p-1 text-green-600 hover:text-green-700">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingRole(null)} className="p-1 text-gray-500 hover:text-gray-700">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs uppercase tracking-wider font-medium ${roleMeta?.color || "text-gray-500"}`}>
                    {roleMeta?.label || a.role.replace("_", " ")}
                  </span>
                )}

                {hasPermission("admins", "changeRole") && editingRole?.id !== a.id && !isSelf && (
                  <button
                    onClick={() => setEditingRole({ id: a.id, role: a.role })}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Change role"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}

                {canDelete && !isSelf && (
                  <button
                    onClick={() => removeAdmin(a.id, a.role)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Remove admin"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
