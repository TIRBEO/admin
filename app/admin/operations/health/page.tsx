'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import {
  HeartPulse, RefreshCw, CheckCircle, XCircle, Clock, Server,
  Database, HardDrive, Wifi, Globe, Shield, Zap, Activity,
} from 'lucide-react';

interface ServiceStatus { name: string; ok: boolean; latency?: number; detail?: string; icon: any; }

export default function HealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [uptime, setUptime] = useState<string>('—');
  const [pool, setPool] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, poolRes, sec, maint, realtime] = await Promise.all([
        apiFetch('/api/content/health').then(r => r.ok ? r.json() : null),
        apiFetch('/api/health/pool').then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/security/score').then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/maintenance').then(r => r.ok ? r.json() : null),
        fetch('https://ws.tirbeo.app/api/health').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      const checks = detail?.checks ?? {};
      const db = checks.database ?? {};
      const redis = checks.redis ?? {};
      const queue = checks.queue ?? {};

      const items: ServiceStatus[] = [
        { name: 'API Server', ok: detail?.status === 'healthy' || !!detail, detail: detail?.version || 'Vercel', icon: Server },
        { name: 'Database', ok: db?.status === 'ok', latency: db?.latencyMs, detail: db?.status === 'error' ? db?.error : undefined, icon: Database },
        { name: 'Redis Cache', ok: redis?.status === 'ok' || redis?.status === undefined, latency: redis?.latencyMs, detail: redis?.status === 'error' ? redis?.error : undefined, icon: HardDrive },
        { name: 'WebSocket', ok: realtime?.status === 'healthy' || !!realtime, detail: realtime?.checks ? `DB ${realtime.checks.database} · Redis ${realtime.checks.redis}` : undefined, icon: Wifi },
        { name: 'Authentication', ok: sec !== null, detail: 'OAuth + Session', icon: Shield },
        { name: 'Job Queue', ok: queue?.failedJobs !== undefined && queue.failedJobs === 0, detail: queue?.pendingJobs !== undefined ? `${queue.pendingJobs} pending · ${queue.failedJobs} failed` : 'Idle', icon: Zap },
        { name: 'Connection Pool', ok: pool?.pool?.available !== undefined ? pool.pool.available > 0 : true, detail: pool?.database ? `${pool.database.latencyMs}ms` : undefined, icon: Activity },
      ];
      setServices(items);
      setPool(pool ?? null);
      setIncidents(detail?.incidents ?? []);
      if (detail?.uptime) {
        const d = Math.floor(detail.uptime / 86400);
        const h = Math.floor((detail.uptime % 86400) / 3600);
        setUptime(d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((detail.uptime % 3600) / 60)}m`);
      }
      setLastCheck(new Date());
    } catch {
      setServices(prev => prev.map(s => ({ ...s, ok: false, detail: 'Unreachable' })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { checkHealth(); const t = setInterval(checkHealth, 30000); return () => clearInterval(t); }, [checkHealth]);

  const healthy = services.filter(s => s.ok).length;
  const total = services.length;
  const poolAvailable = pool?.pool?.available ?? 0;
  const poolTotal = pool?.pool?.total ?? pool?.pool?.max ?? 0;
  const poolPct = poolTotal > 0 ? Math.round((poolAvailable / poolTotal) * 100) : 100;

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">System Health</h1>
            <p className="page-header-description">
              {healthy}/{total} services operational
              {lastCheck && ` · Last checked ${lastCheck.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={checkHealth} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Check Now
            </button>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 10,
        background: healthy === total ? 'var(--tb-green-soft)' : 'var(--tb-red-soft)',
        border: `1px solid ${healthy === total ? 'var(--tb-green)' : 'var(--tb-red)'}20` }}>
        {healthy === total ? <CheckCircle size={20} style={{ color: 'var(--tb-green)' }} /> : <XCircle size={20} style={{ color: 'var(--tb-red)' }} />}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)' }}>
            {healthy === total ? 'All Systems Operational' : `${total - healthy} service${total - healthy > 1 ? 's' : ''} degraded`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 2 }}>Uptime: {uptime}</div>
        </div>
      </div>

      {/* Services Grid */}
      {loading && services.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {services.map(s => (
            <div key={s.name} className="card" style={{ borderLeft: `3px solid ${s.ok === false ? 'var(--tb-red)' : 'var(--tb-green)'}` }}>
              <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.ok === false ? 'var(--tb-red-soft)' : 'var(--tb-green-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} style={{ color: s.ok === false ? 'var(--tb-red)' : 'var(--tb-green)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: s.ok === false ? 'var(--tb-red)' : 'var(--tb-green)', marginTop: 2 }}>
                    {s.ok === false ? 'Down' : 'Operational'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {s.latency !== undefined && (
                    <div style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>{s.latency}ms</div>
                  )}
                  {s.detail && (
                    <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 2 }}>{s.detail}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connection Pool */}
      {pool && (
        <div className="card">
          <div className="card-header"><span className="card-title">Database Connection Pool</span><span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>Live</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--tb-text-secondary)' }}>{poolAvailable} of {poolTotal} connections available</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: poolPct > 60 ? 'var(--tb-green)' : 'var(--tb-yellow)' }}>{poolPct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--tb-surface-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, poolPct)}%`, height: '100%', borderRadius: 4, background: poolPct > 60 ? 'var(--tb-green)' : 'var(--tb-yellow)', transition: 'width 500ms' }} />
                </div>
              </div>
            </div>
            {pool.alerts?.lastWarningAt && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--tb-yellow)' }}>
                Last pool warning: {new Date(pool.alerts.lastWarningAt).toLocaleString()} ({pool.alerts.totalAlerts} total)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incidents */}
      <div className="card">
        <div className="card-header"><span className="card-title">Active Incidents</span><span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>Unresolved</span></div>
        <div className="card-body">
          {incidents.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--tb-green)' }}>
              <CheckCircle size={15} /> No active incidents
            </div>
          ) : incidents.map((inc: any) => (
            <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--tb-border)' }}>
              <XCircle size={15} style={{ color: 'var(--tb-red)' }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--tb-text-primary)' }}>{inc.title || inc.severity}</span>
              <span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>{new Date(inc.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
