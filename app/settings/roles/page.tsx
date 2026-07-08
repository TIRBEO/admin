'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';

interface Role {
  id: string; name: string; description: string | null;
  color: string; icon: string; isSystem: boolean;
  permissions: Record<string, boolean>;
  _count: { assignments: number };
}

const DEFAULT_PERMS: Record<string, boolean> = {};
const PERM_GROUPS = [
  { label: 'Access', keys: [{ key: 'access.dashboard', label: 'Dashboard overview' }] },
  { label: 'System Management', keys: [
    { key: 'system.routes', label: 'View & manage routes' },
    { key: 'system.monitor', label: 'View monitor & logs' },
    { key: 'system.users', label: 'View users' },
    { key: 'system.users.manage', label: 'Edit / update users' },
    { key: 'system.users.delete', label: 'Delete users' },
    { key: 'system.workspaces', label: 'View workspaces' },
    { key: 'system.workspaces.delete', label: 'Delete workspaces' },
  ]},
  { label: 'Landing Settings', keys: [
    { key: 'landing.view', label: 'View landing settings' },
    { key: 'landing.edit', label: 'Edit landing settings' },
  ]},
  { label: 'Accounts Settings', keys: [
    { key: 'accounts.view', label: 'View accounts settings' },
    { key: 'accounts.edit', label: 'Edit accounts settings' },
  ]},
  { label: 'Dashboard Settings', keys: [
    { key: 'settings.dashboard.view', label: 'View dashboard settings' },
    { key: 'settings.dashboard.edit', label: 'Edit dashboard settings' },
  ]},
  { label: 'Admin Settings', keys: [
    { key: 'settings.admin.view', label: 'View admin settings' },
    { key: 'settings.admin.edit', label: 'Edit admin settings' },
  ]},
  { label: 'API Settings', keys: [
    { key: 'settings.api.view', label: 'View API settings' },
    { key: 'settings.api.edit', label: 'Edit API settings' },
  ]},
  { label: 'Role Management', keys: [
    { key: 'roles.view', label: 'View roles' },
    { key: 'roles.create', label: 'Create roles' },
    { key: 'roles.edit', label: 'Edit roles' },
    { key: 'roles.delete', label: 'Delete roles' },
  ]},
  { label: 'Domain Settings', keys: [
    { key: 'domains.view', label: 'View domain settings' },
  ]},
];

const ICON_OPTIONS = [
  { value: 'shield', label: '🛡️ Shield' },
  { value: 'star', label: '⭐ Star' },
  { value: 'crown', label: '👑 Crown' },
  { value: 'bolt', label: '⚡ Bolt' },
  { value: 'heart', label: '❤️ Heart' },
  { value: 'eye', label: '👁️ Eye' },
  { value: 'gear', label: '⚙️ Gear' },
  { value: 'key', label: '🔑 Key' },
  { value: 'lock', label: '🔒 Lock' },
  { value: 'pencil', label: '✏️ Pencil' },
  { value: 'wrench', label: '🔧 Wrench' },
  { value: 'flag', label: '🚩 Flag' },
  { value: 'book', label: '📖 Book' },
  { value: 'bell', label: '🔔 Bell' },
  { value: 'tag', label: '🏷️ Tag' },
  { value: 'user-cog', label: '👤 Cog' },
  { value: 'users', label: '👥 Users' },
  { value: 'globe', label: '🌐 Globe' },
  { value: 'chat', label: '💬 Chat' },
  { value: 'code', label: '💻 Code' },
];

function RoleIcon({ icon }: { icon: string }) {
  const emoji = ICON_OPTIONS.find(o => o.value === icon)?.label.split(' ')[0] || '🛡️';
  return <span style={{ fontSize: 18 }}>{emoji}</span>;
}

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#4f7aff', icon: 'shield', permissions: { ...DEFAULT_PERMS } });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRoles(data.roles);
    } catch { setError('Failed to load roles'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const resetForm = () => setForm({ name: '', description: '', color: '#4f7aff', icon: 'shield', permissions: {} });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      setMsg({ type: 'success', text: 'Role created' });
      setShowCreate(false); resetForm(); loadRoles();
    } catch (err: any) { setMsg({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch(`/api/admin/roles/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      setMsg({ type: 'success', text: 'Role updated' });
      setEditing(null); loadRoles();
    } catch (err: any) { setMsg({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      setMsg({ type: 'success', text: 'Role deleted' });
      loadRoles();
    } catch (err: any) { setMsg({ type: 'error', text: err.message }); }
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({ name: role.name, description: role.description || '', color: role.color, icon: role.icon, permissions: { ...role.permissions } });
  };

  const togglePerm = (key: string) => {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  };

  const countActivePerms = (perms: Record<string, boolean>) =>
    Object.values(perms).filter(Boolean).length;

  if (loading) return <div className="settings-page"><p className="loading">Loading roles…</p></div>;

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <h2>Roles & Permissions</h2>
          <p className="desc">Create and manage custom roles with granular permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}>+ New Role</button>
      </div>
      {msg && <div className={`toast toast-${msg.type}`}>{msg.text}<button className="toast-close" onClick={() => setMsg(null)}>×</button></div>}
      {error && <p className="error">{error}</p>}

      {/* Roles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {roles.map(role => (
          <div key={role.id} className="section-card" style={{ marginBottom: 0 }}>
            <div className="section-card-inner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: role.color + '18',
                  border: `2px solid ${role.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  <RoleIcon icon={role.icon} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {role.name}
                    {role.isSystem && <span className="badge badge-super_admin" style={{ fontSize: 9 }}>SYSTEM</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{role.description || 'No description'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span>{role._count.assignments} user{role._count.assignments !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{countActivePerms(role.permissions)} permissions</span>
              </div>
              {!role.isSystem && (
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(role)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(role)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {(showCreate || editing) && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setEditing(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div>
              <h3>{editing ? 'Edit Role' : 'Create Role'}</h3>
              <p className="modal-desc">{editing ? 'Update role name, color, icon, and permissions' : 'Create a new role with custom permissions'}</p>

              <form onSubmit={editing ? handleUpdate : handleCreate}>
                {/* Basic fields */}
                <div className="field">
                  <div className="field-label">Role Name</div>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Content Editor" />
                </div>
                <div className="field">
                  <div className="field-label">Description</div>
                  <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What can this role do?" />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <div className="field-label">Color</div>
                    <div className="color-input-group">
                      <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="color-swatch" />
                      <input className="input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                    </div>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <div className="field-label">Icon</div>
                    <select className="select" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
                      {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Permissions */}
                <div className="sub-section" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Permissions</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Toggle permissions for this role</p>

                  {PERM_GROUPS.map(group => (
                    <div key={group.label} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                        {group.label}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {group.keys.map(k => (
                          <label key={k.key} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 10px', borderRadius: 6,
                            background: form.permissions[k.key] ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                            border: `1px solid ${form.permissions[k.key] ? 'var(--accent)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer', fontSize: 12, color: form.permissions[k.key] ? 'var(--accent)' : 'var(--text-secondary)',
                            transition: 'all 0.1s',
                          }}>
                            <input type="checkbox" checked={!!form.permissions[k.key]}
                              onChange={() => togglePerm(k.key)}
                              style={{ accentColor: 'var(--accent)' }} />
                            {k.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : editing ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
