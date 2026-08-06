'use client';

import { useEffect, useState } from 'react';
import { AdminSection, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { HeartPulse, Database, Activity, RefreshCw, Server, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Service {
  name: string;
  slug?: string;
  status: string;
  version?: string;
  lastCheckedAt?: string;
  type?: string;
}

interface HealthData {
  status?: string;
  db?: { status: string; latency?: number };
  redis?: { status: string; latency?: number };
  queue?: { status: string; depth?: number };
  services?: Service[];
  incidents?: any[];
  uptime?: number;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      const r = await apiFetch('/api/content/health');
      if (r.ok) { const d = await r.json(); setHealth(d); }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchHealth(); }, []);

  const refresh = () => { setRefreshing(true); fetchHealth(); };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': case 'healthy': case 'connected': return <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />;
      case 'degraded': case 'warning': return <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />;
      case 'down': case 'error': case 'disconnected': return <XCircle className="w-5 h-5 text-[var(--color-error)]" />;
      default: return <Activity className="w-5 h-5 text-[var(--color-admin-text-muted)]" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-[var(--color-admin-surface-hover)] " />)}
        </div>
        <div className="h-64 bg-[var(--color-admin-surface-hover)] " />
      </div>
    );
  }

  const services = health?.services || [];

  return (
    <AdminSection title="System Health" description="Monitor system status, services, and infrastructure"
      tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button onClick={refresh}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      }>
      {/* Overall status */}
      <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14  flex items-center justify-center ${
            health?.status === 'healthy' ? 'bg-[var(--color-success-surface)]' :
            health?.status === 'degraded' ? 'bg-[var(--color-warning-surface)]' :
            'bg-[var(--color-error-surface)]'
          }`}>
            <HeartPulse className={`w-7 h-7 ${
              health?.status === 'healthy' ? 'text-[var(--color-success)]' :
              health?.status === 'degraded' ? 'text-[var(--color-warning)]' :
              'text-[var(--color-error)]'
            }`} />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--color-admin-text)]">All Systems {health?.status === 'healthy' ? 'Operational' : health?.status === 'degraded' ? 'Degraded' : 'Down'}</p>
            <p className="text-sm text-[var(--color-admin-text-muted)]">
              {health?.uptime ? `Uptime: ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : 'Checking...'}
            </p>
          </div>
        </div>
      </div>

      {/* Core infrastructure */}
      <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-3">Core Infrastructure</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { name: 'Database', icon: Database, status: health?.db?.status || 'unknown', detail: health?.db?.latency ? `${health.db.latency}ms` : '—' },
          { name: 'Redis', icon: Server, status: health?.redis?.status || 'unknown', detail: health?.redis?.latency ? `${health.redis.latency}ms` : '—' },
          { name: 'Queue', icon: Activity, status: health?.queue?.status || 'unknown', detail: health?.queue?.depth !== undefined ? `${health.queue.depth} jobs` : '—' },
        ].map(infra => (
          <div key={infra.name} className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <infra.icon className="w-4 h-4 text-[var(--color-admin-text-secondary)]" />
                <span className="text-sm font-medium text-[var(--color-admin-text)]">{infra.name}</span>
              </div>
              {getStatusIcon(infra.status)}
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status={infra.status} />
              <span className="text-xs text-[var(--color-admin-text-muted)]">{infra.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Services */}
      <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-3">Services</h3>
      {services.length === 0 ? (
        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-12 text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
          <p className="text-sm text-[var(--color-admin-text-muted)]">No services registered</p>
        </div>
      ) : (
        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] overflow-hidden">
          <div className="divide-y divide-[var(--color-admin-border)]">
            {services.map((svc, i) => (
              <div key={svc.slug || i} className="flex items-center justify-between p-4 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  {getStatusIcon(svc.status)}
                  <div>
                    <p className="text-sm font-medium text-[var(--color-admin-text)]">{svc.name}</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)]">{svc.type || '—'} {svc.version ? `v${svc.version}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={svc.status} />
                  <span className="text-xs text-[var(--color-admin-text-muted)]">
                    {svc.lastCheckedAt ? new Date(svc.lastCheckedAt).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminSection>
  );
}
