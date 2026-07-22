'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from '../sidebar';
import { apiFetch } from '../lib';

interface Route { id: string; path: string; method: string; target: string | null; allowedRoles: string[]; internal: boolean; enabled: boolean; createdAt: string; }

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadRoutes = async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin/routes');
    if (res.ok) setRoutes(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadRoutes(); }, []);

const ALL_ROLES = ['guest', 'member', 'editor', 'manager', 'admin', 'super_admin'];

function RoleCheckboxes({ name, defaultValues = ['member'] }: { name: string; defaultValues?: string[] }) {
  const [selected, setSelected] = React.useState<string[]>(defaultValues);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      <input type="hidden" name={name} value={selected.join(',')} />
      {ALL_ROLES.map(role => (
        <label key={role} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
          borderRadius: 8, fontSize: 12, cursor: 'pointer',
          background: selected.includes(role) ? 'rgba(79,122,255,0.15)' : 'rgba(255,255,255,0.04)',
          border: selected.includes(role) ? '1px solid rgba(79,122,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
          color: selected.includes(role) ? '#7a9aff' : 'var(--text-muted)',
        }}>
          <input type="checkbox" checked={selected.includes(role)} onChange={() => {
            setSelected(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
          }} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0, pointerEvents: 'none' }} />
          {role}
        </label>
      ))}
    </div>
  );
}

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await apiFetch('/api/admin/routes', {
      method: 'POST',
      body: JSON.stringify({
        path: form.get('path'), method: form.get('method'), target: (form.get('target') as string) || null,
        allowedRoles: ((form.get('allowedRoles') as string) || 'member').split(',').map(s => s.trim()),
        internal: form.get('internal') === 'true', enabled: form.get('enabled') === 'true',
      }),
    });
    if (res.ok) { setShowCreate(false); loadRoutes(); } else setError('Failed to create route');
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const res = await apiFetch(`/api/admin/routes/${editing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        path: form.get('path'), method: form.get('method'), target: (form.get('target') as string) || null,
        allowedRoles: ((form.get('allowedRoles') as string) || 'member').split(',').map(s => s.trim()),
        internal: form.get('internal') === 'true', enabled: form.get('enabled') === 'true',
      }),
    });
    if (res.ok) { setEditing(null); loadRoutes(); } else setError('Failed to update route');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    const res = await apiFetch(`/api/admin/routes/${id}`, { method: 'DELETE' });
    if (res.ok) loadRoutes(); else setError('Failed to delete route');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        <div className="flex-between">
          <div><h2>Routes</h2><p className="desc">Configure API routing and access control</p></div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Route</button>
        </div>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <div className="loading" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading routes…</div>
        ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Path</th><th>Method</th><th>Internal</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {routes.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.path}</td>
                    <td><span className={`badge badge-${r.method.toLowerCase()}`}>{r.method}</span></td>
                    <td style={{ color: r.internal ? '#4ade80' : 'var(--text-muted)' }}>{r.internal ? 'Yes' : 'No'}</td>
                    <td style={{ fontSize: 12 }}>{r.allowedRoles.join(', ')}</td>
                    <td><span className={`badge ${r.enabled ? 'badge-enabled' : 'badge-disabled'}`}>{r.enabled ? 'Enabled' : 'Disabled'}</span></td>
                    <td><div className="flex gap-2"><button className="btn btn-sm btn-outline" onClick={() => setEditing(r)}>Edit</button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>Delete</button></div></td>
                  </tr>
                ))}
                {routes.length === 0 && <tr><td colSpan={6}><div className="empty-state">No routes configured</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        )}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div><h3>Create Route</h3>
                <form onSubmit={handleCreate}>
                  <label>Path</label><input name="path" required placeholder="e.g. users/me" />
                  <label>Method</label><select name="method"><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option></select>
                  <label>Target</label><input name="target" placeholder="https://upstream.example.com/api" />
                  <label>Allowed Roles</label><RoleCheckboxes name="allowedRoles" />
                  <div className="flex gap-2"><div style={{ flex: 1 }}><label>Internal</label><select name="internal"><option value="false">No</option><option value="true">Yes</option></select></div><div style={{ flex: 1 }}><label>Enabled</label><select name="enabled"><option value="true">Yes</option><option value="false">No</option></select></div></div>
                  <div className="flex gap-2 mt-4"><button type="submit" className="btn btn-primary">Create</button><button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button></div>
                </form>
              </div>
            </div>
          </div>
        )}
        {editing && (
          <div className="modal-overlay" onClick={() => setEditing(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div><h3>Edit Route</h3>
                <form onSubmit={handleUpdate}>
                  <label>Path</label><input name="path" defaultValue={editing.path} required />
                  <label>Method</label><select name="method" defaultValue={editing.method}><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option></select>
                  <label>Target</label><input name="target" defaultValue={editing.target || ''} />
                  <label>Allowed Roles</label><RoleCheckboxes name="allowedRoles" defaultValues={editing.allowedRoles} />
                  <div className="flex gap-2"><div style={{ flex: 1 }}><label>Internal</label><select name="internal" defaultValue={String(editing.internal)}><option value="false">No</option><option value="true">Yes</option></select></div><div style={{ flex: 1 }}><label>Enabled</label><select name="enabled" defaultValue={String(editing.enabled)}><option value="true">Yes</option><option value="false">No</option></select></div></div>
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



