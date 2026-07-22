'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from '../sidebar';
import { apiFetch, isOnline } from '../lib';

interface Role { id: string; name: string; color: string; icon: string; isSystem?: boolean; description?: string; }
interface User {
  id: string; email: string; name: string | null; adminRole: string | null;
  photoUrl: string | null; phoneNumber: string | null; occupation: string | null;
  createdAt: string; lastActiveAt?: string; roles: Role[];
  isBanned?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [myRole, setMyRole] = useState<string>('');
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [resetPwUser, setResetPwUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const limit = 100;

  const loadUsers = async (p: number, s: string) => {
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (s) params.set('search', s);
    const res = await apiFetch(`/api/admin/users?${params}`);
    if (!res.ok) { setError('Failed to load users'); return; }
    const data = await res.json();
    setUsers(data.users); setTotal(data.total);
  };

  useEffect(() => { loadUsers(page, search); }, [page]);
  useEffect(() => {
    apiFetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.adminRole) setMyRole(d.adminRole);
    }).catch(() => {});
    apiFetch('/api/admin/roles').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.roles) setAllRoles(d.roles.filter((r: Role) => !r.isSystem));
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadUsers(1, search); };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const adminRole = form.get('adminRole') as string;
    const body: Record<string, unknown> = {
      name: (form.get('name') as string) || undefined,
      occupation: (form.get('occupation') as string) || undefined,
    };
    if (isSuperAdmin) {
      if (adminRole === 'none') body.adminRole = null; else body.adminRole = adminRole;
    }
    const res = await apiFetch(`/api/admin/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    if (res.ok) { setEditing(null); loadUsers(page, search); } else setError('Failed to update user');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) loadUsers(page, search); else setError('Failed to delete user');
  };

  const handleRoleToggle = async (userId: string, roleId: string, hasRole: boolean) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newRoles = hasRole
      ? user.roles.filter(r => r.id !== roleId).map(r => r.id)
      : [...user.roles.map(r => r.id), roleId];
    const res = await apiFetch(`/api/admin/users/${userId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ roleIds: newRoles }),
    });
    if (res.ok) loadUsers(page, search); else setError('Failed to update roles');
  };

  const handleResetPassword = async () => {
    if (!resetPwUser || !newPassword || newPassword.length < 8) return;
    setResetLoading(true); setResetMsg(null);
    try {
      const res = await apiFetch(`/api/admin/users/${resetPwUser.id}/password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setResetMsg({ type: 'success', text: `Password reset for ${resetPwUser.email}` });
        setResetPwUser(null); setNewPassword('');
      } else {
        const text = await res.text();
        setResetMsg({ type: 'error', text: text || 'Failed to reset password' });
      }
    } catch {
      setResetMsg({ type: 'error', text: 'Connection error' });
    }
    setResetLoading(false);
    setTimeout(() => setResetMsg(null), 4000);
  };

  const totalPages = Math.ceil(total / limit);
  const isSuperAdmin = myRole === 'super_admin';
  const isAdmin = myRole === 'admin' || isSuperAdmin;

  function getStatusLabel(user: User): { label: string; color: string } {
    if (user.isBanned) return { label: 'Banned', color: '#da3633' };
    if (isOnline(user.lastActiveAt)) return { label: 'Online', color: '#238636' };
    return { label: 'Offline', color: 'rgba(255,255,255,0.2)' };
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        <h2>Users</h2>
        <p className="desc">{total} total users</p>
        {error && <p className="error">{error}</p>}
        {resetMsg && (
          <div className={`toast toast-${resetMsg.type}`} style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: 12 }}>
            {resetMsg.text}
          </div>
        )}
        <form onSubmit={handleSearch} className="search-form">
          <input type="text" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
          {search && <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setPage(1); loadUsers(1, ''); }}>Clear</button>}
        </form>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Status</th><th>Email</th><th>Name</th><th>Role</th><th>Custom Roles</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => {
                  const status = getStatusLabel(u);
                  return (
                  <tr key={u.id}>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: status.color, fontWeight: 500 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, display: 'inline-block' }} />
                      {status.label}
                    </span></td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td>{u.name || '—'}</td>
                    <td>{u.adminRole ? <span className={`badge badge-${u.adminRole}`}>{u.adminRole}</span> : <span className="badge badge-member">member</span>}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {u.roles.map(r => (
                          <span key={r.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: r.color + '18', color: r.color, border: `1px solid ${r.color}33`,
                          }}>{r.name}</span>
                        ))}
                        {u.roles.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setEditing(u)}>Edit</button>
                        {isSuperAdmin && (
                          <button className="btn btn-sm btn-outline" onClick={() => { setResetPwUser(u); setNewPassword(''); setResetMsg(null); }} style={{ borderColor: 'var(--warning-subtle, rgba(244,185,66,0.3))', color: '#F4B942' }}>
                            Reset Password
                          </button>
                        )}
                        {isSuperAdmin && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {users.length === 0 && <tr><td colSpan={6}><div className="empty-state">No users found</div></td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span className="info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editing && (
          <div className="modal-overlay" onClick={() => setEditing(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div>
                <h3>Edit User</h3>
                <p className="modal-desc">{editing.email}</p>
                <form onSubmit={handleUpdate}>
                  <div className="field">
                    <div className="field-label">Name</div>
                    <input className="input" name="name" defaultValue={editing.name || ''} />
                  </div>
                  <div className="field">
                    <div className="field-label">Occupation</div>
                    <input className="input" name="occupation" defaultValue={editing.occupation || ''} />
                  </div>
                  {isSuperAdmin && (
                    <div className="field">
                      <div className="field-label">Admin Role</div>
                      <select className="select" name="adminRole" defaultValue={editing.adminRole || 'none'}>
                        <option value="none">None (regular user)</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="editor">Editor</option>
                      </select>
                    </div>
                  )}
                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Profile</button>
                  </div>
                </form>

                {/* Custom Role Assignment */}
                {isSuperAdmin && allRoles.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Custom Roles</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {allRoles.map(role => {
                        const hasRole = editing.roles.some(r => r.id === role.id);
                        return (
                          <label key={role.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                            background: hasRole ? role.color + '10' : 'transparent',
                            border: `1px solid ${hasRole ? role.color + '44' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 8, cursor: 'pointer',
                          }}>
                            <input type="checkbox" checked={hasRole}
                              onChange={() => handleRoleToggle(editing.id, role.id, hasRole)}
                              style={{ accentColor: role.color }} />
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{role.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{role.description || ''}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetPwUser && (
          <div className="modal-overlay" onClick={() => setResetPwUser(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <h3 style={{ marginBottom: 4 }}>Reset Password</h3>
              <p className="modal-desc" style={{ marginBottom: 20 }}>
                Set a new password for <strong>{resetPwUser.email}</strong>
              </p>
              <div className="field">
                <div className="field-label">New Password</div>
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoFocus
                />
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Password must be at least 8 characters</p>
                )}
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setResetPwUser(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={resetLoading || newPassword.length < 8}
                  onClick={handleResetPassword}
                  style={{ background: 'linear-gradient(135deg, #F4B942, #d4a030)' }}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
