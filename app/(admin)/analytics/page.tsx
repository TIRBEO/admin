'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib';
import { KpiCard, LineChart, BarChart, DonutChart, type ChartStatesProps } from '@tirbeo/charts';
import { Users, Shield, BarChart3, AlertCircle, CheckCircle, XCircle, PauseCircle } from 'lucide-react';

type Analytics = {
  users: { total: number; admins: number; newToday: number; onlineNow: number; growth: Array<{ date: string; count: number }> };
  activity: { dailyActive: number; weeklyActive: number; monthlyActive: number; byDay: Array<{ date: string; count: number }> };
  content: { media: number; reports: number; notifications: number; reportsByStatus: { pending: number; reviewed: number; dismissed: number; actioned: number } };
  audit: { bySeverity: { info: number; warning: number; error: number; critical: number }; topActions: Array<{ action: string; count: number }> };
  recentActivity: Array<{ id: string; action: string; actor: string; severity: string; createdAt: string }>;
};

const SEV_COLORS: Record<string, string> = { info: 'var(--color-info)', warning: 'var(--color-warning)', error: 'var(--color-error)', critical: 'var(--color-error)' };
const STATUS_COLORS: Record<string, string> = { pending: 'var(--color-warning)', reviewed: 'var(--color-info)', dismissed: 'var(--color-text-muted)', actioned: 'var(--color-success)' };

function SeverityDot({ sev }: { sev: string }) {
  const color = SEV_COLORS[sev] || 'var(--color-text-muted)';
  return (
    <>
      <span className="inline-block w-2 h-2 mr-1.5" style={{ background: color }} />
      <span className="capitalize text-xs text-[var(--color-text-secondary)]">{sev}</span>
    </>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/admin/analytics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const userGrowthData = data?.users.growth.map(d => ({ name: d.date.slice(5), count: d.count })) || [];
  const auditSeverityData = data ? [
    { name: 'Info', value: data.audit.bySeverity.info, color: SEV_COLORS.info },
    { name: 'Warning', value: data.audit.bySeverity.warning, color: SEV_COLORS.warning },
    { name: 'Error', value: data.audit.bySeverity.error, color: SEV_COLORS.error },
    { name: 'Critical', value: data.audit.bySeverity.critical, color: SEV_COLORS.critical },
  ].filter(d => d.value > 0) : [];
  const reportsStatusData = data ? [
    { name: 'Pending', value: data.content.reportsByStatus.pending, color: STATUS_COLORS.pending },
    { name: 'Reviewed', value: data.content.reportsByStatus.reviewed, color: STATUS_COLORS.reviewed },
    { name: 'Dismissed', value: data.content.reportsByStatus.dismissed, color: STATUS_COLORS.dismissed },
    { name: 'Actioned', value: data.content.reportsByStatus.actioned, color: STATUS_COLORS.actioned },
  ].filter(d => d.value > 0) : [];
  const totalReports = data ? data.content.reportsByStatus.pending + data.content.reportsByStatus.reviewed + data.content.reportsByStatus.dismissed + data.content.reportsByStatus.actioned : 0;
  const activityByDay = data?.activity.byDay.map(d => ({ name: d.date.slice(5), count: d.count })) || [];
  const topActions = data?.audit.topActions.map(a => ({ name: a.action, value: a.count })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Analytics</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Platform metrics and insights</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Users" value={data?.users.total ?? '-'} icon={<Users className="w-4 h-4" />} subtitle={data ? `+${data.users.newToday} today` : undefined} />
        <KpiCard label="Admins" value={data?.users.admins ?? '-'} icon={<Shield className="w-4 h-4" />} />
        <KpiCard label="Online Now" value={data?.users.onlineNow ?? '-'} icon={<Users className="w-4 h-4" />} />
        <KpiCard label="DAU" value={data?.activity.dailyActive ?? '-'} icon={<BarChart3 className="w-4 h-4" />} subtitle={data ? `W: ${data.activity.weeklyActive} · M: ${data.activity.monthlyActive}` : undefined} />
        <KpiCard label="Media Files" value={data?.content.media ?? '-'} icon={<AlertCircle className="w-4 h-4" />} />
        <KpiCard label="Reports" value={data?.content.reports ?? '-'} icon={<CheckCircle className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">User Growth (30 days)</h3>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center text-[var(--color-text-secondary)]">Loading…</div>
          ) : (
            <LineChart data={userGrowthData} lines={[{ key: 'count', color: 'var(--color-accent)', name: 'Users' }]} xKey="name" height={180} />
          )}
        </div>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Activity (30 days)</h3>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center text-[var(--color-text-secondary)]">Loading…</div>
          ) : (
            <LineChart data={activityByDay} lines={[{ key: 'count', color: 'var(--color-success)', name: 'Active' }]} xKey="name" height={180} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Audit Events by Severity</h3>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-[var(--color-text-secondary)]">Loading…</div>
          ) : auditSeverityData.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] text-center py-8">No audit events</p>
          ) : (
            <DonutChart
              data={auditSeverityData}
              height={200}
              centerValue={auditSeverityData.reduce((s, d) => s + (d.value as number), 0).toLocaleString()}
              centerLabel="events"
            />
          )}
        </div>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Top Actions (30 days)</h3>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-[var(--color-text-secondary)]">Loading…</div>
          ) : topActions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] text-center py-8">No actions recorded</p>
          ) : (
            <BarChart data={topActions} bars={[{ key: 'value', name: 'Count' }]} height={200} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Reports by Status</h3>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-[var(--color-text-secondary)]">Loading…</div>
          ) : reportsStatusData.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] text-center py-8">No reports</p>
          ) : (
            <DonutChart
              data={reportsStatusData}
              height={200}
              centerValue={totalReports.toLocaleString()}
              centerLabel="reports"
            />
          )}
        </div>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Recent Activity</h3>
          {loading ? (
            <div className="h-[256px] flex items-center justify-center text-[var(--color-text-secondary)]">Loading…</div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {data?.recentActivity.map(a => (
                <div key={a.id} className="flex items-center gap-2 py-1.5 text-xs border-b border-[var(--color-border-subtle)] last:border-0">
                  <SeverityDot sev={a.severity} />
                  <code className="text-[var(--color-accent)] flex-shrink-0">{a.action}</code>
                  <span className="text-[var(--color-text-secondary)] ml-auto">{a.actor}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
