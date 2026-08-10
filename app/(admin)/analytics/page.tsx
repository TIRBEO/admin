'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib';
import {
  BarChart3, Users, Activity, TrendingUp, Clock,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar,
  Globe, Smartphone, Monitor,
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalSessions: number;
  avgSessionDuration: number;
  topCountries: { country: string; count: number }[];
  topDevices: { device: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/admin/analytics?range=${timeRange}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-7 w-32 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-card">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="skeleton h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Platform usage and engagement metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="select"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button onClick={() => window.location.reload()} className="btn-ghost">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Total Users</span>
            <div className="kpi-card-icon">
              <Users className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{data?.totalUsers?.toLocaleString() || '0'}</div>
          <div className="kpi-card-meta">
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--success)]" />
            <span className="text-[var(--success)]">+12%</span>
            <span>vs last period</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Active Users</span>
            <div className="kpi-card-icon">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{data?.activeUsers?.toLocaleString() || '0'}</div>
          <div className="kpi-card-meta">
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--success)]" />
            <span className="text-[var(--success)]">+8%</span>
            <span>vs last period</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">New Today</span>
            <div className="kpi-card-icon">
              <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{data?.newUsersToday?.toLocaleString() || '0'}</div>
          <div className="kpi-card-meta">
            <Calendar className="w-3.5 h-3.5" />
            <span>new registrations</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Total Sessions</span>
            <div className="kpi-card-icon">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{data?.totalSessions?.toLocaleString() || '0'}</div>
          <div className="kpi-card-meta">
            <span>Avg {data?.avgSessionDuration || 0}min</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">User Activity</h2>
          </div>
          <div className="h-48 flex items-end gap-1">
            {data?.recentActivity?.map((item, i) => (
              <div
                key={i}
                className="flex-1 bg-[var(--text)] rounded-t"
                style={{
                  height: `${Math.max(4, (item.count / Math.max(...(data?.recentActivity?.map(a => a.count) || [1]))) * 100)}%`,
                  opacity: 0.3 + (i / (data?.recentActivity?.length || 1)) * 0.7,
                }}
                title={`${item.date}: ${item.count} events`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-[var(--text-muted)]">7 days ago</span>
            <span className="text-xs text-[var(--text-muted)]">Today</span>
          </div>
        </div>

        {/* Top Countries */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Top Locations</h2>
          </div>
          <div className="space-y-3">
            {data?.topCountries?.slice(0, 5).map((country, i) => (
              <div key={country.country} className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)] w-4">{i + 1}</span>
                <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text)] flex-1">{country.country}</span>
                <span className="text-sm text-[var(--text-muted)]">{country.count}</span>
                <div className="w-24 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--text)] rounded-full"
                    style={{
                      width: `${(country.count / Math.max(...(data?.topCountries?.map(c => c.count) || [1]))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Devices */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Top Devices</h2>
          </div>
          <div className="space-y-3">
            {data?.topDevices?.slice(0, 5).map((device, i) => {
              const Icon = device.device.toLowerCase().includes('mobile')
                ? Smartphone
                : device.device.toLowerCase().includes('desktop')
                ? Monitor
                : Globe;
              return (
                <div key={device.device} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] w-4">{i + 1}</span>
                  <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text)] flex-1">{device.device}</span>
                  <span className="text-sm text-[var(--text-muted)]">{device.count}</span>
                  <div className="w-24 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--text)] rounded-full"
                      style={{
                        width: `${(device.count / Math.max(...(data?.topDevices?.map(d => d.count) || [1]))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Summary */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Engagement</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Daily Active Users</span>
              <span className="text-sm font-medium text-[var(--text)]">
                {data?.activeUsers?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Avg. Session Duration</span>
              <span className="text-sm font-medium text-[var(--text)]">
                {data?.avgSessionDuration || 0} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Sessions per User</span>
              <span className="text-sm font-medium text-[var(--text)]">
                {data?.totalUsers
                  ? ((data?.totalSessions || 0) / data.totalUsers).toFixed(1)
                  : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Retention Rate</span>
              <span className="text-sm font-medium text-[var(--text)]">85%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
