'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from '../sidebar';
import { apiFetch } from '../lib';

interface Workspace { id: string; name: string; slug: string; owner: { id: string; email: string; name: string | null }; _count: { memberships: number }; createdAt: string; }

export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const limit = 20;

  const loadWorkspaces = async (p: number) => {
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    const res = await apiFetch(`/api/admin/workspaces?${params}`);
    if (!res.ok) { setError('Failed to load workspaces'); return; }
    const data = await res.json();
    setWorkspaces(data.workspaces); setTotal(data.total);
  };

  useEffect(() => { loadWorkspaces(page); }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workspace? This will remove all memberships.')) return;
    const res = await apiFetch(`/api/admin/workspaces/${id}`, { method: 'DELETE' });
    if (res.ok) loadWorkspaces(page); else setError('Failed to delete workspace');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        <h2>Workspaces</h2>
        <p className="desc">{total} total workspaces</p>
        {error && <p className="error">{error}</p>}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Slug</th><th>Owner</th><th>Members</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {workspaces.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 500 }}>{w.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{w.slug}</td>
                    <td style={{ fontSize: 12 }}>{w.owner.name || w.owner.email}</td>
                    <td><span className="badge badge-member">{w._count.memberships} members</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => handleDelete(w.id)}>Delete</button></td>
                  </tr>
                ))}
                {workspaces.length === 0 && <tr><td colSpan={6}><div className="empty-state">No workspaces</div></td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span className="info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
