'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib';

type Analytics = {
  users: { total: number; admins: number; newToday: number; onlineNow: number; growth: Array<{ date: string; count: number }> };
  activity: { dailyActive: number; weeklyActive: number; monthlyActive: number; byDay: Array<{ date: string; count: number }> };
  content: { media: number; reports: number; notifications: number; reportsByStatus: { pending: number; reviewed: number; dismissed: number; actioned: number } };
  audit: { bySeverity: { info: number; warning: number; error: number; critical: number }; topActions: Array<{ action: string; count: number }> };
  recentActivity: Array<{ id: string; action: string; actor: string; severity: string; createdAt: string }>;
};

function LineChart({ data, color = '#1A73E8', height = 180 }: { data: Array<{ date: string; count: number }>; color?: string; height?: number }) {
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
  const bottomLabels = data.filter((_, i) => i === 0 || i === data.length - 1 || i % 5 === 0);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1].map(r => {
        const y = pad.top + ch - r * ch;
        return <g key={r}>
          <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="var(--color-border,#DADCE0)" strokeWidth={1} />
          <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="var(--color-text-secondary,#5F6368)" fontSize={10}>{Math.round(max * r)}</text>
        </g>;
      })}
      <path d={`M${pts.join(' L')} L${pad.left + cw},${pad.top + ch} L${pad.left},${pad.top + ch} Z`} fill={color} fillOpacity={0.08} />
      <path d={`M${pts.join(' L')}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        if (d.count === 0) return null;
        const x = pad.left + (i / Math.max(data.length - 1, 1)) * cw;
        const y = pad.top + ch - (d.count / max) * ch;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
      {bottomLabels.map((d, i) => {
        const idx = data.indexOf(d);
        const x = pad.left + (idx / Math.max(data.length - 1, 1)) * cw;
        return <text key={i} x={x} y={height - 6} textAnchor="middle" fill="var(--color-text-secondary,#5F6368)" fontSize={9}>{d.date.slice(5)}</text>;
      })}
    </svg>
  );
}

function PieChart({ data, height = 200 }: { data: Array<{ label: string; value: number; color: string }>; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 100; const cy = 100; const r = 80;
  let offset = 0;
  const slices = data.map(d => {
    const angle = (d.value / total) * 360;
    const start = offset; const end = offset + angle;
    offset = end;
    const sAngle = (start - 90) * Math.PI / 180;
    const eAngle = (end - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(sAngle); const y1 = cy + r * Math.sin(sAngle);
    const x2 = cx + r * Math.cos(eAngle); const y2 = cy + r * Math.sin(eAngle);
    if (d.value === 0) return null;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`, ...d };
  }).filter(Boolean);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 200 200" style={{ width: height, height }}>
        {slices.map((s: any, i) => <path key={i} d={s.path} fill={s.color} />)}
        <circle cx={cx} cy={cy} r={40} fill="var(--color-surface,#FFFFFF)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--color-text,#202124)" fontSize={18} fontWeight={700}>{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--color-text-secondary,#5F6368)" fontSize={10}>total</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span className="text-[var(--color-text-secondary,#5F6368)]">{d.label}</span>
            <span className="text-[var(--color-text,#202124)] font-semibold ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color = '#1A73E8', height = 200 }: { data: Array<{ label: string; value: number }>; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 500; const pad = { left: 120, right: 20, top: 10, bottom: 10 };
  const cw = w - pad.left - pad.right;
  const barH = Math.min(24, (height - pad.top - pad.bottom) / data.length - 4);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto">
      {data.map((d, i) => {
        const bw = (d.value / max) * cw;
        const y = pad.top + i * (barH + 4);
        return <g key={i}>
          <text x={pad.left - 8} y={y + barH / 2 + 4} textAnchor="end" fill="var(--color-text-secondary,#5F6368)" fontSize={11}>{d.label.slice(0, 20)}</text>
          <rect x={pad.left} y={y} width={Math.max(bw, 1)} height={barH} rx={4} fill={color} fillOpacity={0.85} />
          <text x={pad.left + bw + 6} y={y + barH / 2 + 4} fill="var(--color-text,#202124)" fontSize={11} fontWeight={600}>{d.value}</text>
        </g>;
      })}
    </svg>
  );
}

const SEV_COLORS: Record<string, string> = { info: '#1A73E8', warning: '#F9AB00', error: '#D93025', critical: '#8B5CF6' };

function SeverityDot({ sev }: { sev: string }) {
  return <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: SEV_COLORS[sev] || 'var(--color-text-secondary,#5F6368)' }} />;
}

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border,#DADCE0)] bg-[var(--color-surface,#FFFFFF)] p-5">
      <p className="text-[28px] font-semibold text-[var(--color-text,#202124)]">{value}</p>
      <p className="text-sm text-[var(--color-text-secondary,#5F6368)] mt-1">{label}</p>
      {sub && <p className="text-xs text-[var(--color-text-secondary,#5F6368)] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/admin/analytics');
        if (res.ok) setData(await res.json());
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-[var(--color-text-secondary,#5F6368)]">Loading analytics...</div>;
  if (!data) return <div className="flex items-center justify-center py-20 text-sm text-[var(--color-text-secondary,#5F6368)]">Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text,#202124)]">Analytics</h1>
        <p className="text-sm text-[var(--color-text-secondary,#5F6368)] mt-1">Platform metrics and insights</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard value={data.users.total} label="Total Users" sub={`+${data.users.newToday} today`} />
        <StatCard value={data.users.admins} label="Admins" />
        <StatCard value={data.users.onlineNow} label="Online Now" />
        <StatCard value={data.activity.dailyActive} label="DAU" sub={`W: ${data.activity.weeklyActive} · M: ${data.activity.monthlyActive}`} />
        <StatCard value={data.content.media} label="Media Files" />
        <StatCard value={data.content.reports} label="Reports" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border,#DADCE0)] bg-[var(--color-surface,#FFFFFF)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text,#202124)] mb-4">User Growth (30 days)</h3>
          <LineChart data={data.users.growth} color="#1A73E8" />
        </div>
        <div className="rounded-xl border border-[var(--color-border,#DADCE0)] bg-[var(--color-surface,#FFFFFF)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text,#202124)] mb-4">Activity (30 days)</h3>
          <LineChart data={data.activity.byDay} color="#188038" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border,#DADCE0)] bg-[var(--color-surface,#FFFFFF)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text,#202124)] mb-4">Audit Events by Severity</h3>
          <PieChart data={[
            { label: 'Info', value: data.audit.bySeverity.info, color: SEV_COLORS.info },
            { label: 'Warning', value: data.audit.bySeverity.warning, color: SEV_COLORS.warning },
            { label: 'Error', value: data.audit.bySeverity.error, color: SEV_COLORS.error },
            { label: 'Critical', value: data.audit.bySeverity.critical, color: SEV_COLORS.critical },
          ]} />
        </div>
        <div className="rounded-xl border border-[var(--color-border,#DADCE0)] bg-[var(--color-surface,#FFFFFF)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text,#202124)] mb-4">Top Actions (30 days)</h3>
          <BarChart data={data.audit.topActions.map(a => ({ label: a.action, value: a.count }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border,#DADCE0)] bg-[var(--color-surface,#FFFFFF)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text,#202124)] mb-4">Reports by Status</h3>
          <PieChart data={[
            { label: 'Pending', value: data.content.reportsByStatus.pending, color: '#F9AB00' },
            { label: 'Reviewed', value: data.content.reportsByStatus.reviewed, color: '#1A73E8' },
            { label: 'Dismissed', value: data.content.reportsByStatus.dismissed, color: '#80868B' },
            { label: 'Actioned', value: data.content.reportsByStatus.actioned, color: '#188038' },
          ]} />
        </div>
        <div className="rounded-xl border border-[var(--color-border,#DADCE0)] bg-[var(--color-surface,#FFFFFF)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text,#202124)] mb-4">Recent Activity</h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {data.recentActivity.map(a => (
              <div key={a.id} className="flex items-center gap-2 py-1.5 text-xs border-b border-[var(--color-border,#DADCE0)] last:border-0">
                <SeverityDot sev={a.severity} />
                <code className="text-[var(--color-primary,#1A73E8)] flex-shrink-0">{a.action}</code>
                <span className="text-[var(--color-text-secondary,#5F6368)] ml-auto">{a.actor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
