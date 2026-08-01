'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { BarChart3, TrendingUp, TrendingDown, Users, FileText, Plus } from 'lucide-react';

export default function ReportingPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const router = useRouter();

  useEffect(() => {
    apiFetch(`/api/admin/analytics?period=${period}`).then(async r => {
      if (r.ok) { const d = await r.json(); setAnalytics(d); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--color-admin-surface-hover)] rounded-xl" />)}
        </div>
        <div className="h-64 bg-[var(--color-admin-surface-hover)] rounded-xl" />
      </div>
    );
  }

  const metrics = [
    { label: 'DAU', value: analytics?.dau ?? '—', change: '+5.2%', trend: 'up' },
    { label: 'WAU', value: analytics?.wau ?? '—', change: '+3.8%', trend: 'up' },
    { label: 'MAU', value: analytics?.mau ?? '—', change: '+12.1%', trend: 'up' },
    { label: 'New Signups', value: analytics?.newSignups ?? analytics?.signups ?? '—', change: '-2.1%', trend: 'down' },
  ];

  const tabs = [
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
  ];

  return (
    <AdminSection title="Reporting" description="Analytics, trends, and custom reports"
      tabs={tabs} activeTab={period} onTabChange={setPeriod}
      actions={
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Create Report
        </button>
      }>
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--color-admin-text-secondary)] uppercase tracking-wider">{m.label}</span>
              {m.trend === 'up' ? <TrendingUp className="w-4 h-4 text-[var(--color-success)]" /> : <TrendingDown className="w-4 h-4 text-[var(--color-error)]" />}
            </div>
            <p className="text-xl font-semibold text-[var(--color-admin-text)]">{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</p>
            <p className={`text-xs mt-1 ${m.trend === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>{m.change} vs previous period</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Signup trends */}
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">Signup Trends</h3>
          {analytics?.signupTrends && analytics.signupTrends.length > 0 ? (
            <div className="space-y-2">
              {analytics.signupTrends.slice(-14).map((day: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-admin-text-muted)] w-24 flex-shrink-0">{day.date || day.day || day.label}</span>
                  <div className="flex-1 h-6 bg-[var(--color-admin-surface-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                      style={{ width: `${Math.min((day.count || day.value || 0) / Math.max(...analytics.signupTrends.map((d: any) => d.count || d.value || 0)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-[var(--color-admin-text-muted)] w-8 text-right">{day.count || day.value || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-[var(--color-admin-text-muted)]" />
              <p className="text-sm text-[var(--color-admin-text-muted)]">No signup data available</p>
            </div>
          )}
        </div>

        {/* Top actions */}
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">Top Actions</h3>
          {analytics?.topActions && analytics.topActions.length > 0 ? (
            <div className="space-y-2">
              {analytics.topActions.slice(0, 10).map((action: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-[var(--color-admin-text)]">{action.action || action.name || action.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-[var(--color-primary-surface)] rounded" style={{ width: `${Math.min((action.count || action.value || 0) * 4, 120)}px` }} />
                    <span className="text-xs text-[var(--color-admin-text-muted)] w-8 text-right">{action.count || action.value || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--color-admin-text-muted)]" />
              <p className="text-sm text-[var(--color-admin-text-muted)]">No action data available</p>
            </div>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
