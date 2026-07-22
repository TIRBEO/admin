"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Trash2, Edit2, X, ChevronDown, ChevronRight, Shield, Users, Check, Minus } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.tirbeo.app";

type Role = {
  id: string; name: string; description: string | null; color: string; icon: string;
  isSystem: boolean; permissions: Record<string, boolean>;
  _count?: { assignments: number };
  createdAt: string;
};

type PermLevel = "none" | "view" | "read_write" | "custom";

const MODULES = [
  { group: "Employee Management", modules: [
    { key: "emp.view", label: "View Employees", desc: "View employee directory and profiles" },
    { key: "emp.create", label: "Add Employees", desc: "Create new employee accounts" },
    { key: "emp.edit", label: "Edit Employees", desc: "Modify employee information" },
    { key: "emp.delete", label: "Delete Employees", desc: "Remove employee accounts" },
    { key: "emp.export", label: "Export Employee Data", desc: "Download employee data as CSV/Excel" },
  ]},
  { group: "Payroll", modules: [
    { key: "payroll.view", label: "View Payroll", desc: "View salary and payment records" },
    { key: "payroll.edit", label: "Edit Payroll", desc: "Modify salary and payment details" },
    { key: "payroll.approve", label: "Approve Payroll", desc: "Approve payroll runs before processing" },
    { key: "payroll.export", label: "Export Payroll", desc: "Download payroll reports" },
  ]},
  { group: "Attendance & Leave", modules: [
    { key: "attendance.view", label: "View Attendance", desc: "View attendance records" },
    { key: "attendance.manage", label: "Manage Attendance", desc: "Edit attendance records" },
    { key: "leave.view", label: "View Leave Requests", desc: "View leave applications" },
    { key: "leave.approve", label: "Approve Leave", desc: "Approve or reject leave requests" },
  ]},
  { group: "Recruitment", modules: [
    { key: "recruit.view", label: "View Openings", desc: "View job postings and applicants" },
    { key: "recruit.create", label: "Create Openings", desc: "Post new job openings" },
    { key: "recruit.edit", label: "Manage Applicants", desc: "Move applicants through pipeline" },
    { key: "recruit.delete", label: "Close/Delete Openings", desc: "Remove job postings" },
  ]},
  { group: "Projects", modules: [
    { key: "projects.view", label: "View Projects", desc: "View project list and details" },
    { key: "projects.create", label: "Create Projects", desc: "Create new projects" },
    { key: "projects.edit", label: "Edit Projects", desc: "Modify project settings and details" },
    { key: "projects.delete", label: "Delete Projects", desc: "Archive or delete projects" },
  ]},
  { group: "Clients", modules: [
    { key: "clients.view", label: "View Clients", desc: "View client directory" },
    { key: "clients.create", label: "Add Clients", desc: "Create new client accounts" },
    { key: "clients.edit", label: "Edit Clients", desc: "Update client information" },
    { key: "clients.delete", label: "Delete Clients", desc: "Remove client accounts" },
  ]},
  { group: "Sales", modules: [
    { key: "sales.view", label: "View Sales", desc: "View sales data and pipeline" },
    { key: "sales.create", label: "Create Deals", desc: "Create new deals and opportunities" },
    { key: "sales.edit", label: "Edit Deals", desc: "Modify deal details and stages" },
    { key: "sales.approve", label: "Approve Discounts", desc: "Approve special pricing or discounts" },
    { key: "sales.export", label: "Export Sales", desc: "Download sales reports" },
  ]},
  { group: "Inventory", modules: [
    { key: "inventory.view", label: "View Inventory", desc: "View stock levels and items" },
    { key: "inventory.create", label: "Add Items", desc: "Add new inventory items" },
    { key: "inventory.edit", label: "Edit Items", desc: "Update stock quantities and details" },
    { key: "inventory.delete", label: "Remove Items", desc: "Delete inventory items" },
  ]},
  { group: "Finance", modules: [
    { key: "finance.view", label: "View Finance", desc: "View financial summaries and reports" },
    { key: "finance.edit", label: "Edit Transactions", desc: "Create or modify financial entries" },
    { key: "finance.approve", label: "Approve Transactions", desc: "Approve expenses and invoices" },
    { key: "finance.export", label: "Export Finance", desc: "Download financial reports" },
  ]},
  { group: "Reports & Analytics", modules: [
    { key: "reports.view", label: "View Reports", desc: "Access dashboards and reports" },
    { key: "reports.create", label: "Create Reports", desc: "Build custom reports" },
    { key: "reports.export", label: "Export Reports", desc: "Download report data" },
  ]},
  { group: "System Settings", modules: [
    { key: "settings.view", label: "View Settings", desc: "View system configuration" },
    { key: "settings.edit", label: "Edit Settings", desc: "Modify system configuration" },
  ]},
  { group: "User Management", modules: [
    { key: "users.view", label: "View Users", desc: "View user list and profiles" },
    { key: "users.edit", label: "Edit Users", desc: "Modify user accounts" },
    { key: "users.delete", label: "Delete Users", desc: "Delete user accounts" },
    { key: "users.assign_roles", label: "Assign Roles", desc: "Manage user role assignments" },
  ]},
  { group: "API & Security", modules: [
    { key: "api.view", label: "View API Keys", desc: "View API key inventory" },
    { key: "api.create", label: "Create API Keys", desc: "Generate new API keys" },
    { key: "api.revoke", label: "Revoke API Keys", desc: "Revoke compromised keys" },
    { key: "audit.view", label: "View Audit Logs", desc: "Access security audit trail" },
  ]},
];

const ALL_PERM_KEYS = MODULES.flatMap(g => g.modules.map(m => m.key));

function getPermLevel(perms: Record<string, boolean>, groupKeys: string[]): PermLevel {
  const enabled = groupKeys.filter(k => perms[k]);
  if (enabled.length === 0) return "none";
  if (enabled.length === groupKeys.length) return "read_write";
  if (enabled.length <= 2 && groupKeys.every(k => !perms[k] || k.endsWith(".view"))) return "view";
  return "custom";
}

function RoleIcon({ name, color, size = 16 }: { name: string; color: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />,
    users: <><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
    key: <path strokeLinecap="round" strokeLinejoin="round" d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    crown: <><path strokeLinecap="round" strokeLinejoin="round" d="M2 20h20M4 17l2-12 6 4 6-4 2 12H4z" /></>,
    eye: <><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    bolt: <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    flag: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.shield}
    </svg>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [saveLoading, setSaveLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#4f7aff");
  const [formIcon, setFormIcon] = useState("shield");
  const [formPerms, setFormPerms] = useState<Record<string, boolean>>({});

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/roles`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setRoles(d.roles || []); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const openCreate = () => {
    setIsCreating(true); setEditing(null);
    setFormName(""); setFormDesc(""); setFormColor("#4f7aff"); setFormIcon("shield"); setFormPerms({});
    setExpandedGroups(new Set(MODULES.map(m => m.group)));
  };

  const openEdit = (role: Role) => {
    setEditing(role); setIsCreating(false);
    setFormName(role.name); setFormDesc(role.description || ""); setFormColor(role.color); setFormIcon(role.icon);
    setFormPerms({ ...role.permissions });
    setExpandedGroups(new Set(MODULES.map(m => m.group)));
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const togglePerm = (key: string) => {
    setFormPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllInGroup = (keys: string[], enabled: boolean) => {
    setFormPerms(prev => {
      const next = { ...prev };
      keys.forEach(k => { next[k] = enabled; });
      return next;
    });
  };

  const toggleAllModules = (enabled: boolean) => {
    setFormPerms(prev => {
      const next: Record<string, boolean> = {};
      ALL_PERM_KEYS.forEach(k => { next[k] = enabled; });
      return next;
    });
  };

  const save = async () => {
    if (!formName.trim()) { setToast("Role name is required"); return; }
    setSaveLoading(true);
    try {
      const body = { name: formName.trim(), description: formDesc.trim() || undefined, color: formColor, icon: formIcon, permissions: formPerms };
      const url = editing ? `${API}/api/admin/roles/${editing.id}` : `${API}/api/admin/roles`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setToast(editing ? "Role updated" : "Role created");
        setIsCreating(false); setEditing(null);
        loadRoles();
      } else {
        const msg = await res.text();
        setToast(msg || "Failed to save role");
      }
    } catch { setToast("Connection error"); }
    setSaveLoading(false);
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete this role? Users with this role will lose its permissions.")) return;
    try {
      const res = await fetch(`${API}/api/admin/roles/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { setToast("Role deleted"); loadRoles(); }
      else { const msg = await res.text(); setToast(msg || "Failed to delete"); }
    } catch { setToast("Connection error"); }
  };

  const filtered = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const isFormOpen = isCreating || !!editing;
  const totalEnabledPerms = Object.values(formPerms).filter(Boolean).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e6edf3" }}>Roles & Permissions</h1>
          <p style={{ fontSize: 14, color: "#7d8590", marginTop: 4 }}>Define roles and assign granular module permissions</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={16} /> Create Role</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="search-form" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ color: "#7d8590" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles..." />
        </div>
        <span style={{ fontSize: 13, color: "#7d8590" }}>{roles.length} roles</span>
      </div>

      {isFormOpen && (
        <div className="box" style={{ marginBottom: 24, padding: 24, border: "1px solid rgba(79,122,255,0.2)", background: "rgba(79,122,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e6edf3" }}>{editing ? "Edit Role" : "Create Role"}</h3>
            <button onClick={() => { setIsCreating(false); setEditing(null); }} style={{ background: "none", border: "none", color: "#7d8590", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div className="field">
              <label>Role Name *</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Payroll Manager" className="input" />
            </div>
            <div className="field">
              <label>Description</label>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Brief description" className="input" />
            </div>
            <div className="field">
              <label>Color</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} style={{ width: 40, height: 34, border: "1px solid #30363d", borderRadius: 6, background: "transparent", cursor: "pointer" }} />
                <input value={formColor} onChange={e => setFormColor(e.target.value)} className="input" style={{ flex: 1 }} />
              </div>
            </div>
            <div className="field">
              <label>Icon</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["shield", "star", "users", "key", "lock", "gear", "crown", "eye", "bolt", "flag"].map(icon => (
                  <button key={icon} onClick={() => setFormIcon(icon)} style={{
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, border: `1px solid ${formIcon === icon ? formColor : "#30363d"}`,
                    background: formIcon === icon ? `${formColor}20` : "transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <RoleIcon name={icon} color={formIcon === icon ? formColor : "#7d8590"} size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>Module Permissions</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#7d8590" }}>{totalEnabledPerms} of {ALL_PERM_KEYS.length} permissions enabled</span>
                <button onClick={() => toggleAllModules(true)} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(35,134,54,0.15)", color: "#3fb950", border: "1px solid rgba(35,134,54,0.3)", borderRadius: 6, cursor: "pointer" }}>Select All</button>
                <button onClick={() => toggleAllModules(false)} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(218,54,51,0.15)", color: "#f85149", border: "1px solid rgba(218,54,51,0.3)", borderRadius: 6, cursor: "pointer" }}>Clear All</button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {MODULES.map(group => {
                const groupKeys = group.modules.map(m => m.key);
                const enabled = groupKeys.filter(k => formPerms[k]).length;
                const allEnabled = enabled === groupKeys.length;
                const someEnabled = enabled > 0 && !allEnabled;
                const expanded = expandedGroups.has(group.group);

                return (
                  <div key={group.group} style={{ border: "1px solid #21262d", borderRadius: 8, overflow: "hidden" }}>
                    <div onClick={() => toggleGroup(group.group)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      background: "#161b22", cursor: "pointer", userSelect: "none",
                    }}>
                      <button onClick={e => { e.stopPropagation(); toggleAllInGroup(groupKeys, !allEnabled); }} style={{
                        width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${allEnabled ? "#3fb950" : someEnabled ? "#d29922" : "#30363d"}`,
                        background: allEnabled ? "#3fb950" : someEnabled ? "#d29922" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                      }}>
                        {(allEnabled || someEnabled) && <Check size={12} color="#fff" strokeWidth={3} />}
                      </button>
                      {expanded ? <ChevronDown size={14} style={{ color: "#7d8590", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "#7d8590", flexShrink: 0 }} />}
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#e6edf3", flex: 1 }}>{group.group}</span>
                      <span style={{ fontSize: 12, color: "#7d8590" }}>{enabled}/{groupKeys.length}</span>
                    </div>
                    {expanded && (
                      <div style={{ padding: "4px 0", background: "var(--bg-inset)" }}>
                        {group.modules.map(m => (
                          <div key={m.key} style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 10px 42px",
                            borderBottom: "1px solid var(--border-muted)",
                          }} title={m.desc}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{m.label}</div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{m.desc}</div>
                            </div>
                            <button onClick={() => togglePerm(m.key)} style={{
                              width: 36, height: 20, borderRadius: 10, border: `1.5px solid ${formPerms[m.key] ? "#3fb950" : "var(--border-elevated)"}`,
                              background: formPerms[m.key] ? "#3fb950" : "var(--bg-hover)",
                              display: "flex", alignItems: formPerms[m.key] ? "center" : "center", justifyContent: formPerms[m.key] ? "flex-end" : "flex-start",
                              cursor: "pointer", flexShrink: 0, padding: formPerms[m.key] ? "0 2px 0 0" : "0 0 0 2px",
                              transition: "all 0.15s",
                            }}>
                              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { setIsCreating(false); setEditing(null); }} className="btn btn-outline">Cancel</button>
            <button onClick={save} disabled={saveLoading} className="btn btn-primary">{saveLoading ? "Saving..." : editing ? "Update Role" : "Create Role"}</button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Members</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(role => {
              const permCount = Object.values(role.permissions).filter(Boolean).length;
              return (
                <tr key={role.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${role.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RoleIcon name={role.icon} color={role.color} size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: "#e6edf3" }}>{role.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#7d8590", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{role.description || "—"}</td>
                  <td>
                    <span className="badge badge-default">{permCount} permissions</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={14} style={{ color: "#7d8590" }} />
                      <span style={{ color: "#c9d1d9" }}>{role._count?.assignments || 0}</span>
                    </div>
                  </td>
                  <td>
                    {role.isSystem ? (
                      <span className="badge" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>System</span>
                    ) : (
                      <span className="badge badge-default">Custom</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(role)} className="btn btn-sm btn-outline" title="View & Edit">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openEdit(role)} className="btn btn-sm btn-outline" disabled={role.isSystem} title={role.isSystem ? "System roles cannot be edited" : "Edit"}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteRole(role.id)} className="btn btn-sm btn-danger" disabled={role.isSystem} title={role.isSystem ? "System roles cannot be deleted" : "Delete"}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#7d8590" }}>No roles found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && <div className={`toast ${toast.includes("created") || toast.includes("updated") || toast.includes("deleted") ? "toast-success" : "toast-error"}`} onClick={() => setToast(null)}>{toast}</div>}
    </div>
  );
}
