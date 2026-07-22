'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib';

type Analytics = {
  users: { total: number; admins: number; newToday: number; onlineNow: number; growth: Array<{ date: string; count: number }> };
  activity: { dailyActive: number; weeklyActive: number; monthlyActive: number; byDay: Array<{ date: string; count: number }> };
  content: { media: number; reports: number; notifications: number; reportsByStatus: { pending: number; reviewed: number; dismissed: number; actioned: number } };
  audit: { bySeverity: { info: number; warning: number; error: number; critical: number }; topActions: Array<{ action: string; count: number }> };
  recentActivity: Array<{ id: string; action: string; actor: string; severity: string; createdAt: string }>;
};

/* ─── Chart Components ─── */

function LineChart({ data, color = '#2f81f7', height = 180 }: {
  data: Array<{ date: string; count: number }>;
  color?: string; height?: number;
}) {
  const w = 600;
  const max = Math.max(...data.map(d => d.count), 1);
  const pad = { top: 20, right: 10, bottom: 30, left: 40 };
  const cw = w - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const pts = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * cw;
    const y = pad.top + ch - (d.count / max) * ch;
    return `${x},${y}`;
  });

  const bottomLabels = data.filter((_, i) =>
    i === 0 || i === data.length - 1 || i % 5 === 0
  );

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(r => {
        const y = pad.top + ch - r * ch;
        return <g key={r}>
          <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="var(--border-muted)" strokeWidth={1} />
          <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={10}>{Math.round(max * r)}</text>
        </g>;
      })}

      {/* Area fill */}
      <path d={`M${pts.join(' L')} L${pad.left + cw},${pad.top + ch} L${pad.left},${pad.top + ch} Z`}
        fill={color} fillOpacity={0.08} />

      {/* Line */}
      <path d={`M${pts.join(' L')}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {data.map((d, i) => {
        if (d.count === 0) return null;
        const x = pad.left + (i / Math.max(data.length - 1, 1)) * cw;
        const y = pad.top + ch - (d.count / max) * ch;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}

      {/* X labels */}
      {bottomLabels.map((d, i) => {
        const idx = data.indexOf(d);
        const x = pad.left + (idx / Math.max(data.length - 1, 1)) * cw;
        const label = d.date.slice(5);
        return <text key={i} x={x} y={height - 6} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>{label}</text>;
      })}
    </svg>
  );
}

function PieChart({ data, height = 200 }: {
  data: Array<{ label: string; value: number; color: string }>;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 100; const cy = 100; const r = 80;
  let offset = 0;

  const slices = data.map(d => {
    const angle = (d.value / total) * 360;
    const start = offset;
    const end = offset + angle;
    offset = end;

    const sAngle = (start - 90) * Math.PI / 180;
    const eAngle = (end - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(sAngle);
    const y1 = cy + r * Math.sin(sAngle);
    const x2 = cx + r * Math.cos(eAngle);
    const y2 = cy + r * Math.sin(eAngle);
    const large = angle > 180 ? 1 : 0;

    if (d.value === 0) return null;

    return {
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      ...d,
    };
  }).filter(Boolean);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 200 200" style={{ width: height, height }}>
        {slices.map((s: any, i) => <path key={i} d={s.path} fill={s.color} />)}
        <circle cx={cx} cy={cy} r={40} fill="var(--bg-surface)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize={18} fontWeight={700}>{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 'auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color = '#2f81f7', height = 200 }: {
  data: Array<{ label: string; value: number }>;
  color?: string; height?: number;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 500;
  const pad = { left: 120, right: 20, top: 10, bottom: 10 };
  const cw = w - pad.left - pad.right;
  const barH = Math.min(24, (height - pad.top - pad.bottom) / data.length - 4);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {data.map((d, i) => {
        const bw = (d.value / max) * cw;
        const y = pad.top + i * (barH + 4);
        return <g key={i}>
          <text x={pad.left - 8} y={y + barH / 2 + 4} textAnchor="end" fill="var(--text-secondary)" fontSize={11}>{d.label.slice(0, 20)}</text>
          <rect x={pad.left} y={y} width={Math.max(bw, 1)} height={barH} rx={4} fill={color} fillOpacity={0.85} />
          <text x={pad.left + bw + 6} y={y + barH / 2 + 4} fill="var(--text-primary)" fontSize={11} fontWeight={600}>{d.value}</text>
        </g>;
      })}
    </svg>
  );
}

/* ─── Severity helpers ─── */
const SEV_COLORS: Record<string, string> = {
  info: '#2f81f7', warning: '#d29922', error: '#da3633', critical: '#8b5cf6',
};

function SeverityDot({ sev }: { sev: string }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: SEV_COLORS[sev] || 'var(--text-muted)', marginRight: 6 }} />;
}

/* ─── Page ─── */

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/admin/analytics');
        if (res.ok) setData(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics…</div>;
  if (!data) return <div className="empty-state">Failed to load analytics</div>;

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <h2>Analytics</h2>
          <p className="desc">Platform metrics and insights</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-value">{data.users.total}</div><div className="stat-label">Total Users</div><div className="stat-change">+{data.users.newToday} today</div></div>
        <div className="stat-card"><div className="stat-value">{data.users.admins}</div><div className="stat-label">Admins</div></div>
        <div className="stat-card"><div className="stat-value">{data.users.onlineNow}</div><div className="stat-label">Online Now</div></div>
        <div className="stat-card"><div className="stat-value">{data.activity.dailyActive}</div><div className="stat-label">DAU</div><div className="stat-change" style={{ color: 'var(--text-muted)' }}>W: {data.activity.weeklyActive} · M: {data.activity.monthlyActive}</div></div>
        <div className="stat-card"><div className="stat-value">{data.content.media}</div><div className="stat-label">Media Files</div></div>
        <div className="stat-card"><div className="stat-value">{data.content.reports}</div><div className="stat-label">Reports</div></div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>User Growth (30 days)</h3></div>
          <div className="card-content">
            <LineChart data={data.users.growth} color="#2f81f7" />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Activity (30 days)</h3></div>
          <div className="card-content">
            <LineChart data={data.activity.byDay} color="#238636" />
          </div>
        </div>
      </div>

      {/* More Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Audit Events by Severity</h3></div>
          <div className="card-content">
            <PieChart data={[
              { label: 'Info', value: data.audit.bySeverity.info, color: SEV_COLORS.info },
              { label: 'Warning', value: data.audit.bySeverity.warning, color: SEV_COLORS.warning },
              { label: 'Error', value: data.audit.bySeverity.error, color: SEV_COLORS.error },
              { label: 'Critical', value: data.audit.bySeverity.critical, color: SEV_COLORS.critical },
            ]} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Top Actions (30 days)</h3></div>
          <div className="card-content">
            <BarChart data={data.audit.topActions.map(a => ({ label: a.action, value: a.count }))} />
          </div>
        </div>
      </div>

      {/* Content Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Reports by Status</h3></div>
          <div className="card-content">
            <PieChart data={[
              { label: 'Pending', value: data.content.reportsByStatus.pending, color: '#d29922' },
              { label: 'Reviewed', value: data.content.reportsByStatus.reviewed, color: '#2f81f7' },
              { label: 'Dismissed', value: data.content.reportsByStatus.dismissed, color: '#6e7681' },
              { label: 'Actioned', value: data.content.reportsByStatus.actioned, color: '#238636' },
            ]} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Recent Activity</h3></div>
          <div className="card-content" style={{ maxHeight: 260, overflowY: 'auto' }}>
            {data.recentActivity.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-muted)', fontSize: 12 }}>
                <SeverityDot sev={a.severity} />
                <code style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>{a.action}</code>
                <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{a.actor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
