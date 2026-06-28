import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../hooks/useAppStore";
import { APPS } from "../lib/apps.config";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import {
  Users, Search, UserPlus, Mail, Calendar, Clock, RefreshCw, Trash2, Pencil, X, Check, Loader2,
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin", color: "text-amber-400", bg: "bg-amber-500/10" },
  { value: "admin", label: "Admin", color: "text-red-400", bg: "bg-red-500/10" },
  { value: "manager", label: "Manager", color: "text-blue-400", bg: "bg-blue-500/10" },
  { value: "editor", label: "Editor", color: "text-green-400", bg: "bg-green-500/10" },
  { value: "viewer", label: "Viewer", color: "text-neutral-400", bg: "bg-neutral-800" },
];

export default function UsersPage() {
  const { appId } = useParams<{ appId: string }>();
  const { currentApp } = useAppStore();
  const { session } = useAuth();
  const app = APPS[appId || currentApp];
  const AppIcon = app?.icon;

  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingRole, setEditingRole] = useState<{ id: string; role: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    let authUsersResult: { data: any } | null = null;
    try {
      authUsersResult = await supabase.rpc("list_all_users");
    } catch {
      // fallback: try user_profiles table
      try {
        const { data } = await supabase.from("user_profiles").select("*");
        if (data) authUsersResult = { data };
      } catch {}
    }
    const [adminRes] = await Promise.all([
      supabase.from("admin_users").select("*").order("created_at", { ascending: true }),
    ]);
    if (authUsersResult?.data) setAuthUsers(authUsersResult.data);
    if (adminRes?.data) setAdminUsers(adminRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addAdmin = async () => {
    if (!newEmail) return;
    setAdding(true);
    setError("");

    const { data: found } = (await supabase.rpc("lookup_user_by_email", { target_email: newEmail.toLowerCase().trim() })) as any;
    const user = found?.[0];
    if (!user) {
      setError("User not found. They must sign up first.");
      setAdding(false);
      return;
    }

    const exists = adminUsers.find((a) => a.user_id === user.id);
    if (exists) {
      const roleMeta = ROLE_OPTIONS.find((r) => r.value === exists.role);
      setError(`User already has admin access (${roleMeta?.label || exists.role})`);
      setAdding(false);
      return;
    }

    const { error: insertError } = await supabase.from("admin_users").insert({
      user_id: user.id,
      email: newEmail.toLowerCase().trim(),
      display_name: newDisplayName || null,
      role: newRole,
    });

    if (insertError) { setError(insertError.message); setAdding(false); return; }

    setNewEmail(""); setNewDisplayName(""); setNewRole("editor"); setShowAddForm(false);
    setAdding(false);
    load();
  };

  const updateRole = async (id: string, role: string) => {
    await supabase.from("admin_users").update({ role }).eq("id", id);
    setEditingRole(null);
    load();
  };

  const removeAdmin = async (id: string) => {
    if (!confirm("Remove this user from admin panel?")) return;
    await supabase.from("admin_users").delete().eq("id", id);
    load();
  };

  const filteredUsers = authUsers.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const currentRole = session?.admin?.role || "";
  const isSuperAdmin = currentRole === "super_admin";
  const isAdmin = currentRole === "admin" || isSuperAdmin;

  if (!app) {
    return <div className="p-6 text-center text-neutral-400">App not found</div>;
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {AppIcon && <AppIcon className="w-6 h-6 text-neutral-400" />}
          <Users className="w-6 h-6 text-neutral-400" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{app.name} Users</h1>
            <p className="text-sm text-neutral-400 mt-1">All registered users and admin roles</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="text-xs text-neutral-400 px-3 py-2 bg-neutral-800 rounded-lg">{authUsers.length} users</div>
          {isAdmin && (
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <UserPlus className="h-4 w-4" /> Add Admin
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {showAddForm && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
          <input placeholder="Email address" type="email" value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600" />
          <input placeholder="Display name (optional)" value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600" />
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white">
              {ROLE_OPTIONS.filter((o) => o.value !== "super_admin" || isSuperAdmin).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addAdmin} disabled={adding}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {adding && <Loader2 className="h-4 w-4 animate-spin" />} Add User
            </button>
            <button onClick={() => { setShowAddForm(false); setError(""); }}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input type="text" placeholder="Search users by email..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-neutral-700 bg-neutral-950 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Last Active</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-400">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-400">No users found</td></tr>
              ) : filteredUsers.map((u) => {
                const adminUser = adminUsers.find((a) => a.user_id === u.id);
                const roleMeta = ROLE_OPTIONS.find((r) => r.value === adminUser?.role);
                const isSelf = session?.admin?.user_id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-neutral-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                          {adminUser?.display_name?.charAt(0)?.toUpperCase() || u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-white">{adminUser?.display_name || "—"}</span>
                          {isSelf && <span className="ml-2 text-[10px] text-neutral-400">(you)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      {adminUser ? (
                        editingRole?.id === adminUser.id ? (
                          <div className="flex items-center gap-1">
                            <select value={editingRole.role}
                              onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value })}
                              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-white">
                              {ROLE_OPTIONS.filter((o) => o.value !== "super_admin" || isSuperAdmin).map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <button onClick={() => updateRole(adminUser.id, editingRole.role)} className="p-1 text-green-600 hover:text-green-700"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditingRole(null)} className="p-1 text-neutral-400 hover:text-neutral-300"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${roleMeta?.bg || "bg-neutral-800"} ${roleMeta?.color || "text-neutral-400"}`}>
                            {roleMeta?.label || adminUser.role.replace("_", " ")}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-neutral-400" />
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {u.last_sign_in_at ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-neutral-400" />
                          {new Date(u.last_sign_in_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-neutral-500">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {adminUser && !isSelf && (
                          <>
                            {isAdmin && editingRole?.id !== adminUser.id && (
                              <button onClick={() => setEditingRole({ id: adminUser.id, role: adminUser.role })}
                                className="p-1 text-neutral-400 hover:text-neutral-300" title="Change role"><Pencil className="h-3.5 w-3.5" /></button>
                            )}
                            {isSuperAdmin && (
                              <button onClick={() => removeAdmin(adminUser.id)}
                                className="p-1 text-neutral-400 hover:text-red-500" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </>
                        )}
                        {!adminUser && isAdmin && (
                          <button onClick={() => {
                            setNewEmail(u.email);
                            setShowAddForm(true);
                          }} className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-300">
                            <UserPlus className="h-3 w-3" /> Add
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
