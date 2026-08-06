'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib';
import { Shield, Plus, Edit, Trash2, Users, Check, Minus, X } from 'lucide-react';

type Level = 'view' | 'edit' | 'both' | 'off';

interface PermissionResource {
  key: string;
  label: string;
  description: string;
  viewKey: string;
  editKey?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  isSystem: boolean;
  userRoles: { user: { id: string; email: string; name: string } }[];
}

const LEVEL_OPTIONS: { value: Level; label: string; icon: any }[] = [
  { value: 'off', label: 'Off', icon: X },
  { value: 'view', label: 'View', icon: Check },
  { value: 'edit', label: 'Edit', icon: Edit },
  { value: 'both', label: 'View + Edit', icon: Minus },
];

function levelFromPerms(perms: Record<string, any>, res: PermissionResource): Level {
  const view = perms[res.viewKey] === true;
  const edit = !!res.editKey && perms[res.editKey] === true;
  if (view && edit) return 'both';
  if (edit) return 'edit';
  if (view) return 'view';
  return 'off';
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<PermissionResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', levels: {} as Record<string, Level> });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await apiFetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || data);
        if (data.groups) setGroups(data.groups);
      }
    } catch {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditingRole(null);
    const levels: Record<string, Level> = {};
    for (const g of groups) levels[g.key] = 'off';
    setFormData({ name: '', description: '', levels });
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    const levels: Record<string, Level> = {};
    for (const g of groups) levels[g.key] = levelFromPerms(role.permissions || {}, g);
    setFormData({ name: role.name, description: role.description || '', levels });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    const permissions: Record<string, boolean> = {};
    for (const g of groups) {
      const level = formData.levels[g.key];
      if (level === 'view' || level === 'both') permissions[g.viewKey] = true;
      if (g.editKey && (level === 'edit' || level === 'both')) permissions[g.editKey] = true;
    }
    try {
      const method = editingRole ? 'PUT' : 'POST';
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, description: formData.description, permissions }),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingRole(null);
        loadRoles();
      }
    } catch {}
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) return;
    if (!confirm('Delete this role?')) return;
    try {
      const res = await apiFetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      if (res.ok) loadRoles();
    } catch {}
  };

  if (loading) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Two system roles (Admin, User) plus custom roles with view/edit access per app</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {roles.filter(r => r.isSystem).map(role => (
          <div key={role.id} className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">{role.name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">{role.description || 'System role'}</p>
              </div>
              <span className="ml-auto inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">System</span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <Users className="w-3.5 h-3.5" />
              {role.userRoles.length} member{role.userRoles.length === 1 ? '' : 's'}
            </div>
          </div>
        ))}
      </div>

      <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center">
                        <Shield className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{role.name}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{role.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{role.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      <Users className="w-3.5 h-3.5" />
                      {role.userRoles.length}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${role.isSystem ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {role.isSystem ? 'System' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(role)}
                        className="text-[var(--color-primary)] hover:underline text-xs flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => handleDelete(role.id, role.isSystem)}
                          className="text-[var(--color-error)] hover:underline text-xs flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[var(--shadow-card)] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Role Name</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)]"
                    placeholder="e.g. Editor, Viewer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Description</label>
                  <input
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)]"
                    placeholder="What can this role do?"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">App permissions</label>
                <div className="border-2 border-[var(--color-border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-surface-muted)]">
                        <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">App</th>
                        <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Description</th>
                        <th className="px-3 py-2 text-right font-medium text-[var(--color-text-secondary)]">Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(g => {
                        const level = formData.levels[g.key] || 'off';
                        return (
                          <tr key={g.key} className="border-t border-[var(--color-border)]">
                            <td className="px-3 py-2.5 font-medium text-[var(--color-text)]">{g.label}</td>
                            <td className="px-3 py-2.5 text-xs text-[var(--color-text-tertiary)]">{g.description}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                {LEVEL_OPTIONS.map(opt => {
                                  const active = level === opt.value;
                                  const disabled = opt.value === 'edit' && !g.editKey;
                                  return (
                                    <button
                                      key={opt.value}
                                      disabled={disabled}
                                      onClick={() => setFormData({ ...formData, levels: { ...formData.levels, [g.key]: opt.value } })}
                                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                        active
                                          ? 'bg-[var(--color-primary)] text-white'
                                          : disabled
                                            ? 'text-[var(--color-text-tertiary)] opacity-40 cursor-not-allowed'
                                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
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
            <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
                {editingRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
