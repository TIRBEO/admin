'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from '../sidebar';
import { apiFetch } from '../lib';

interface Role { id: string; name: string; color: string; icon: string; isSystem?: boolean; description?: string; }
interface User { id: string; email: string; name: string | null; adminRole: string | null; photoUrl: string | null; phoneNumber: string | null; occupation: string | null; createdAt: string; roles: Role[]; }

function RoleAvatar({ role }: { role: Role }) {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
    background: role.color + '18', color: role.color, border: `1px solid ${role.color}33`,
  }}>{role.name}</span>;
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
    const body: Record<string, unknown> = { name: (form.get('name') as string) || undefined, occupation: (form.get('occupation') as string) || undefined };
    if (adminRole === 'none') body.adminRole = null; else body.adminRole = adminRole;
    const res = await apiFetch(`/api/admin/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    if (res.ok) { setEditing(null); loadUsers(page, search); } else setError('Failed to update user');
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        <h2>Users</h2>
        <p className="desc">{total} total users</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSearch} className="search-form">
          <input type="text" placeholder="Search by email or name…" value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
          {search && <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setPage(1); loadUsers(1, ''); }}>Clear</button>}
        </form>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Custom Roles</th><th>Phone</th><th>Occupation</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td>{u.name || '—'}</td>
                    <td>{u.adminRole ? <span className={`badge badge-${u.adminRole}`}>{u.adminRole}</span> : <span className="badge badge-member">member</span>}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {u.roles.map(r => <RoleAvatar key={r.id} role={r} />)}
                        {u.roles.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.phoneNumber || '—'}</td>
                    <td style={{ fontSize: 12 }}>{u.occupation || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><div className="flex gap-2"><button className="btn btn-sm btn-outline" onClick={() => setEditing(u)}>Edit</button>{myRole === 'super_admin' && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>}</div></td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={8}><div className="empty-state">No users found</div></td></tr>}
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

                {/* Profile Fields */}
                <form onSubmit={handleUpdate}>
                  <div className="field">
                    <div className="field-label">Name</div>
                    <input className="input" name="name" defaultValue={editing.name || ''} />
                  </div>
                  <div className="field">
                    <div className="field-label">Occupation</div>
                    <input className="input" name="occupation" defaultValue={editing.occupation || ''} />
                  </div>
                  <div className="field">
                    <div className="field-label">Admin Role (legacy)</div>
                    <select className="select" name="adminRole" defaultValue={editing.adminRole || 'none'}>
                      <option value="none">None (regular user)</option>
                      {myRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Profile</button>
                  </div>
                </form>

                {/* Custom Role Assignment */}
                {myRole === 'super_admin' && allRoles.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Custom Roles</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {allRoles.map(role => {
                        const hasRole = editing.roles.some(r => r.id === role.id);
                        return (
                          <label key={role.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                            background: hasRole ? role.color + '10' : 'transparent',
                            border: `1px solid ${hasRole ? role.color + '44' : 'var(--border-subtle)'}`,
                            borderRadius: 8, cursor: 'pointer',
                            transition: 'all 0.12s',
                          }}>
                            <input type="checkbox" checked={hasRole}
                              onChange={() => handleRoleToggle(editing.id, role.id, hasRole)}
                              style={{ accentColor: role.color }} />
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: role.color, flexShrink: 0,
                            }} />
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
      </div>
    </div>
  );
}
