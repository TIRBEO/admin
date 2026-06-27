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
  { value: "super_admin", label: "Super Admin", color: "text-amber-400" },
  { value: "admin", label: "Admin", color: "text-red-400" },
  { value: "manager", label: "Manager", color: "text-blue-400" },
  { value: "editor", label: "Editor", color: "text-green-400" },
  { value: "viewer", label: "Viewer", color: "text-neutral-400" },
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

    // Look up the user in auth.users via admin API
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) { setError("Failed to look up user. Ensure you have admin privileges."); return; }

    const found = users?.users.find((u) => u.email === newEmail.toLowerCase().trim());
    if (!found) { setError(`User "${newEmail}" not found. They must sign up first.`); return; }

    // Check if already admin
    const exists = admins.find((a) => a.user_id === found.id);
    if (exists) { setError("This user already has admin access."); return; }

    const { error: insertError } = await supabase.from("admin_users").insert({
      user_id: found.id,
      email: newEmail.toLowerCase().trim(),
      display_name: newDisplayName || found.user_metadata?.display_name || found.email,
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
          <p className="text-sm text-neutral-500 mt-1">Manage who has access to the admin panel</p>
        </div>
        {hasPermission("admins", "add") && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Add Admin
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
          <input
            placeholder="Email address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          />
          <input
            placeholder="Display name (optional)"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          />
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === "super_admin" || (currentSession?.admin.role !== "super_admin" && opt.value === "admin")}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addAdmin} className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200">
              Add User
            </button>
            <button onClick={() => { setShowAddForm(false); setError(""); }} className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : (
        <div className="space-y-1">
          {admins.length === 0 && (
            <p className="text-sm text-neutral-500 py-8 text-center">No admin users yet.</p>
          )}
          {admins.map((a) => {
            const isSelf = currentSession?.admin.id === a.id;
            const roleMeta = ROLE_OPTIONS.find((r) => r.value === a.role);

            return (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-neutral-300">
                  {a.display_name?.charAt(0)?.toUpperCase() || a.email?.charAt(0).toUpperCase() || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {a.display_name || a.email}
                    {isSelf && <span className="ml-2 text-[10px] text-neutral-500">(you)</span>}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{a.email}</p>
                </div>

                {editingRole?.id === a.id ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={editingRole.role}
                      onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value as AdminRole })}
                      className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-100"
                      autoFocus
                    >
                      {ROLE_OPTIONS.filter((opt) => canChangeRole(opt.value)).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button onClick={() => updateRole(a.id, editingRole.role)} className="p-1 text-green-400 hover:text-green-300">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingRole(null)} className="p-1 text-neutral-500 hover:text-neutral-300">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs uppercase tracking-wider font-medium ${roleMeta?.color || "text-neutral-500"}`}>
                    {roleMeta?.label || a.role.replace("_", " ")}
                  </span>
                )}

                {hasPermission("admins", "changeRole") && editingRole?.id !== a.id && !isSelf && (
                  <button
                    onClick={() => setEditingRole({ id: a.id, role: a.role })}
                    className="p-1 text-neutral-500 hover:text-neutral-200"
                    title="Change role"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}

                {canDelete && !isSelf && (
                  <button
                    onClick={() => removeAdmin(a.id, a.role)}
                    className="p-1 text-neutral-500 hover:text-red-400"
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
