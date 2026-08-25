'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiFetch } from '../../../lib';
import {
  Activity, Clock, RefreshCw, TrendingUp, AlertTriangle,
  CheckCircle, BarChart3, Zap, Database,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
interface QueryStats {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  recentSamples: number[];
  lastUpdated: number;
}

interface AlertConfig {
  warningThresholdMs: number;
  criticalThresholdMs: number;
  minSamples: number;
  cooldownMs: number;
}

interface AlertEntry {
  queryName: string;
  p95Ms: number;
  thresholdMs: number;
  severity: 'warning' | 'critical';
  firedAt: number;
  firedAtFormatted: string;
  message: string;
}

interface AlertState {
  config: AlertConfig;
  recentAlerts: AlertEntry[];
  activeWarnings: string[];
  activeCriticals: string[];
  totalAlertsFired: number;
}

interface QueryPerfData {
  timestamp: string;
  totalTrackedQueries: number;
  totalSamples: number;
  categories: Record<string, string[]>;
  queries: Record<string, QueryStats>;
  alerts: AlertState;
}

// ─── Helpers ─────────────────────────────────────────────────────
function latencyColor(ms: number): string {
  if (ms < 10) return 'var(--tb-green, #22c55e)';
  if (ms < 50) return 'var(--tb-blue, #3b82f6)';
  if (ms < 100) return 'var(--tb-yellow, #eab308)';
  if (ms < 500) return '#f97316';
  return 'var(--tb-red, #ef4444)';
}

function formatMs(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function healthBadge(p95: number): { label: string; color: string; icon: React.ReactNode } {
  if (p95 < 10) return { label: 'Excellent', color: 'var(--tb-green, #22c55e)', icon: <CheckCircle size={13} /> };
  if (p95 < 50) return { label: 'Good', color: 'var(--tb-blue, #3b82f6)', icon: <CheckCircle size={13} /> };
  if (p95 < 200) return { label: 'Fair', color: 'var(--tb-yellow, #eab308)', icon: <Activity size={13} /> };
  return { label: 'Slow', color: 'var(--tb-red, #ef4444)', icon: <AlertTriangle size={13} /> };
}

// ─── Sparkline ───────────────────────────────────────────────────
function Sparkline({ samples, width = 120, height = 28 }: { samples: number[]; width?: number; height?: number }) {
  if (samples.length < 2) return <span style={{ color: 'var(--tb-text-muted)', fontSize: 11 }}>collecting...</span>;
  const max = Math.max(...samples, 1);
  const points = samples.map((v, i) => {
    const x = (i / (samples.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke="var(--tb-brand, #6366f1)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Category label mapping ──────────────────────────────────────
const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  security_events: { label: 'Security Events', icon: <Activity size={14} />, description: 'Queries on security_events table' },
  tickets: { label: 'Tickets', icon: <BarChart3 size={14} />, description: 'Queries on tickets table' },
  notifications: { label: 'Notifications', icon: <Zap size={14} />, description: 'Queries on notifications table' },
  login_history: { label: 'Login History', icon: <Clock size={14} />, description: 'Queries on login_history table' },
  form_submissions: { label: 'Form Submissions', icon: <Database size={14} />, description: 'Queries on form_submissions table' },
  other: { label: 'Other', icon: <TrendingUp size={14} />, description: 'Other tracked queries' },
};

// ─── Page ────────────────────────────────────────────────────────
export default function QueryPerformancePage() {
  const [data, setData] = useState<QueryPerfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ ts: number; data: QueryPerfData }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/debug/query-perf');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: QueryPerfData = await res.json();
      setData(json);
      setError(null);
      setHistory(prev => {
        const next = [...prev, { ts: Date.now(), data: json }];
        return next.length > 60 ? next.slice(-60) : next; // keep last 60 snapshots
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    }
    setLoading(false);
  }, []);

  const resetStats = useCallback(async () => {
    try {
      await apiFetch('/api/debug/query-perf/reset', { method: 'POST' });
      setHistory([]);
      await fetchData();
    } catch {}
  }, [fetchData]);

  const updateThresholds = useCallback(async (field: string, value: number) => {
    try {
      await apiFetch('/api/debug/query-perf/config', {
        method: 'PUT',
        body: JSON.stringify({ [field]: value }),
      });
      await fetchData();
    } catch {}
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Aggregate stats
  const queries = data?.queries ?? {};
  const queryEntries = Object.entries(queries).filter(([, q]) => q.count > 0);
  const totalQueries = queryEntries.reduce((sum, [, q]) => sum + q.count, 0);
  const avgP95 = queryEntries.length > 0
    ? queryEntries.reduce((sum, [, q]) => sum + q.p95Ms, 0) / queryEntries.length
    : 0;
  const worstP95 = queryEntries.length > 0
    ? Math.max(...queryEntries.map(([, q]) => q.p95Ms))
    : 0;
  const health = healthBadge(avgP95);
  const alerts = data?.alerts;
  const config = alerts?.config;

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={20} />
              Query Performance
            </h1>
            <p className="page-header-description">
              Real-time latency metrics for index-backed queries. Data resets on server restart.
            </p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={fetchData} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={resetStats}>
              Reset Counters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--tb-red-bg, #fef2f2)', color: 'var(--tb-red, #ef4444)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="kpi">
          <div className="kpi-header">
            <span className="kpi-label">Health</span>
            <span style={{ color: health.color }}>{health.icon}</span>
          </div>
          <div className="kpi-value" style={{ color: health.color, fontSize: 18 }}>{health.label}</div>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span className="kpi-label">Total Queries</span>
            <Database size={14} style={{ color: 'var(--tb-blue, #3b82f6)' }} />
          </div>
          <div className="kpi-value">{totalQueries.toLocaleString()}</div>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span className="kpi-label">Avg P95</span>
            <Clock size={14} style={{ color: latencyColor(avgP95) }} />
          </div>
          <div className="kpi-value" style={{ color: latencyColor(avgP95) }}>{formatMs(avgP95)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span className="kpi-label">Worst P95</span>
            <AlertTriangle size={14} style={{ color: latencyColor(worstP95) }} />
          </div>
          <div className="kpi-value" style={{ color: latencyColor(worstP95) }}>{formatMs(worstP95)}</div>
        </div>
      </div>

      {/* Alert Thresholds + Active Alerts */}
      {config && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} />
            <span className="card-title">Latency Alerts</span>
            {alerts && alerts.totalAlertsFired > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--tb-text-muted)' }}>
                {alerts.totalAlertsFired} alert{alerts.totalAlertsFired !== 1 ? 's' : ''} fired
              </span>
            )}
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: 13 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--tb-text-muted)', fontSize: 12, marginBottom: 4 }}>Warning Threshold</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={config.warningThresholdMs}
                  onChange={(e) => updateThresholds('warningThresholdMs', Number(e.target.value))}
                  style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13 }}
                />
                <span style={{ color: 'var(--tb-text-muted)' }}>ms</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--tb-text-muted)', fontSize: 12, marginBottom: 4 }}>Critical Threshold</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={config.criticalThresholdMs}
                  onChange={(e) => updateThresholds('criticalThresholdMs', Number(e.target.value))}
                  style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13 }}
                />
                <span style={{ color: 'var(--tb-text-muted)' }}>ms</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--tb-text-muted)', fontSize: 12, marginBottom: 4 }}>Min Samples</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={config.minSamples}
                  onChange={(e) => updateThresholds('minSamples', Number(e.target.value))}
                  style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13 }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--tb-text-muted)', fontSize: 12, marginBottom: 4 }}>Cooldown</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={Math.round(config.cooldownMs / 1000)}
                  onChange={(e) => updateThresholds('cooldownMs', Number(e.target.value) * 1000)}
                  style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13 }}
                />
                <span style={{ color: 'var(--tb-text-muted)' }}>sec</span>
              </div>
            </div>
          </div>

          {/* Active warnings/criticals */}
          {alerts && (alerts.activeCriticals.length > 0 || alerts.activeWarnings.length > 0) && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--tb-border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {alerts.activeCriticals.map(name => (
                <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 500 }}>
                  <AlertTriangle size={11} /> {name.replace(/_/g, ' ')}
                </span>
              ))}
              {alerts.activeWarnings.map(name => (
                <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: '#fefce8', color: '#ca8a04', fontSize: 12, fontWeight: 500 }}>
                  <Activity size={11} /> {name.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Recent alerts */}
          {alerts && alerts.recentAlerts.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--tb-border)', maxHeight: 160, overflow: 'auto' }}>
              <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginBottom: 6 }}>Recent Alerts</div>
              {alerts.recentAlerts.slice().reverse().slice(0, 10).map((alert, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: alert.severity === 'critical' ? '#dc2626' : '#ca8a04' }}>
                  {alert.severity === 'critical' ? <AlertTriangle size={11} /> : <Activity size={11} />}
                  <span style={{ fontFamily: 'monospace' }}>{alert.queryName.replace(/_/g, ' ')}</span>
                  <span style={{ color: 'var(--tb-text-muted)' }}>P95={Math.round(alert.p95Ms)}ms &gt; {alert.thresholdMs}ms</span>
                  <span style={{ color: 'var(--tb-text-muted)', marginLeft: 'auto' }}>{new Date(alert.firedAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Per-category sections */}
      {Object.entries(data?.categories ?? {}).map(([cat, queryNames]) => {
        if (queryNames.length === 0) return null;
        const catInfo = CATEGORY_LABELS[cat] || { label: cat, icon: <Activity size={14} />, description: '' };
        return (
          <div key={cat} className="card" style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {catInfo.icon}
              <span className="card-title">{catInfo.label}</span>
              <span style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginLeft: 'auto' }}>
                {catInfo.description}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--tb-border, #e5e7eb)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>Query</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>Count</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>Min</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>P50</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>P95</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>P99</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>Max</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {queryNames.map(name => {
                    const q = queries[name];
                    if (!q || q.count === 0) return null;
                    return (
                      <tr key={name} style={{ borderBottom: '1px solid var(--tb-border, #e5e7eb)' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>
                          {name.replace(/_/g, ' ')}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>
                          {q.count.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 12px', color: latencyColor(q.minMs) }}>
                          {formatMs(q.minMs)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 12px', color: latencyColor(q.p50Ms), fontWeight: 500 }}>
                          {formatMs(q.p50Ms)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 12px', color: latencyColor(q.p95Ms), fontWeight: 500 }}>
                          {formatMs(q.p95Ms)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 12px', color: latencyColor(q.p99Ms) }}>
                          {formatMs(q.p99Ms)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 12px', color: latencyColor(q.maxMs) }}>
                          {formatMs(q.maxMs)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                          <Sparkline samples={q.recentSamples} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {data && queryEntries.length === 0 && !loading && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Activity size={32} style={{ color: 'var(--tb-text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--tb-text-muted)', fontSize: 14 }}>
            No query data yet. Metrics will appear as users interact with the app.
          </p>
        </div>
      )}

      {/* Meta info */}
      {data && (
        <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>Tracked queries: {data.totalTrackedQueries}</span>
          <span>Total samples: {data.totalSamples.toLocaleString()}</span>
          <span>Snapshot history: {history.length}/60</span>
          <span>Last updated: {new Date(data.timestamp).toLocaleTimeString()}</span>
          <span>Polling: 5s</span>
        </div>
      )}
    </div>
  );
}
