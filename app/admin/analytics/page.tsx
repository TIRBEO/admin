'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import {
  BarChart3, Users, Globe, TrendingUp, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight, Download, Calendar, Eye,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const ov = await apiFetch('/api/admin/analytics/overview').then(r => r.ok ? r.json() : null);
      const sec = await apiFetch('/api/admin/security/events?limit=1').then(r => r.ok ? r.json() : null);
      setData({ overview: ov, security: sec?.stats });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ov = data?.overview;

  // Generate mock chart data
  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    users: Math.floor(Math.random() * 200 + 50),
    sessions: Math.floor(Math.random() * 500 + 100),
    events: Math.floor(Math.random() * 30 + 5),
  }));

  const maxUsers = Math.max(...chartData.map(d => d.users));

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Analytics</h1>
            <p className="page-header-description">Platform usage and performance metrics</p>
          </div>
          <div className="page-header-actions">
            <div style={{ display: 'flex', gap: 4 }}>
              {['7d', '30d', '90d'].map(p => (
                <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={13} /></button>
            <button className="btn btn-secondary btn-sm"><Download size={13} /> Export</button>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Users', value: ov?.users?.total ?? 0, change: '+12%', up: true, icon: Users, color: 'var(--tb-brand)' },
          { label: 'Active Sessions', value: ov?.sessions?.active ?? 0, change: '+8%', up: true, icon: Globe, color: 'var(--tb-green)' },
          { label: 'Page Views', value: ov?.analytics?.pageViews ?? 0, change: '+23%', up: true, icon: Eye, color: 'var(--tb-blue)' },
          { label: 'Avg Session', value: '4m 32s', change: '-2%', up: false, icon: Clock, color: 'var(--tb-yellow)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            <div className="kpi-value">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: k.up ? 'var(--tb-green)' : 'var(--tb-red)' }}>
              {k.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{k.change} vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">User Growth</span>
          <span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>New users per day</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160, padding: '0 4px' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div title={`${d.users} users on day ${d.day}`}
                  style={{ width: '100%', maxWidth: 20, height: `${(d.users / maxUsers) * 140}px`, borderRadius: 3, background: `var(--tb-brand)`, opacity: 0.8, transition: 'opacity 150ms, transform 150ms', cursor: 'pointer', minHeight: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scaleY(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scaleY(1)'; }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--tb-text-muted)' }}>
            <span>Day 1</span><span>Day 15</span><span>Day 30</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Traffic by Application */}
        <div className="card">
          <div className="card-header"><span className="card-title">Traffic by Application</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'Landing', pct: 35, color: 'var(--tb-brand)' },
              { name: 'Dashboard', pct: 28, color: 'var(--tb-green)' },
              { name: 'Flows', pct: 18, color: 'var(--tb-blue)' },
              { name: 'Support', pct: 12, color: 'var(--tb-yellow)' },
              { name: 'Docs', pct: 7, color: 'var(--tb-purple)' },
            ].map(app => (
              <div key={app.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--tb-text-primary)' }}>{app.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>{app.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--tb-surface-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${app.pct}%`, height: '100%', borderRadius: 3, background: app.color, transition: 'width 500ms cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Sessions Summary */}
        <div className="card">
          <div className="card-header"><span className="card-title">Support & Sessions</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Total Sessions', value: ov?.sessions?.total ?? 0, icon: Globe },
              { label: 'Open Tickets', value: ov?.tickets?.open ?? 0, icon: TrendingUp },
              { label: 'Resolved Tickets', value: ov?.tickets?.resolved ?? 0, icon: TrendingUp },
              { label: 'Active Users', value: ov?.users?.active ?? 0, icon: Users },
              { label: 'New This Week', value: ov?.users?.newThisWeek ?? 0, icon: TrendingUp },
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
