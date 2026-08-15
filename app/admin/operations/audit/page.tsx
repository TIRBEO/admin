'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import {
  FileWarning, RefreshCw, Search, Clock, User, Shield, AlertTriangle,
  AlertCircle, Info, ChevronLeft, ChevronRight, Download, Eye, X,
  Calendar, FileText, CheckCircle, ArrowRight,
} from 'lucide-react';

interface ActorInfo { id?: string; name?: string; email?: string; photoUrl?: string; }
interface AuditEntry {
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
}

const SEVERITY_MAP: Record<string, { color: string; icon: any }> = {
  critical: { color: 'var(--tb-red)', icon: AlertTriangle },
  high: { color: 'var(--tb-orange)', icon: AlertCircle },
  medium: { color: 'var(--tb-yellow)', icon: Info },
  low: { color: 'var(--tb-text-muted)', icon: Info },
  info: { color: 'var(--tb-blue)', icon: Info },
};

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\./g, ' → ').replace(/\b\w/g, c => c.toUpperCase());
}

function getActorDisplay(actor?: ActorInfo): string {
  if (!actor) return 'System';
  return actor.name || actor.email?.split('@')[0] || 'Unknown User';
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditEntry | null>(null);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, medium: 0 });
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportSeverity, setExportSeverity] = useState('all');
  const [exporting, setExporting] = useState(false);
  const perPage = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/audit?limit=200');
      if (res.ok) {
        const data = await res.json();
        const list = data.events || data.logs || data.auditLogs || data || [];
        setEntries(list);
        setStats({
          total: list.length,
          critical: list.filter((e: AuditEntry) => e.severity === 'critical').length,
          high: list.filter((e: AuditEntry) => e.severity === 'high').length,
          medium: list.filter((e: AuditEntry) => e.severity === 'medium').length,
        });
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = entries.filter(e => {
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (actionFilter && e.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const actorName = getActorDisplay(e.actor).toLowerCase();
      const actorEmail = (e.actor?.email || '').toLowerCase();
      const action = (e.action || '').toLowerCase();
      const target = (e.targetType || '').toLowerCase();
      const ip = (e.ipAddress || '').toLowerCase();
      if (!actorName.includes(q) && !actorEmail.includes(q) && !action.includes(q) && !target.includes(q) && !ip.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const uniqueActions = [...new Set(entries.map(e => e.action).filter(Boolean) as string[])];

  // Export logic
  const exportEntries = useCallback(() => {
    let data = entries;
    if (exportSeverity !== 'all') data = data.filter(e => e.severity === exportSeverity);
    if (exportFrom) data = data.filter(e => e.createdAt && new Date(e.createdAt) >= new Date(exportFrom));
    if (exportTo) data = data.filter(e => e.createdAt && new Date(e.createdAt) <= new Date(exportTo + 'T23:59:59'));

    if (exportFormat === 'csv') {
      const headers = ['Timestamp', 'Actor', 'Actor Email', 'Action', 'Target Type', 'Target ID', 'Severity', 'IP Address', 'User Agent', 'Metadata'];
      const rows = data.map(e => [
        e.createdAt ? new Date(e.createdAt).toISOString() : '',
        getActorDisplay(e.actor),
        e.actor?.email || '',
        e.action || '',
        e.targetType || '',
        e.targetId || '',
        e.severity || 'info',
        e.ipAddress || '',
        e.userAgent || '',
        e.metadata ? JSON.stringify(e.metadata) : '',
      ]);
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const jsonData = data.map(e => ({
        id: e.id,
        timestamp: e.createdAt,
        actor: { id: e.actor?.id, name: getActorDisplay(e.actor), email: e.actor?.email },
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        severity: e.severity,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        metadata: e.metadata,
      }));
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    }
    setShowExport(false);
  }, [entries, exportFormat, exportFrom, exportTo, exportSeverity]);

  return (
    <div className="page-stack">
      {/* Export Dialog */}
      {showExport && (
        <div className="tb-search-overlay" onClick={() => setShowExport(false)}>
          <div className="tb-search-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Export Audit Log</h3>
                <button className="btn btn-ghost btn-xs" onClick={() => setShowExport(false)}><X size={16} /></button>
              </div>

              {/* Format */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Format</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'csv', label: 'CSV', desc: 'Spreadsheet compatible' },
                    { value: 'json', label: 'JSON', desc: 'Structured data' },
                  ].map(f => (
                    <button key={f.value} type="button" onClick={() => setExportFormat(f.value as any)}
                      style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: `2px solid ${exportFormat === f.value ? 'var(--tb-brand)' : 'var(--tb-border)'}`, background: exportFormat === f.value ? 'var(--tb-brand-soft)' : 'var(--tb-surface-1)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 2 }}>{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="form-label">From Date</label>
                  <input className="input" type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">To Date</label>
                  <input className="input" type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} />
                </div>
              </div>

              {/* Severity Filter */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Severity</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['all', 'critical', 'high', 'medium', 'low', 'info'].map(s => (
                    <button key={s} type="button" className={`btn ${exportSeverity === s ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                      onClick={() => setExportSeverity(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>
                  Exporting <strong style={{ color: 'var(--tb-text-primary)' }}>
                    {filtered.filter(e => {
                      if (exportSeverity !== 'all' && e.severity !== exportSeverity) return false;
                      if (exportFrom && e.createdAt && new Date(e.createdAt) < new Date(exportFrom)) return false;
                      if (exportTo && e.createdAt && new Date(e.createdAt) > new Date(exportTo + 'T23:59:59')) return false;
                      return true;
                    }).length}
                  </strong> events as <strong style={{ color: 'var(--tb-text-primary)' }}>{exportFormat.toUpperCase()}</strong>
                  {exportFrom && ` from ${exportFrom}`}
                  {exportTo && ` to ${exportTo}`}
                  {exportSeverity !== 'all' && ` (${exportSeverity} severity)`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={exportEntries} disabled={exporting}>
                  <Download size={13} /> {exporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowExport(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Audit Log</h1>
            <p className="page-header-description">Security and administrative audit trail · {filtered.length} events</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={fetchData}><RefreshCw size={13} /> Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowExport(true)}><Download size={13} /> Export</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Events', value: stats.total, color: 'var(--tb-brand)' },
          { label: 'Critical', value: stats.critical, color: 'var(--tb-red)' },
          { label: 'High', value: stats.high, color: 'var(--tb-orange)' },
          { label: 'Medium', value: stats.medium, color: 'var(--tb-yellow)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><div style={{ width: 7, height: 7, borderRadius: '50%', background: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tb-text-muted)' }} />
          <input className="input" placeholder="Search by user, action, IP..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 38 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button key={s} className={`btn ${severityFilter === s ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => { setSeverityFilter(s); setPage(1); }}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Action Filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button className={`btn ${actionFilter === '' ? 'btn-primary' : 'btn-ghost'} btn-xs`} onClick={() => { setActionFilter(''); setPage(1); }}>All Actions</button>
        {uniqueActions.slice(0, 10).map(a => (
          <button key={a} className={`btn ${actionFilter === a ? 'btn-primary' : 'btn-ghost'} btn-xs`} onClick={() => { setActionFilter(a); setPage(1); }}>
            {formatAction(a)}
          </button>
        ))}
      </div>

      {/* Audit Entries */}
      {loading && entries.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <FileWarning size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No audit events found</div>
          <div className="empty-state-desc">{search ? 'Try a different search' : 'Audit events will appear here as they occur'}</div>
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: '1px solid var(--tb-border)', overflow: 'hidden' }}>
          {paginated.map((entry, i) => {
            const sev = SEVERITY_MAP[entry.severity || 'info'] || SEVERITY_MAP.info;
            const SevIcon = sev.icon;
            const actorDisplay = getActorDisplay(entry.actor);
            const actorInitial = actorDisplay.charAt(0).toUpperCase();
            return (
              <div key={entry.id || i} onClick={() => setDetail(detail?.id === entry.id ? null : entry)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px',
                  borderBottom: i < paginated.length - 1 ? '1px solid var(--tb-border)' : 'none',
                  cursor: 'pointer', background: detail?.id === entry.id ? 'var(--tb-surface-1)' : 'var(--tb-bg)', transition: 'background 100ms' }}>
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--tb-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--tb-text-secondary)', flexShrink: 0, border: '1px solid var(--tb-border)' }}>
                  {entry.actor?.photoUrl ? (
                    <img src={entry.actor.photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : actorInitial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Main: Actor + Action + Severity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{actorDisplay}</span>
                    <span style={{ fontSize: 13, color: 'var(--tb-text-secondary)' }}>{formatAction(entry.action || 'unknown')}</span>
                    <span className={`badge badge-sm ${entry.severity === 'critical' ? 'badge-red' : entry.severity === 'high' ? 'badge-orange' : entry.severity === 'medium' ? 'badge-yellow' : 'badge-gray'}`}>
                      {entry.severity || 'info'}
                    </span>
                    {entry.targetType && (
                      <>
                        <ArrowRight size={11} style={{ color: 'var(--tb-text-muted)' }} />
                        <span className="badge badge-sm badge-gray">{entry.targetType}</span>
                      </>
                    )}
                  </div>
                  {/* Metadata summary */}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {Object.entries(entry.metadata).filter(([k]) => k !== 'actorId').slice(0, 3).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 40) : v}`).join(' · ')}
                    </div>
                  )}
                  {/* Timestamp + Email + IP */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: 'var(--tb-text-muted)', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {timeAgo(entry.createdAt)}</span>
                    {entry.actor?.email && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} /> {entry.actor.email}</span>}
                    {entry.ipAddress && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={10} /> {entry.ipAddress}</span>}
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
                { label: 'Actor ID', value: detail.actorId || '—' },
                { label: 'Action', value: detail.action || '—' },
                { label: 'Target Type', value: detail.targetType || '—' },
                { label: 'Target ID', value: detail.targetId || '—' },
                { label: 'Severity', value: detail.severity || 'info' },
                { label: 'IP Address', value: detail.ipAddress || '—' },
                { label: 'User Agent', value: detail.userAgent || '—' },
                { label: 'Timestamp', value: detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '—' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ color: 'var(--tb-text-primary)', fontFamily: ['Actor ID', 'Target ID', 'IP Address'].includes(f.label) ? 'monospace' : undefined, fontSize: f.label === 'User Agent' ? 11 : 13, wordBreak: 'break-all' }}>{f.value}</div>
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
            <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--tb-border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const csv = `Timestamp,Actor,Action,Target,Severity,IP\n"${detail.createdAt}","${getActorDisplay(detail.actor)}","${detail.action}","${detail.targetType || ''}","${detail.severity}","${detail.ipAddress || ''}"`;
                const blob = new Blob([csv], { type: 'text/csv' });
                downloadBlob(blob, `audit-event-${detail.id?.slice(0, 8) || 'unknown'}.csv`);
              }}><Download size={12} /> Export Single</button>
            </div>
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
