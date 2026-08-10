'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';

interface RateLimitMetrics {
  totalHits: number;
  totalBlocked: number;
  totalBypassed: number;
  blockRate: number;
  bypassRate: number;
  topIps: Array<{ ip: string; count: number; blocked: number; lastSeen: number }>;
  topRoutes: Array<{ route: string; count: number; blocked: number }>;
  recentBlocks: Array<{ ip: string; route: string; timestamp: number }>;
  recentBypasses: Array<{ ip: string; route: string; userId: string; timestamp: number }>;
  windowStart: number;
  windowDuration: number;
}

interface RateLimitConfig {
  routeLimits: Record<string, number>;
  rateLimitEnabled: boolean;
  rateLimitPerMinute: number;
  adminRoleMultipliers: Record<string, number>;
  blockRateAlertThreshold: number;
  blockRateAlertEnabled: boolean;
  blockRateAlertCooldown: number;
}

interface BlockRateAlert {
  timestamp: number;
  blockRate: number;
  threshold: number;
  totalHits: number;
  totalBlocked: number;
  message: string;
}

export default function RateLimitsPage() {
  const [metrics, setMetrics] = useState<RateLimitMetrics | null>(null);
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [alerts, setAlerts] = useState<BlockRateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/rate-limits');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setConfig(data.config);
        setAlerts(data.alerts?.recentAlerts || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Rate Limit Metrics</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Monitor API rate limiting activity and blocked requests
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={load}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)]"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-secondary)]">Total Requests</p>
          <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
            {metrics?.totalHits.toLocaleString() || '0'}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-secondary)]">Blocked</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {metrics?.totalBlocked.toLocaleString() || '0'}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-secondary)]">Bypassed</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            {metrics?.totalBypassed.toLocaleString() || '0'}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-secondary)]">Block Rate</p>
          <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
            {metrics?.blockRate || '0'}%
          </p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-secondary)]">Window</p>
          <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
            {metrics ? formatDuration(metrics.windowDuration) : '60 min'}
          </p>
        </div>
      </div>

      {/* Top IPs */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Top IPs by Request Count</h2>
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">IP Address</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Requests</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Blocked</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Block %</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {metrics?.topIps.map((item) => (
                <tr key={item.ip} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{item.ip}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text)]">{item.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-500">{item.blocked.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text-secondary)]">
                    {item.count > 0 ? Math.round((item.blocked / item.count) * 100) : 0}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text-secondary)]">
                    {formatTime(item.lastSeen)}
                  </td>
                </tr>
              ))}
              {(!metrics?.topIps || metrics.topIps.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Routes */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Top Routes by Request Count</h2>
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Route</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Requests</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Blocked</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Block %</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {metrics?.topRoutes.map((item) => (
                <tr key={item.route} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{item.route}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text)]">{item.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-500">{item.blocked.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text-secondary)]">
                    {item.count > 0 ? Math.round((item.blocked / item.count) * 100) : 0}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text-secondary)]">
                    {config?.routeLimits[item.route] || '30'}/min
                  </td>
                </tr>
              ))}
              {(!metrics?.topRoutes || metrics.topRoutes.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Blocks */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Recent Blocks</h2>
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">IP</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {metrics?.recentBlocks.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {formatTime(item.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{item.ip}</td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{item.route}</td>
                </tr>
              ))}
              {(!metrics?.recentBlocks || metrics.recentBlocks.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    No recent blocks
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bypasses */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Recent Rate Limit Bypasses</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Admin users bypass normal rate limits. These events show when bypasses occurred.
        </p>
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">IP</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">User ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {metrics?.recentBypasses.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {formatTime(item.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{item.ip}</td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{item.userId}</td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{item.route}</td>
                </tr>
              ))}
              {(!metrics?.recentBypasses || metrics.recentBypasses.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    No recent bypasses
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Block Rate Alerts</h2>
        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">
                Alert Status: {config?.blockRateAlertEnabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Threshold: {config?.blockRateAlertThreshold || 20}% | Cooldown: {config?.blockRateAlertCooldown || 15} min
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              (metrics?.blockRate || 0) >= (config?.blockRateAlertThreshold || 20)
                ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                : 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30'
            }`}>
              Current: {metrics?.blockRate || 0}%
            </div>
          </div>
          
          {alerts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] mb-2">Recent Alerts</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.slice(0, 5).map((alert, idx) => (
                  <div key={idx} className="p-2 rounded bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-red-500 font-medium">{alert.blockRate}% blocked</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {alert.totalBlocked} / {alert.totalHits} requests blocked
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {alerts.length === 0 && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              No alerts triggered yet. Alerts are sent when block rate exceeds {config?.blockRateAlertThreshold || 20}%.
            </p>
          )}
        </div>
      </div>

      {/* Admin Role Multipliers */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Admin Role Rate Limit Multipliers</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Configure how much higher rate limits are for each admin role compared to regular users.
        </p>
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Role</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Multiplier</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Effective Limit (req/min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {config?.adminRoleMultipliers && Object.entries(config.adminRoleMultipliers).map(([role, multiplier]) => (
                <tr key={role} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)] capitalize">
                    {role.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text)]">
                    {multiplier}x
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text-secondary)]">
                    {(config.rateLimitPerMinute * multiplier).toLocaleString()}/min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Limits Configuration */}
      <div>
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Route Limits Configuration</h2>
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Route</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-secondary)]">Limit (req/min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {config?.routeLimits && Object.entries(config.routeLimits).map(([route, limit]) => (
                <tr key={route} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-4 py-3 text-sm font-mono text-[var(--color-text)]">{route}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text)]">{limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
          Base limits shown above. Admin roles multiply these limits by their configured multiplier.
        </p>
      </div>
    </div>
  );
}
