'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiFetch } from '../../lib';
import {
  BarChart3, Users, Globe, TrendingUp, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight, Download, Calendar, Eye, ShieldAlert,
} from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(ts: string | number | Date) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, analytics] = await Promise.all([
        apiFetch('/api/admin/analytics/overview').then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/analytics').then(r => r.ok ? r.json() : null),
      ]);
      setData({ overview, analytics });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ov = data?.overview;
  const an = data?.analytics;

  const chartData = useMemo(() => {
    const counts = new Map<number, number>();
    for (const row of an?.usersByDay ?? []) {
      const key = dayKey(row.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + (row._count?.createdAt ?? 1));
    }
    const days: { day: string; users: number }[] = [];
    const today = dayKey(new Date());
    for (let i = 29; i >= 0; i--) {
      const key = today - i * DAY_MS;
      const d = new Date(key);
      days.push({
        day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        users: counts.get(key) ?? 0,
      });
    }
    return days;
  }, [an]);

  const maxUsers = Math.max(1, ...chartData.map(d => d.users));

  const topActions = useMemo(() => (an?.topActions ?? []).slice(0, 5), [an]);
  const maxAction = Math.max(1, ...topActions.map((a: any) => a.count));

  const kpis = [
    { label: 'Total Users', value: ov?.users?.total ?? 0, icon: Users, color: 'var(--tb-brand)' },
    { label: 'Active Sessions', value: ov?.sessions?.active ?? 0, icon: Globe, color: 'var(--tb-green)' },
    { label: 'New This Week', value: ov?.users?.newThisWeek ?? 0, icon: TrendingUp, color: 'var(--tb-blue)' },
    { label: 'Audit Events (30d)', value: ov?.auditEvents?.last30Days ?? 0, icon: ShieldAlert, color: 'var(--tb-yellow)' },
  ];

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Analytics</h1>
            <p className="page-header-description">Platform usage and performance metrics</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={fetchData} disabled={loading}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
            <a className="btn btn-secondary btn-sm" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer"><BarChart3 size={13} /> Vercel Web Analytics</a>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            <div className="kpi-value">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</div>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">New Users</span>
          <span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>Last 30 days</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160, padding: '0 4px' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div title={`${d.users} new users on ${d.day}`}
                  style={{ width: '100%', maxWidth: 20, height: `${Math.max(2, (d.users / maxUsers) * 140)}px`, borderRadius: 3, background: `var(--tb-brand)`, opacity: 0.8, transition: 'opacity 150ms, transform 150ms', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scaleY(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scaleY(1)'; }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--tb-text-muted)' }}>
            <span>30 days ago</span><span>Today</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Top Admin Actions */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top Admin Actions</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topActions.length === 0 && <div style={{ fontSize: 13, color: 'var(--tb-text-muted)' }}>No actions recorded in the last 30 days.</div>}
            {topActions.map((a: any) => (
              <div key={a.action}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--tb-text-primary)' }}>{a.action}</span>
                  <span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>{a.count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--tb-surface-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${(a.count / maxAction) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--tb-brand)', transition: 'width 500ms cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users & Sessions Summary */}
        <div className="card">
          <div className="card-header"><span className="card-title">Users & Sessions</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Total Sessions', value: ov?.sessions?.total ?? 0, icon: Globe },
              { label: 'Active Sessions', value: ov?.sessions?.active ?? 0, icon: Globe },
              { label: 'Open Tickets', value: ov?.tickets?.open ?? 0, icon: TrendingUp },
              { label: 'Total Tickets', value: ov?.tickets?.total ?? 0, icon: TrendingUp },
              { label: 'Active Users', value: ov?.users?.active ?? 0, icon: Users },
              { label: 'New Today', value: ov?.users?.newToday ?? 0, icon: Users },
              { label: 'Unread Notifications', value: ov?.notifications?.unread ?? 0, icon: Clock },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <item.icon size={15} style={{ color: 'var(--tb-text-icon-muted)' }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--tb-text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
