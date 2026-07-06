'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from '../sidebar';
import { apiFetch } from '../lib';

interface Log { id: string; method: string; path: string; status: number; ip: string; userId: string | null; createdAt: string; }
interface Blocked { id: string; ip: string | null; userId: string | null; reason: string | null; createdAt: string; }

export default function AdminMonitorPage() {
  const [tab, setTab] = useState<'logs' | 'blocked'>('logs');
  const [logs, setLogs] = useState<Log[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [error, setError] = useState('');
  const [showAddBlock, setShowAddBlock] = useState(false);

  const loadData = async () => {
    const [logsRes, blockedRes] = await Promise.all([
      apiFetch('/api/admin/monitor/logs?limit=200'),
      apiFetch('/api/admin/monitor/blocked'),
    ]);
    if (logsRes.ok) setLogs(await logsRes.json());
    if (blockedRes.ok) setBlocked(await blockedRes.json());
  };

  useEffect(() => { loadData(); }, []);

  const handleAddBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    const ip = form.get('ip') as string; const userId = form.get('userId') as string; const reason = form.get('reason') as string;
    if (ip) body.ip = ip; if (userId) body.userId = userId; if (reason) body.reason = reason;
    const res = await apiFetch('/api/admin/monitor/blocked', { method: 'POST', body: JSON.stringify(body) });
    if (res.ok) { setShowAddBlock(false); loadData(); } else setError('Failed to add block');
  };

  const handleRemoveBlock = async (id: string) => {
    const res = await apiFetch('/api/admin/monitor/blocked', { method: 'DELETE', body: JSON.stringify({ id }) });
    if (res.ok) loadData(); else setError('Failed to remove block');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        <h2>Monitor</h2>
        <p className="desc">Request logs and blocklist management</p>
        {error && <p className="error">{error}</p>}
        <div className="tabs">
          <button className={`tab-btn ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>Logs</button>
          <button className={`tab-btn ${tab === 'blocked' ? 'active' : ''}`} onClick={() => setTab('blocked')}>Blocklist ({blocked.length})</button>
        </div>
        {tab === 'logs' && (
          <div className="card">
            <div style={{ maxHeight: 600, overflow: 'auto' }}>
              <table>
                <thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>IP</th><th>User</th></tr></thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                      <td><span className={`badge badge-${l.method.toLowerCase()}`}>{l.method}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.path}</td>
                      <td><span className={`badge ${(l.status || 0) < 300 ? 'badge-enabled' : (l.status || 0) < 500 ? 'badge-get' : 'badge-disabled'}`}>{l.status}</span></td>
                      <td style={{ fontSize: 12 }}>{l.ip || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.userId ? l.userId.substring(0, 8) + '…' : '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={6}><div className="empty-state">No logs yet</div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'blocked' && (
          <>
            <div className="flex-between mb-4"><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{blocked.length} blocked entries</span><button className="btn btn-primary" onClick={() => setShowAddBlock(true)}>+ Add Block</button></div>
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>IP</th><th>User ID</th><th>Reason</th><th>Created</th><th>Action</th></tr></thead>
                  <tbody>
                    {blocked.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.ip || '—'}</td>
                        <td style={{ fontSize: 12 }}>{b.userId ? b.userId.substring(0, 12) + '…' : '—'}</td>
                        <td style={{ fontSize: 12 }}>{b.reason || '—'}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => handleRemoveBlock(b.id)}>Remove</button></td>
                      </tr>
                    ))}
                    {blocked.length === 0 && <tr><td colSpan={5}><div className="empty-state">No blocked entries</div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            {showAddBlock && (
              <div className="modal-overlay" onClick={() => setShowAddBlock(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <div><h3>Add Block</h3><p className="modal-desc">Block by IP address or user ID</p>
                    <form onSubmit={handleAddBlock}>
                      <label>IP Address</label><input name="ip" placeholder="192.168.1.1" />
                      <label>User ID</label><input name="userId" placeholder="user_cuid" />
                      <label>Reason</label><input name="reason" placeholder="Abuse / spam" />
                      <div className="flex gap-2 mt-4"><button type="submit" className="btn btn-primary">Add Block</button><button type="button" className="btn btn-outline" onClick={() => setShowAddBlock(false)}>Cancel</button></div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
