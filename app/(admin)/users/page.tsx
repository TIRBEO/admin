'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch, isOnline } from '../../lib';
import { Toast } from '../settings/shared';

interface Role { id: string; name: string; color: string; icon: string; isSystem?: boolean; description?: string; }
interface User {
  id: string; email: string; name: string | null; adminRole: string | null;
  photoUrl: string | null; phoneNumber: string | null; occupation: string | null;
  createdAt: string; lastActiveAt?: string | null; lastLoginAt?: string | null;
  roles: Role[];
  isBanned?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [myRole, setMyRole] = useState<string>('');
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [resetPwUser, setResetPwUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const limit = 100;

  const loadUsers = async (p: number, s: string) => {
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (s) params.set('search', s);
    const res = await apiFetch(`/api/admin/users?${params}`);
    if (!res.ok) { setMsg({ type: 'error', text: 'Failed to load users' }); return; }
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
    if (res.ok) { setEditing(null); loadUsers(page, search); setMsg({ type: 'success', text: 'User updated' }); } else setMsg({ type: 'error', text: 'Failed to update user' });
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) { loadUsers(page, search); setMsg({ type: 'success', text: 'User deleted' }); } else setMsg({ type: 'error', text: 'Failed to delete user' });
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
    if (res.ok) { loadUsers(page, search); setMsg({ type: 'success', text: 'Roles updated' }); } else setMsg({ type: 'error', text: 'Failed to update roles' });
  };

  const handleResetPassword = async () => {
    if (!resetPwUser || !newPassword || newPassword.length < 8) return;
    setResetLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users/${resetPwUser.id}/password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: `Password reset for ${resetPwUser.email}` });
        setResetPwUser(null); setNewPassword('');
      } else {
        const text = await res.text();
        setMsg({ type: 'error', text: text || 'Failed to reset password' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Connection error' });
    }
    setResetLoading(false);

  };

  const totalPages = Math.ceil(total / limit);
  const isSuperAdmin = myRole === 'super_admin';
  const isAdmin = myRole === 'admin' || isSuperAdmin;

  function getStatusLabel(user: User): { label: string; color: string } {
    if (user.isBanned) return { label: 'Banned', color: 'var(--color-error, var(--error))' };
    if (user.lastActiveAt && isOnline(user.lastActiveAt)) return { label: 'Online', color: 'var(--color-success, var(--success))' };
    return { label: 'Offline', color: 'var(--text-muted)' };
  }

  return (
    <div className="admin-layout">
      <div className="main">
        <h2>Users</h2>
        <p className="desc">{total} total users</p>
        <Toast msg={msg} onClose={() => setMsg(null)} />
        <form onSubmit={handleSearch} className="search-form">
          <input type="text" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
          {search && <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setPage(1); loadUsers(1, ''); }}>Clear</button>}
        </form>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Status</th><th>Email</th><th>Name</th><th>Role</th><th>Custom Roles</th><th>Last Active</th><th>Actions</th></tr></thead>
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
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {u.lastActiveAt ? (
                        <span title={new Date(u.lastActiveAt).toLocaleString()}>
                          {formatRelativeTime(u.lastActiveAt)}
                        </span>
                      ) : (
                        <span>Never</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setEditing(u)}>Edit</button>
                        {isSuperAdmin && (
                          <button className="btn btn-sm btn-outline" onClick={() => { setResetPwUser(u); setNewPassword(''); }} style={{ borderColor: 'var(--warning-subtle, rgba(244,185,66,0.3))', color: 'var(--color-warning, var(--warning))' }}>
                            Reset Password
                          </button>
                        )}
                        {isSuperAdmin && <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(u.id)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {users.length === 0 && <tr><td colSpan={7}><div className="empty-state">No users found</div></td></tr>}
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
                {/* ink-on-yellow in both modes (--color-on-accent is cream in light mode) */}
                <button
                  className="btn btn-primary"
                  disabled={resetLoading || newPassword.length < 8}
                  onClick={handleResetPassword}
                  style={{ background: 'var(--color-warning, var(--warning))', color: '#000000', border: '2px solid var(--color-border, var(--border))' }}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <h3 style={{ marginBottom: 4 }}>Delete user?</h3>
              <p className="modal-desc" style={{ marginBottom: 20 }}>
                This action cannot be undone. The user will be permanently deleted.
              </p>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
