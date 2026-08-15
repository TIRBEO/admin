'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { Shield, Plus, Users, Settings, Edit3, Trash2, CheckCircle, Lock, ChevronRight, X, RefreshCw } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isSystem?: boolean;
  permissions?: Record<string, boolean>;
  userRoles?: { user: { id: string; email: string; name: string } }[];
  createdAt?: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#4f7aff');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createRole = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({ name: newName, description: newDesc, color: newColor }),
      });
      if (res.ok) {
        showToast(`Role "${newName}" created`);
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
        fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to create role', 'error');
      }
    } catch {
      showToast('Failed to create role', 'error');
    }
    setSaving(false);
  };

  const deleteRole = async (id: string, name: string) => {
    if (!confirm(`Delete role "${name}"? Users with this role will lose it.`)) return;
    try {
      const res = await apiFetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Role "${name}" deleted`);
        setSelectedRole(null);
        fetchRoles();
      }
    } catch {
      showToast('Failed to delete role', 'error');
    }
  };

  return (
    <div className="page-stack">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200, padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? 'var(--tb-green-soft)' : 'var(--tb-red-soft)',
          color: toast.type === 'success' ? 'var(--tb-green)' : 'var(--tb-red)',
          border: `1px solid ${toast.type === 'success' ? 'var(--tb-green)' : 'var(--tb-red)'}30`,
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 200ms ease both', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <X size={14} />}
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Roles</h1>
            <p className="page-header-description">
              {roles.length} roles · {roles.filter(r => r.isSystem).length} system · {roles.filter(r => !r.isSystem).length} custom
            </p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={fetchRoles}><RefreshCw size={13} /> Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}><Plus size={13} /> New Role</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Roles', value: roles.length, color: 'var(--tb-brand)' },
          { label: 'System Roles', value: roles.filter(r => r.isSystem).length, color: 'var(--tb-green)' },
          { label: 'Custom Roles', value: roles.filter(r => !r.isSystem).length, color: 'var(--tb-purple)' },
          { label: 'Total Assignments', value: roles.reduce((a, r) => a + (r.userRoles?.length || 0), 0), color: 'var(--tb-yellow)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><div style={{ width: 7, height: 7, borderRadius: '50%', background: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card" style={{ border: '1px solid var(--tb-brand)' }}>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Create New Role</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowCreate(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="form-label">Role Name *</label>
                <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Editor, Support Agent" autoFocus />
              </div>
              <div>
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid var(--tb-border)', cursor: 'pointer', padding: 0 }} />
                  <input className="input" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ fontFamily: 'monospace', flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Description</label>
              <input className="input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <button className="btn btn-primary btn-sm" onClick={createRole} disabled={!newName.trim() || saving}>
              {saving ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      )}

      {/* Roles Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : roles.length === 0 ? (
        <div className="empty-state">
          <Shield size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No roles found</div>
          <div className="empty-state-desc">Create your first role to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {roles.map(role => {
            const memberCount = role.userRoles?.length || 0;
            const permCount = role.permissions ? Object.values(role.permissions).filter(Boolean).length : 0;
            return (
              <div key={role.id} className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${role.color || 'var(--tb-brand)'}` }}
                onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}>
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${role.color || 'var(--tb-brand)'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={16} style={{ color: role.color || 'var(--tb-brand)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{role.name}</span>
                        {role.isSystem && <span className="badge badge-green">System</span>}
                      </div>
                      {role.description && <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 3 }}>{role.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--tb-border)', fontSize: 12, color: 'var(--tb-text-muted)' }}>
                    <span><Users size={11} style={{ verticalAlign: -1 }} /> {memberCount} users</span>
                    <span><Lock size={11} style={{ verticalAlign: -1 }} /> {permCount} permissions</span>
                    <div style={{ flex: 1 }} />
                    {!role.isSystem && (
                      <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); deleteRole(role.id, role.name); }}
                        style={{ color: 'var(--tb-red)' }}>
                        <Trash2 size={11} />
                      </button>
                    )}
                    <ChevronRight size={14} style={{ color: 'var(--tb-text-muted)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selectedRole && (
        <div className="card" style={{ border: `1px solid ${selectedRole.color || 'var(--tb-brand)'}` }}>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>{selectedRole.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--tb-text-muted)', margin: 0, marginTop: 2 }}>{selectedRole.description || 'No description'}</p>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedRole(null)}><X size={14} /></button>
            </div>

            {/* Assigned Users */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-secondary)', marginBottom: 8 }}>
                Assigned Users ({selectedRole.userRoles?.length || 0})
              </h4>
              {(selectedRole.userRoles || []).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--tb-text-muted)', padding: '12px 0' }}>No users assigned to this role</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedRole.userRoles!.map(ur => (
                    <div key={ur.user.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--tb-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--tb-text-secondary)' }}>
                        {(ur.user.name || ur.user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{ur.user.name || 'Unnamed'}</div>
                        <div style={{ fontSize: 11, color: 'var(--tb-text-muted)' }}>{ur.user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permissions */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-secondary)', marginBottom: 8 }}>
                Permissions ({Object.values(selectedRole.permissions || {}).filter(Boolean).length})
              </h4>
              {selectedRole.permissions && Object.keys(selectedRole.permissions).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {Object.entries(selectedRole.permissions).filter(([, v]) => v).map(([key]) => (
                    <span key={key} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: 'var(--tb-green-soft)', color: 'var(--tb-green)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={10} /> {key}
                    </span>
                  ))}
                  {Object.entries(selectedRole.permissions).filter(([, v]) => !v).map(([key]) => (
                    <span key={key} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: 'var(--tb-surface-2)', color: 'var(--tb-text-muted)', fontFamily: 'monospace', opacity: 0.5 }}>
                      {key}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--tb-text-muted)', padding: '8px 0' }}>No permissions configured</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


