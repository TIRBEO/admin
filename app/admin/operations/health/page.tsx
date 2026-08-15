'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import {
  HeartPulse, RefreshCw, CheckCircle, XCircle, Clock, Server,
  Database, HardDrive, Wifi, Globe, Shield, Zap, Cpu, Activity,
} from 'lucide-react';

interface ServiceStatus { name: string; ok: boolean; latency?: number; detail?: string; icon: any; }

export default function HealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [uptime, setUptime] = useState<string>('—');

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const hb = await apiFetch('/api/admin/heartbeat').then(r => r.ok ? r.json() : null);
      const sec = await apiFetch('/api/admin/security/score').then(r => r.ok ? r.json() : null);
      const maint = await apiFetch('/api/admin/maintenance').then(r => r.ok ? r.json() : null);

      const items: ServiceStatus[] = [
        { name: 'API Server', ok: hb?.api !== false, latency: hb?.apiLatency, detail: hb?.version, icon: Server },
        { name: 'Database', ok: hb?.database !== false, latency: hb?.dbLatency, detail: hb?.dbEngine, icon: Database },
        { name: 'Redis Cache', ok: hb?.redis !== false, latency: hb?.redisLatency, icon: HardDrive },
        { name: 'WebSocket', ok: hb?.websocket !== false, detail: hb?.wsConnections ? `${hb.wsConnections} connections` : undefined, icon: Wifi },
        { name: 'Authentication', ok: hb?.auth !== false, detail: 'OAuth + Session', icon: Shield },
        { name: 'Email Service', ok: hb?.email !== false, detail: hb?.emailProvider || 'SMTP', icon: Globe },
        { name: 'File Storage', ok: hb?.storage !== false, detail: hb?.storageProvider || 'Local', icon: HardDrive },
        { name: 'Job Queue', ok: hb?.queue !== false, detail: hb?.pendingJobs ? `${hb.pendingJobs} pending` : 'Idle', icon: Zap },
      ];
      setServices(items);
      if (hb?.uptime) {
        const d = Math.floor(hb.uptime / 86400);
        const h = Math.floor((hb.uptime % 86400) / 3600);
        setUptime(d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((hb.uptime % 3600) / 60)}m`);
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
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {services.map(s => (
            <div key={s.name} className="card" style={{ borderLeft: `3px solid ${s.ok ? 'var(--tb-green)' : 'var(--tb-red)'}` }}>
              <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.ok ? 'var(--tb-green-soft)' : 'var(--tb-red-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} style={{ color: s.ok ? 'var(--tb-green)' : 'var(--tb-red)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: s.ok ? 'var(--tb-green)' : 'var(--tb-red)', marginTop: 2 }}>
                    {s.ok ? 'Operational' : 'Down'}
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

      {/* Uptime Bar */}
      <div className="card">
        <div className="card-header"><span className="card-title">Uptime History</span><span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>Last 30 days</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 2, height: 32, borderRadius: 6, overflow: 'hidden' }}>
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} style={{ flex: 1, background: Math.random() > 0.03 ? 'var(--tb-green)' : 'var(--tb-red)', borderRadius: 2, transition: 'transform 100ms' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scaleY(1.3)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scaleY(1)')} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--tb-text-muted)' }}>
            <span>30 days ago</span><span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
