'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from '../sidebar';
import { apiFetch } from '../lib';

interface User { id: string; email: string; name: string | null; adminRole: string | null; photoUrl: string | null; phoneNumber: string | null; occupation: string | null; createdAt: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [myRole, setMyRole] = useState<string>('');
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
  useEffect(() => { apiFetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.adminRole) setMyRole(d.adminRole); }).catch(() => {}); }, []);

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
              <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Phone</th><th>Occupation</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td>{u.name || '—'}</td>
                    <td>{u.adminRole ? <span className={`badge badge-${u.adminRole}`}>{u.adminRole}</span> : <span className="badge badge-member">member</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.phoneNumber || '—'}</td>
                    <td style={{ fontSize: 12 }}>{u.occupation || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><div className="flex gap-2"><button className="btn btn-sm btn-outline" onClick={() => setEditing(u)}>Edit</button>{myRole === 'super_admin' && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>}</div></td>
                  </tr>
                ))}
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
        {editing && (
          <div className="modal-overlay" onClick={() => setEditing(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div><h3>Edit User</h3><p className="modal-desc">{editing.email}</p>
                <form onSubmit={handleUpdate}>
                  <label>Name</label><input name="name" defaultValue={editing.name || ''} />
                  <label>Occupation</label><input name="occupation" defaultValue={editing.occupation || ''} />
                  <label>Admin Role</label>
                  <select name="adminRole" defaultValue={editing.adminRole || 'none'}>
                    <option value="none">None (regular user)</option>
                    {myRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="editor">Editor</option>
                  </select>
                  <div className="flex gap-2 mt-4"><button type="submit" className="btn btn-primary">Save</button><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button></div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
