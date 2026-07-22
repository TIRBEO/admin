'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../lib';

interface Report {
  id: string; targetType: string; targetId: string; reason: string;
  description: string | null; status: string; action: string | null;
  notes: string | null; createdAt: string;
  reporter: { id: string; email: string; name: string | null };
  reviewedBy: { id: string; email: string; name: string | null } | null;
}

interface Stats { byStatus: Array<{ status: string; _count: number }>; byType: Array<{ targetType: string; _count: number }>; byReason: Array<{ reason: string; _count: number }>; }

const STATUS_BADGE: Record<string, string> = { pending: 'badge-put', reviewed: 'badge-enabled', dismissed: 'badge-member', actioned: 'badge-super_admin' };
const REASON_BADGE: Record<string, string> = { spam: 'badge-delete', abuse: 'badge-danger', harassment: 'badge-danger', illegal: 'badge-super_admin', other: 'badge-member' };

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set('limit', '50'); sp.set('offset', String(page * 50));
    if (statusFilter) sp.set('status', statusFilter);
    if (typeFilter) sp.set('targetType', typeFilter);
    const [res, statsRes] = await Promise.all([
      apiFetch(`/api/admin/moderation/reports?${sp}`),
      apiFetch('/api/admin/moderation/stats'),
    ]);
    if (res.ok) { const d = await res.json(); setReports(d.items); setTotal(d.total); }
    if (statsRes.ok) setStats(await statsRes.json());
    setLoading(false);
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const update = async () => {
    if (!selected) return;
    const body: Record<string, string> = {};
    if (action) body.status = 'actioned'; body.action = action;
    if (notes) body.notes = notes;
    await apiFetch(`/api/admin/moderation/reports/${selected.id}`, { method: 'PUT', body: JSON.stringify(body) });
    setSelected(null); setAction(''); setNotes(''); load();
  };

  const dismiss = async (id: string) => {
    await apiFetch(`/api/admin/moderation/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'dismissed', notes: 'Dismissed' }) });
    load();
  };

  const totalPages = Math.ceil(total / 50);

  const getCount = (arr: Array<{ status: string; _count: number }> | undefined, key: string) => arr?.find(x => x.status === key)?._count || 0;

  return (
    <div>
      <div className="settings-page-header">
        <div>
          <h2>Content Moderation</h2>
          <p className="desc">{total} reports â€” {getCount(stats?.byStatus, 'pending')} pending</p>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><div className="num" style={{ color: '#d29922' }}>{getCount(stats.byStatus, 'pending')}</div><div className="label">Pending</div></div>
          <div className="stat-card"><div className="num" style={{ color: '#238636' }}>{getCount(stats.byStatus, 'reviewed')}</div><div className="label">Reviewed</div></div>
          <div className="stat-card"><div className="num" style={{ color: '#8b949e' }}>{getCount(stats.byStatus, 'dismissed')}</div><div className="label">Dismissed</div></div>
          <div className="stat-card"><div className="num" style={{ color: '#2f81f7' }}>{getCount(stats.byStatus, 'actioned')}</div><div className="label">Actioned</div></div>
        </div>
      )}

      {/* Filters */}
      <div className="search-form">
        <select className="select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} style={{ width: 140 }}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="actioned">Actioned</option>
        </select>
        <select className="select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} style={{ width: 140 }}>
          <option value="">All types</option>
          <option value="user">User</option>
          <option value="post">Post</option>
          <option value="comment">Comment</option>
          <option value="media">Media</option>
        </select>
      </div>

      {loading ? <div className="loading">Loadingâ€¦</div> : reports.length === 0 ? (
        <div className="empty-state">No reports match your filters.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Target</th>
                <th>Reporter</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => { setSelected(r); setAction(r.action || ''); setNotes(r.notes || ''); }} onKeyDown={(k) => { if (k.key === 'Enter' || k.key === ' ') { setSelected(r); setAction(r.action || ''); setNotes(r.notes || ''); } }}>
                  <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-member'}`}>{r.status}</span></td>
                  <td><span className="badge badge-member">{r.targetType}</span></td>
                  <td><span className={`badge ${REASON_BADGE[r.reason] || 'badge-member'}`}>{r.reason}</span></td>
                  <td><code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.targetId.substring(0, 12)}â€¦</code></td>
                  <td style={{ fontSize: 13 }}>{r.reporter?.name || r.reporter?.email || 'â€”'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {r.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => { setSelected(r); setAction(''); }}>Review</button>}
                      {r.status === 'pending' && <button className="btn btn-sm btn-outline" onClick={() => dismiss(r.id)}>Dismiss</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex-between" style={{ marginTop: 16 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Page {page + 1} of {totalPages}</span>
          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div>
              <h3>Review Report</h3>
              <p className="modal-desc">
                <span className={`badge ${STATUS_BADGE[selected.status]}`}>{selected.status}</span>{' '}
                <span className="badge badge-member">{selected.targetType}</span>{' '}
                <span className={`badge ${REASON_BADGE[selected.reason]}`}>{selected.reason}</span>
              </p>

              <div style={{ marginBottom: 16 }}>
                <div className="field-label"><span>Target ID</span></div>
                <code style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{selected.targetId}</code>
              </div>

              {selected.description && (
                <div style={{ marginBottom: 16 }}>
                  <div className="field-label"><span>Description</span></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selected.description}</p>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div className="field-label"><span>Reported by</span></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selected.reporter?.name || selected.reporter?.email || 'Unknown'}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="field-label"><span>Action</span></div>
                <select className="select" value={action} onChange={e => setAction(e.target.value)}>
                  <option value="">No action</option>
                  <option value="warned">Warn user</option>
                  <option value="suspended">Suspend user</option>
                  <option value="banned">Ban user</option>
                  <option value="deleted">Delete content</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="field-label"><span>Moderator Notes</span></div>
                <textarea className="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notesâ€¦" />
              </div>

              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => dismiss(selected.id)}>Dismiss</button>
                <button className="btn btn-primary" onClick={update}>Apply Action</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

