'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { Server, RefreshCw, Search, AlertTriangle, AlertCircle, Info, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface LogEntry { id?: string; level?: string; service?: string; message?: string; timestamp?: string; requestId?: string; metadata?: any; }

const LEVEL_MAP: Record<string, { color: string; bg: string }> = {
  error: { color: 'var(--tb-red)', bg: 'var(--tb-red-soft)' },
  warn: { color: 'var(--tb-yellow)', bg: 'var(--tb-yellow-soft)' },
  info: { color: 'var(--tb-blue)', bg: 'var(--tb-blue-soft)' },
  debug: { color: 'var(--tb-text-muted)', bg: 'var(--tb-surface-2)' },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || data.systemLogs || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.message || '').toLowerCase().includes(q) || (l.service || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">System Logs</h1>
            <p className="page-header-description">Application and system log entries</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={fetchLogs}><RefreshCw size={13} /> Refresh</button>
            <button className="btn btn-ghost btn-sm"><Download size={13} /> Export</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tb-text-muted)' }} />
          <input className="input" placeholder="Search logs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 38 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'error', 'warn', 'info', 'debug'].map(l => (
            <button key={l} className={`btn ${levelFilter === l ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => { setLevelFilter(l); setPage(1); }}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: 40 }} />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <Server size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No logs found</div>
          <div className="empty-state-desc">{search ? 'Try a different search' : 'System logs will appear here'}</div>
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: '1px solid var(--tb-border)', overflow: 'hidden', fontFamily: 'var(--tb-font-mono, monospace)' }}>
          {paginated.map((log, i) => {
            const style = LEVEL_MAP[log.level || 'info'] || LEVEL_MAP.info;
            return (
              <div key={log.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 16px', borderBottom: i < paginated.length - 1 ? '1px solid var(--tb-border)' : 'none', fontSize: 12, background: 'var(--tb-bg)' }}>
                <span style={{ width: 50, padding: '2px 6px', borderRadius: 4, background: style.bg, color: style.color, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', flexShrink: 0 }}>
                  {log.level || 'info'}
                </span>
                <span style={{ color: 'var(--tb-text-muted)', width: 140, flexShrink: 0 }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                </span>
                <span style={{ color: 'var(--tb-brand)', width: 80, flexShrink: 0 }}>{log.service || 'system'}</span>
                <span style={{ color: 'var(--tb-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message || '—'}</span>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--tb-text-muted)' }}>
          <span>Page {page} of {totalPages} · {filtered.length} entries</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
