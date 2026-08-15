'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { useAdminWs } from '../../useAdminWs';
import {
  Activity, RefreshCw, Clock, Search, Download, ChevronLeft, ChevronRight,
  ArrowRight, Shield, User, Wifi, WifiOff, AlertTriangle, Eye, X,
} from 'lucide-react';

interface ActorInfo { id?: string; name?: string; email?: string; photoUrl?: string; }
interface LogEntry {
  id?: string;
  actorId?: string;
  actor?: ActorInfo;
  action?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  severity?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  isNew?: boolean;
}

const SEVERITY_MAP: Record<string, { color: string; bg: string }> = {
  critical: { color: 'var(--tb-red)', bg: 'var(--tb-red-soft)' },
  warning: { color: 'var(--tb-yellow)', bg: 'var(--tb-yellow-soft)' },
  error: { color: 'var(--tb-red)', bg: 'var(--tb-red-soft)' },
  info: { color: 'var(--tb-blue)', bg: 'var(--tb-blue-soft)' },
};

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\./g, ' → ').replace(/\b\w/g, c => c.toUpperCase());
}

function getActorDisplay(actor?: ActorInfo): string {
  if (!actor) return 'System';
  return actor.name || actor.email?.split('@')[0] || 'Unknown User';
}

function getMetadataSummary(metadata?: Record<string, any>): string {
  if (!metadata || Object.keys(metadata).length === 0) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (key === 'actorId' || key === 'userId') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      parts.push(`${key}: ${value}`);
    } else if (typeof value === 'object' && value !== null) {
      parts.push(`${key}: ${JSON.stringify(value).slice(0, 80)}`);
    }
  }
  return parts.join(' · ');
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<LogEntry | null>(null);
  const [newCount, setNewCount] = useState(0);
  const perPage = 20;

  const { lastMessage, state: wsState } = useAdminWs({ autoReconnect: true });

  // Handle real-time events
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'activity' || lastMessage.type === 'security_event' || lastMessage.type === 'security') {
      const msg = lastMessage as any;
      const event: LogEntry = {
        id: `ws-${Date.now()}`,
        actor: msg.actor ? { name: msg.actor } : undefined,
        action: msg.action || msg.type,
        targetType: msg.resource,
        metadata: msg.metadata,
        severity: msg.severity,
        ipAddress: msg.ip,
        createdAt: new Date().toISOString(),
        isNew: true,
      };
      setLogs(prev => [event, ...prev].slice(0, 200));
      setNewCount(prev => prev + 1);
    }
  }, [lastMessage]);

  // Clear "new" highlights after 5s
  useEffect(() => {
    if (newCount === 0) return;
    const t = setTimeout(() => {
      setLogs(prev => prev.map(l => ({ ...l, isNew: false })));
      setNewCount(0);
    }, 5000);
    return () => clearTimeout(t);
  }, [newCount]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (actionFilter) params.set('action', actionFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      const res = await apiFetch(`/api/admin/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || data || []);
      }
    } catch {}
    setLoading(false);
  }, [actionFilter, severityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      const actorName = getActorDisplay(l.actor).toLowerCase();
      const action = (l.action || '').toLowerCase();
      const target = (l.targetType || '').toLowerCase();
      const meta = getMetadataSummary(l.metadata).toLowerCase();
      if (!actorName.includes(q) && !action.includes(q) && !target.includes(q) && !meta.includes(q)) return false;
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action).filter(Boolean) as string[])];
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const wsConnected = wsState === 'connected';

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Activity</h1>
            <p className="page-header-description">
              All administrative and user actions
              {newCount > 0 && (
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 8, background: 'var(--tb-green-soft)', color: 'var(--tb-green)', marginLeft: 8, fontWeight: 600 }}>
                  {newCount} new
                </span>
              )}
            </p>
          </div>
          <div className="page-header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: wsConnected ? 'var(--tb-green-soft)' : 'var(--tb-surface-2)',
              color: wsConnected ? 'var(--tb-green)' : 'var(--tb-text-muted)' }}>
              {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {wsConnected ? 'Live' : 'Offline'}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchLogs}><RefreshCw size={13} /> Refresh</button>
            <button className="btn btn-ghost btn-sm"><Download size={13} /> Export</button>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tb-text-muted)' }} />
          <input className="input" placeholder="Search by user, action, target..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 38 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'info', 'warning', 'error', 'critical'].map(s => (
            <button key={s} className={`btn ${severityFilter === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => { setSeverityFilter(s); setPage(1); }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Action filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button className={`btn ${actionFilter === '' ? 'btn-primary' : 'btn-ghost'} btn-xs`} onClick={() => { setActionFilter(''); setPage(1); }}>All Actions</button>
        {uniqueActions.slice(0, 10).map(a => (
          <button key={a} className={`btn ${actionFilter === a ? 'btn-primary' : 'btn-ghost'} btn-xs`} onClick={() => { setActionFilter(a); setPage(1); }}>
            {formatAction(a)}
          </button>
        ))}
      </div>

      {/* Activity Log */}
      {loading && logs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <Activity size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No activity found</div>
          <div className="empty-state-desc">{search ? 'Try a different search' : 'Actions will appear here in real-time'}</div>
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: '1px solid var(--tb-border)', overflow: 'hidden' }}>
          {paginated.map((log, i) => {
            const sev = SEVERITY_MAP[log.severity || 'info'] || SEVERITY_MAP.info;
            const actorDisplay = getActorDisplay(log.actor);
            const actorInitial = actorDisplay.charAt(0).toUpperCase();
            const metaSummary = getMetadataSummary(log.metadata);
            const isNew = log.isNew;

            return (
              <div key={log.id || i}
                onClick={() => setDetail(detail?.id === log.id ? null : log)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px',
                  borderBottom: i < paginated.length - 1 ? '1px solid var(--tb-border)' : 'none',
                  background: isNew ? 'var(--tb-green-soft)' : detail?.id === log.id ? 'var(--tb-surface-1)' : 'var(--tb-bg)',
                  transition: 'background 3s ease-out', cursor: 'pointer',
                }}>
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--tb-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--tb-text-secondary)', flexShrink: 0, border: '1px solid var(--tb-border)' }}>
                  {log.actor?.photoUrl ? (
                    <img src={log.actor.photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : actorInitial}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Main line: Actor + Action + Target */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: 'var(--tb-text-primary)' }}>{actorDisplay}</span>
                    <span style={{ color: 'var(--tb-text-secondary)' }}>{formatAction(log.action || 'unknown')}</span>
                    {log.targetType && (
                      <>
                        <ArrowRight size={11} style={{ color: 'var(--tb-text-muted)' }} />
                        <span className="badge badge-sm badge-gray">{log.targetType}{log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ''}</span>
                      </>
                    )}
                    {isNew && (
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--tb-green)', color: 'white', fontWeight: 600 }}>LIVE</span>
                    )}
                  </div>

                  {/* Metadata summary */}
                  {metaSummary && (
                    <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {metaSummary}
                    </div>
                  )}

                  {/* Timestamp + IP + Severity */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: 'var(--tb-text-muted)', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {isNew ? 'just now' : timeAgo(log.createdAt)}</span>
                    {log.actor?.email && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} /> {log.actor.email}</span>}
                    {log.ipAddress && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={10} /> {log.ipAddress}</span>}
                    {log.severity && log.severity !== 'info' && (
                      <span style={{ padding: '1px 5px', borderRadius: 4, background: sev.bg, color: sev.color, fontSize: 10, fontWeight: 600 }}>
                        {log.severity}
                      </span>
                    )}
                  </div>
                </div>

                <Eye size={13} style={{ color: 'var(--tb-text-muted)', flexShrink: 0, marginTop: 4 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {detail && (
        <div className="card" style={{ border: '1px solid var(--tb-brand)' }}>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Event Details</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setDetail(null)}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              {[
                { label: 'Actor', value: getActorDisplay(detail.actor) },
                { label: 'Actor Email', value: detail.actor?.email || '—' },
                { label: 'Action', value: detail.action || '—' },
                { label: 'Target Type', value: detail.targetType || '—' },
                { label: 'Target ID', value: detail.targetId || '—' },
                { label: 'Severity', value: detail.severity || 'info' },
                { label: 'IP Address', value: detail.ipAddress || '—' },
                { label: 'Timestamp', value: detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '—' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ color: 'var(--tb-text-primary)', fontFamily: f.label === 'Target ID' || f.label === 'IP Address' ? 'monospace' : undefined, fontSize: f.label === 'Target ID' ? 11 : 13 }}>{f.value}</div>
                </div>
              ))}
            </div>
            {detail.metadata && Object.keys(detail.metadata).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Metadata</div>
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)', fontFamily: 'monospace', fontSize: 12, color: 'var(--tb-text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(detail.metadata, null, 2)}
                </div>
              </div>
            )}
            {detail.userAgent && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>User Agent</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--tb-text-muted)', wordBreak: 'break-all' }}>{detail.userAgent}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--tb-text-muted)' }}>
          <span>Page {page} of {totalPages} · {filtered.length} events</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
