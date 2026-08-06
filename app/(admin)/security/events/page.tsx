'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../../app/lib';
import { Shield, Search, AlertTriangle, ShieldCheck, Ban, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
  user?: { email: string; name: string } | null;
}

interface Stats {
  today: { total: number; critical: number };
  week: { total: number; critical: number };
  month: { total: number; critical: number };
  total: number;
  activeBlocks: number;
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-[var(--color-info-surface)] text-[var(--color-info)]',
  warning: 'bg-[var(--color-warning-surface)] text-[var(--color-warning)]',
  error: 'bg-[var(--color-error-surface)] text-[var(--color-error)]',
  critical: 'bg-[var(--color-error)] text-[var(--color-on-accent)]',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [severity, setSeverity] = useState('');
  const [eventType, setEventType] = useState('');
  const [ip, setIp] = useState('');
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (severity) params.set('severity', severity);
      if (eventType) params.set('eventType', eventType);
      if (ip) params.set('ip', ip);
      const res = await apiFetch(`/api/admin/security/events?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch {}
    setLoading(false);
  }, [page, severity, eventType, ip]);

  useEffect(() => { load(); }, [load]);

  const clearOld = async () => {
    if (!confirm('Delete security events older than 30 days?')) return;
    setClearing(true);
    try {
      await apiFetch('/api/admin/security/events?olderThanDays=30', { method: 'DELETE' });
      load();
    } catch {}
    setClearing(false);
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Security events</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">XSS blocks, suspicious activity, and security signals with ray IDs</p>
        </div>
        <button onClick={clearOld} disabled={clearing}
          className="px-3 py-2 text-sm font-medium text-[var(--color-error)] border-2 border-[var(--color-error)] hover:bg-[var(--color-error-surface)] disabled:opacity-50 transition-colors">
          {clearing ? 'Clearing...' : 'Clear events older than 30d'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Today', value: stats.today.total, sub: `${stats.today.critical} critical`, icon: Clock, tone: 'var(--color-info)' },
            { label: 'This week', value: stats.week.total, sub: `${stats.week.critical} critical`, icon: Shield, tone: 'var(--color-warning)' },
            { label: 'All time', value: stats.total, sub: 'events recorded', icon: ShieldCheck, tone: 'var(--color-success)' },
            { label: 'Active blocks', value: stats.activeBlocks, sub: 'IP / user / email', icon: Ban, tone: 'var(--color-error)' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <kpi.icon className="w-4 h-4" style={{ color: kpi.tone }} />
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text)] mt-1.5">{kpi.value}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] p-3 flex flex-wrap gap-2 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] px-3">
          <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={ip} onChange={e => { setIp(e.target.value); setPage(1); }} placeholder="Filter by IP address..."
            className="flex-1 bg-transparent py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-tertiary)]" />
        </div>
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
          className="px-3 py-2 border-2 border-[var(--color-border)] text-sm text-[var(--color-text)] bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]">
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select value={eventType} onChange={e => { setEventType(e.target.value); setPage(1); }}
          className="px-3 py-2 border-2 border-[var(--color-border)] text-sm text-[var(--color-text)] bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]">
          <option value="">All event types</option>
          <option value="payload.blocked_xss">XSS blocked</option>
          <option value="request.blocked_ip">Blocked IP</option>
          <option value="auth">Auth events</option>
        </select>
      </div>

      <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] text-left text-xs text-[var(--color-text-secondary)]">
                <th className="px-4 py-3 font-medium uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 font-medium uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 font-medium uppercase tracking-wider">IP address</th>
                <th className="px-4 py-3 font-medium uppercase tracking-wider">User</th>
                <th className="px-4 py-3 font-medium uppercase tracking-wider">Ray ID</th>
                <th className="px-4 py-3 font-medium uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading events...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">No security events found</td></tr>
              ) : events.map(ev => (
                <tr key={ev.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border border-[var(--color-border-subtle)] text-xs font-medium ${SEVERITY_STYLES[ev.severity] || SEVERITY_STYLES.info}`}>
                      {ev.severity === 'critical' && <AlertTriangle className="w-3 h-3" />}
                      {ev.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[var(--color-text)]">{ev.eventType}</span>
                    {ev.metadata?.reason && (
                      <span className="block text-xs text-[var(--color-text-tertiary)] mt-0.5">{String(ev.metadata.reason)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">{ev.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{ev.user?.email || ev.metadata?.userId || 'Anonymous'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">{ev.metadata?.rayId || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">{formatTime(ev.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t-2 border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-tertiary)]">{total} events</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[var(--color-text-secondary)]">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
