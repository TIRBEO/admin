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
  info: 'bg-[#E8F0FE] text-[#1A73E8]',
  warning: 'bg-[#FEF7E0] text-[#B06000]',
  error: 'bg-[#FDECEA] text-[#D93025]',
  critical: 'bg-[#D93025] text-white',
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
          <h1 className="text-xl font-semibold text-[#202124]">Security events</h1>
          <p className="text-sm text-[#5F6368] mt-0.5">XSS blocks, suspicious activity, and security signals with ray IDs</p>
        </div>
        <button onClick={clearOld} disabled={clearing}
          className="px-3 py-2 rounded-lg text-sm font-medium text-[#D93025] border border-[#D93025]/30 hover:bg-[#FDECEA] disabled:opacity-50 transition-colors">
          {clearing ? 'Clearing...' : 'Clear events older than 30d'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Today', value: stats.today.total, sub: `${stats.today.critical} critical`, icon: Clock, tone: '#1A73E8' },
            { label: 'This week', value: stats.week.total, sub: `${stats.week.critical} critical`, icon: Shield, tone: '#B06000' },
            { label: 'All time', value: stats.total, sub: 'events recorded', icon: ShieldCheck, tone: '#188038' },
            { label: 'Active blocks', value: stats.activeBlocks, sub: 'IP / user / email', icon: Ban, tone: '#D93025' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border border-[#DADCE0] p-4">
              <div className="flex items-center gap-2">
                <kpi.icon className="w-4 h-4" style={{ color: kpi.tone }} />
                <span className="text-xs font-medium text-[#5F6368]">{kpi.label}</span>
              </div>
              <p className="text-2xl font-semibold text-[#202124] mt-1.5">{kpi.value}</p>
              <p className="text-xs text-[#80868B] mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#DADCE0] p-3 flex flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#F1F3F4] rounded-lg px-3">
          <Search className="w-4 h-4 text-[#5F6368]" />
          <input value={ip} onChange={e => { setIp(e.target.value); setPage(1); }} placeholder="Filter by IP address..."
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[#80868B]" />
        </div>
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[#DADCE0] text-sm text-[#202124] bg-white outline-none">
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select value={eventType} onChange={e => { setEventType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[#DADCE0] text-sm text-[#202124] bg-white outline-none">
          <option value="">All event types</option>
          <option value="payload.blocked_xss">XSS blocked</option>
          <option value="request.blocked_ip">Blocked IP</option>
          <option value="auth">Auth events</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#DADCE0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DADCE0] text-left text-xs text-[#5F6368]">
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">IP address</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Ray ID</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#80868B]">Loading events...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#80868B]">No security events found</td></tr>
              ) : events.map(ev => (
                <tr key={ev.id} className="border-b border-[#DADCE0]/60 hover:bg-[#F8F9FA]">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[ev.severity] || SEVERITY_STYLES.info}`}>
                      {ev.severity === 'critical' && <AlertTriangle className="w-3 h-3" />}
                      {ev.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#202124]">{ev.eventType}</span>
                    {ev.metadata?.reason && (
                      <span className="block text-xs text-[#80868B] mt-0.5">{String(ev.metadata.reason)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#5F6368]">{ev.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-[#5F6368]">{ev.user?.email || ev.metadata?.userId || 'Anonymous'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#80868B]">{ev.metadata?.rayId || '—'}</td>
                  <td className="px-4 py-3 text-[#5F6368] whitespace-nowrap">{formatTime(ev.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#DADCE0]">
            <span className="text-xs text-[#80868B]">{total} events</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-[#DADCE0] text-[#5F6368] hover:bg-[#F1F3F4] disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#5F6368]">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-[#DADCE0] text-[#5F6368] hover:bg-[#F1F3F4] disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
