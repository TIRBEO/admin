'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';

interface AuditEvent {
  id: string;
  action: string;
  actorId: string | null;
  actor: { email: string; name: string | null } | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  severity: string;
  createdAt: string;
}

export default function AuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [actionFilter, setActionFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    sp.set('offset', String(page * limit));
    if (actionFilter) sp.set('action', actionFilter);
    if (severityFilter) sp.set('severity', severityFilter);
    if (targetFilter) sp.set('targetType', targetFilter);
    const res = await apiFetch(`/api/admin/audit?${sp}`);
    if (res.ok) {
      const d = await res.json();
      setEvents(d.events);
      setTotal(d.total);
    }
    setLoading(false);
  }, [page, limit, actionFilter, severityFilter, targetFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  const severityBadge = (sev: string) => {
    const map: Record<string, string> = {
      info: 'badge-enabled',
      warning: 'badge-put',
      error: 'badge-delete',
      critical: 'badge-super_admin',
    };
    return <span className={`badge ${map[sev] || 'badge-enabled'}`}>{sev}</span>;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const exportCsv = () => {
    const headers = ['Time', 'Action', 'Actor', 'Target Type', 'Target ID', 'Severity', 'Metadata'];
    const rows = events.map(e => [
      new Date(e.createdAt).toISOString(),
      e.action,
      e.actor?.email || 'system',
      e.targetType || '',
      e.targetId || '',
      e.severity,
      JSON.stringify(e.metadata || {}),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-trail.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="settings-page-header">
        <div>
          <h2>Audit Trail</h2>
          <p className="desc">Structured event log of all admin actions ({total} total)</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={exportCsv}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      <div className="search-form" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="input" placeholder="Search action (e.g. user, role, settings)\u2026" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }} style={{ flex: 1, minWidth: 200 }} />
        <select className="select" value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(0); }} style={{ width: 120 }}>
          <option value="">All severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select className="select" value={targetFilter} onChange={e => { setTargetFilter(e.target.value); setPage(0); }} style={{ width: 140 }}>
          <option value="">All types</option>
          <option value="user">User</option>
          <option value="role">Role</option>
          <option value="route">Route</option>
          <option value="settings">Settings</option>
          <option value="email">Email</option>
          <option value="notification">Notification</option>
          <option value="workspace">Workspace</option>
          <option value="media">Media</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading\u2026</div>
      ) : events.length === 0 ? (
        <div className="empty-state">No audit events match your filters.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 140 }}>Time</th>
                <th style={{ width: 80 }}>Severity</th>
                <th style={{ width: 200 }}>Action</th>
                <th style={{ width: 180 }}>Actor</th>
                <th>Target</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <React.Fragment key={e.id}>
                  <tr role="button" tabIndex={0} onClick={() => setExpandedId(expandedId === e.id ? null : e.id)} onKeyDown={(k) => { if (k.key === 'Enter' || k.key === ' ') { setExpandedId(expandedId === e.id ? null : e.id); } }} style={{ cursor: 'pointer' }}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatTime(e.createdAt)}</td>
                    <td>{severityBadge(e.severity)}</td>
                    <td><code style={{ fontSize: 12 }}>{e.action}</code></td>
                    <td style={{ fontSize: 13 }}>{e.actor?.name || e.actor?.email || <span style={{ color: 'var(--text-muted)' }}>system</span>}</td>
                    <td style={{ fontSize: 13 }}>
                      {e.targetType && <span className="badge badge-member" style={{ marginRight: 4 }}>{e.targetType}</span>}
                      {e.targetId && <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.targetId.substring(0, 12)}\u2026</code>}
                    </td>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{expandedId === e.id ? '\u25BE' : '\u25B8'}</span></td>
                  </tr>
                  {expandedId === e.id && (
                    <tr>
                      <td colSpan={6} style={{ background: 'var(--bg-elevated)', padding: 12 }}>
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', maxHeight: 200, overflow: 'auto' }}>
                          {JSON.stringify(e.metadata, null, 2)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex-between" style={{ marginTop: 16 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Page {page + 1} of {totalPages} ({total} events)</span>
          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

