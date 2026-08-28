'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { AlertTriangle, RefreshCw, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface CrashEvent {
  id: string;
  source: string;
  type: string;
  severity: string;
  message: string | null;
  stack: string | null;
  url: string | null;
  userId: string;
  userEmail: string | null;
  username: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

const SEV_MAP: Record<string, { color: string; bg: string }> = {
  critical: { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  error: { color: 'var(--tb-red, #ef4444)', bg: 'var(--tb-red-soft, rgba(239,68,68,0.1))' },
  warning: { color: 'var(--tb-yellow, #f59e0b)', bg: 'var(--tb-yellow-soft, rgba(245,158,11,0.1))' },
  info: { color: 'var(--tb-blue, #3b82f6)', bg: 'var(--tb-blue-soft, rgba(59,130,246,0.1))' },
};

export default function CrashesPage() {
  const [events, setEvents] = useState<CrashEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const perPage = 20;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: String(perPage * 5), skip: String((page - 1) * perPage) });
      if (sevFilter !== 'all') params.set('severity', sevFilter);
      const res = await apiFetch(`/api/content/incident-events?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [page, sevFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = events.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      return (e.type || '').toLowerCase().includes(q) || (e.message || '').toLowerCase().includes(q) || (e.userEmail || '').toLowerCase().includes(q) || (e.username || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Crash Reports
            </h1>
            <p className="page-header-description">All user crash reports with details</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={fetchEvents}><RefreshCw size={13} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tb-text-muted)' }} />
          <input className="input" placeholder="Search crashes..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 38 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'critical', 'error', 'warning', 'info'].map(s => (
            <button key={s} className={`btn ${sevFilter === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => { setSevFilter(s); setPage(1); }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <AlertTriangle size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No crash reports</div>
          <div className="empty-state-desc">{search ? 'Try a different search' : 'Crash reports from users will appear here'}</div>
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: '1px solid var(--tb-border)', overflow: 'hidden' }}>
          {filtered.map((event, i) => {
            const sev = SEV_MAP[event.severity] || SEV_MAP.error;
            const isOpen = expanded === event.id;
            return (
              <div key={event.id}>
                <div
                  onClick={() => setExpanded(isOpen ? null : event.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    borderBottom: i < filtered.length - 1 || isOpen ? '1px solid var(--tb-border)' : 'none',
                    background: 'var(--tb-bg)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  <span style={{ width: 60, padding: '2px 8px', borderRadius: 4, background: sev.bg, color: sev.color, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', flexShrink: 0 }}>
                    {event.severity}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 500, color: 'var(--tb-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.type}
                  </span>
                  <span style={{ color: 'var(--tb-text-muted)', fontSize: 12, flexShrink: 0, width: 140, textAlign: 'right' }}>
                    {event.userEmail || event.username || event.userId?.slice(0,8) || '—'}
                  </span>
                  <span style={{ color: 'var(--tb-text-muted)', fontSize: 12, flexShrink: 0, width: 140, textAlign: 'right' }}>
                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : '—'}
                  </span>
                  {isOpen ? <ChevronUp size={14} style={{ color: 'var(--tb-text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--tb-text-muted)', flexShrink: 0 }} />}
                </div>
                {isOpen && (
                  <div style={{ padding: '14px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--tb-border)' : 'none', background: 'var(--tb-surface-2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>Message: </span><span style={{ color: 'var(--tb-text-primary)' }}>{event.message || '—'}</span></div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>Source: </span><span style={{ color: 'var(--tb-text-primary)' }}>{event.source || '—'}</span></div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>URL: </span><span style={{ color: 'var(--tb-text-primary)' }}>{event.url || '—'}</span></div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>User Agent: </span><span style={{ color: 'var(--tb-text-primary)', fontSize: 11, wordBreak: 'break-all' }}>{event.userAgent || '—'}</span></div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>User ID: </span><span style={{ color: 'var(--tb-text-primary)', fontFamily: 'monospace', fontSize: 11 }}>{event.userId || '—'}</span></div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>Event ID: </span><span style={{ color: 'var(--tb-text-primary)', fontFamily: 'monospace', fontSize: 11 }}>{event.id}</span></div>
                    </div>
                    {event.stack && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginBottom: 4 }}>Stack Trace</div>
                        <pre style={{ margin: 0, padding: '10px 12px', background: 'var(--tb-bg)', border: '1px solid var(--tb-border)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--tb-font-mono, monospace)', color: 'var(--tb-text-primary)', maxHeight: 250, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {event.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--tb-text-muted)' }}>
          <span>Page {page} of {totalPages} · {total} reports</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
