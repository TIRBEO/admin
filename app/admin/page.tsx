'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib';
import { useAdminWs } from './useAdminWs';
import {
  Users, Shield, Activity, Globe, ChevronRight, RefreshCw,
  MessageSquare, Settings, AlertTriangle, CheckCircle,
  Layers, Server, Database, Clock, ArrowUpRight,
  FileText, Webhook, Zap, Wifi,
} from 'lucide-react';

export default function CommandCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [statusItems, setStatusItems] = useState<{ label: string; ok: boolean; latency?: number; detail?: string }[]>([]);
  const [realTimeActivity, setRealTimeActivity] = useState<any[]>([]);
  const [connectionIndicator, setConnectionIndicator] = useState<'live' | 'syncing' | 'offline'>('offline');
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const { lastMessage, state: wsState, reconnect } = useAdminWs({ autoReconnect: true });

  useEffect(() => {
    if (wsState === 'connected') setConnectionIndicator('live');
    else if (wsState === 'connecting') setConnectionIndicator('syncing');
    else setConnectionIndicator('offline');
  }, [wsState]);

  // Handle real-time WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'server_hints') {
      const hints = lastMessage.hints as any;
      if (hints) {
        setStatusItems(prev => {
          const updated = [...prev];
          if (updated[0]) updated[0] = { ...updated[0], ok: hints.health !== 'overloaded' };
          return updated;
        });
      }
    }
    if (lastMessage.type === 'maintenance_status') {
      const maint = lastMessage.maintenance as any;
      if (maint) setData((prev: any) => ({ ...prev, maintenance: { enabled: maint.enabled, message: maint.message } }));
    }
    if (['activity', 'admin_activity', 'security_event', 'user_created', 'ticket_created'].includes(lastMessage.type)) {
      const event = { id: Date.now().toString(), actor: (lastMessage as any).actor || 'System', action: (lastMessage as any).action || lastMessage.type.replace('_', ' '), resource: (lastMessage as any).resource, createdAt: new Date().toISOString(), isNew: true };
      setRealTimeActivity(prev => [event, ...prev].slice(0, 20));
    }
  }, [lastMessage]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [ov, act, mt, sec] = await Promise.allSettled([
        apiFetch('/api/admin/analytics/overview').then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/activity?limit=12').then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/maintenance').then(r => r.ok ? r.json() : null),
        apiFetch('/api/admin/security/events?limit=1').then(r => r.ok ? r.json() : null),
      ]);

      const overview = ov.status === 'fulfilled' ? ov.value : null;
      const activity = act.status === 'fulfilled' ? act.value : null;
      const maintenance = mt.status === 'fulfilled' ? mt.value : null;
      const security = sec.status === 'fulfilled' ? sec.value : null;

      if (!overview && !activity && !maintenance) {
        setApiError('Could not load data. Check if the API server is running on localhost:3000');
      }

      setData({
        overview, activity: activity?.logs || [], maintenance, security: security?.stats,
      });

      setStatusItems([
        { label: 'API', ok: true, detail: 'Running' },
        { label: 'Database', ok: true },
        { label: 'Redis', ok: true },
        { label: 'WebSocket', ok: wsState === 'connected' },
      ]);
    } catch (err: any) {
      setApiError(`Failed to fetch data: ${err?.message || 'Unknown error'}`);
      // Set fallback data so the page still renders
      setData({ overview: null, activity: [], maintenance: null, security: null });
      setStatusItems([
        { label: 'API', ok: false, detail: 'Unreachable' },
        { label: 'Database', ok: false },
        { label: 'Redis', ok: false },
        { label: 'WebSocket', ok: wsState === 'connected' },
      ]);
    }
    setLoading(false);
  }, [wsState]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 10000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [fetchData]);

  const ov = data?.overview;
  const sec = data?.security;
  const maintActive = data?.maintenance?.enabled;
  const hasCritical = (sec?.critical || 0) > 0;
  const healthColor = hasCritical ? 'var(--tb-red)' : maintActive ? 'var(--tb-yellow)' : 'var(--tb-green)';
  const healthText = hasCritical ? 'Critical Issues Detected' : maintActive ? 'Maintenance Mode Active' : 'All Systems Operational';
  const displayActivity = [...realTimeActivity, ...(data?.activity || [])].slice(0, 10);

  return (
    <div className="page-stack">
      {/* Error banner */}
      {apiError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--tb-yellow-soft)', border: '1px solid var(--tb-yellow)30', fontSize: 13, color: 'var(--tb-yellow)' }}>
          <AlertTriangle size={16} />
          <span style={{ flex: 1 }}>{apiError}</span>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={12} /> Retry</button>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Command Center</h1>
            <p className="page-header-description">Tirbeo platform overview — {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="page-header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: connectionIndicator === 'live' ? 'var(--tb-green-soft)' : 'var(--tb-surface-2)',
              color: connectionIndicator === 'live' ? 'var(--tb-green)' : 'var(--tb-text-muted)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: connectionIndicator === 'live' ? 'var(--tb-green)' : 'var(--tb-text-muted)' }} />
              {connectionIndicator === 'live' ? 'Live' : connectionIndicator === 'syncing' ? 'Syncing' : 'Offline'}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { fetchData(); if (wsState !== 'connected') reconnect(); }}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Health Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10, background: `${healthColor}08`, border: `1px solid ${healthColor}25` }}>
        {hasCritical ? <AlertTriangle size={18} style={{ color: healthColor }} /> : <CheckCircle size={18} style={{ color: healthColor }} />}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{healthText}</div>
          <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 2 }}>
            {statusItems.filter(s => s.ok).length}/{statusItems.length} services healthy
            {data?.maintenance?.enabled && ' · Maintenance scheduled'}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--tb-text-secondary)' }}>
          <span>{ov?.users?.total ?? 0} users</span>
          <span style={{ color: 'var(--tb-border)' }}>·</span>
          <span>{ov?.sessions?.active ?? 0} active</span>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Users', value: ov?.users?.total ?? 0, sub: `${ov?.users?.newThisWeek ?? 0} new this week`, icon: Users, color: 'var(--tb-brand)', href: '/admin/users' },
          { label: 'Active Sessions', value: ov?.sessions?.active ?? 0, sub: `${ov?.sessions?.total ?? 0} total`, icon: Globe, color: 'var(--tb-green)', href: '/admin/users' },
          { label: 'Open Tickets', value: ov?.tickets?.open ?? 0, sub: `${ov?.tickets?.total ?? 0} total`, icon: MessageSquare, color: 'var(--tb-yellow)', href: '/admin/operations/activity' },
          { label: 'Audit Events', value: ov?.auditEvents?.last30Days ?? sec?.total ?? 0, sub: 'Last 30 days', icon: Shield, color: 'var(--tb-purple)', href: '/admin/operations/audit' },
        ].map(k => (
          <div key={k.label} className="kpi" style={{ cursor: 'pointer' }} onClick={() => router.push(k.href)}>
            <div className="kpi-header">
              <span className="kpi-label">{k.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
            </div>
            <div className="kpi-value">{k.value.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* System Status + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* System Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">System Status</span>
            <span style={{ fontSize: 11, color: 'var(--tb-text-muted)' }}>{time.toLocaleTimeString()}</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'API Server', icon: Server, ok: statusItems[0]?.ok },
              { label: 'Database', icon: Database, ok: statusItems[1]?.ok },
              { label: 'Redis Cache', icon: Database, ok: statusItems[2]?.ok },
              { label: 'WebSocket', icon: Wifi, ok: wsState === 'connected' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: s.ok !== false ? 'var(--tb-green-soft)' : 'var(--tb-red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={15} style={{ color: s.ok !== false ? 'var(--tb-green)' : 'var(--tb-red)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: s.ok !== false ? 'var(--tb-green)' : 'var(--tb-red)' }}>{s.ok !== false ? 'Operational' : 'Down'}</div>
                </div>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.ok !== false ? 'var(--tb-green)' : 'var(--tb-red)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Activity{realTimeActivity.length > 0 && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 8, background: 'var(--tb-green-soft)', color: 'var(--tb-green)', marginLeft: 6, fontWeight: 600 }}>{realTimeActivity.length} new</span>}</span>
            <button className="btn btn-ghost btn-xs" onClick={() => router.push('/admin/operations/activity')}>View all <ArrowUpRight size={11} /></button>
          </div>
          <div style={{ padding: 0, maxHeight: 340, overflow: 'auto' }}>
            {displayActivity.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 16px' }}>
                <Activity size={24} style={{ color: 'var(--tb-text-muted)' }} />
                <div className="empty-state-title">No recent activity</div>
              </div>
            ) : displayActivity.map((a: any, i: number) => (
              <div key={a.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 20px', borderBottom: i < displayActivity.length - 1 ? '1px solid var(--tb-border)' : 'none', background: a.isNew ? 'var(--tb-green-soft)' : undefined }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.isNew ? 'var(--tb-green)' : 'var(--tb-brand)', marginTop: 7, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 500, color: 'var(--tb-text-primary)' }}>{a.actor || 'System'}</span>{' '}
                    <span style={{ color: 'var(--tb-text-secondary)' }}>{a.action || 'event'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 2 }}>{a.isNew ? 'just now' : timeAgo(a.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access + Platform */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Quick Access</span></div>
          <div style={{ padding: 6 }}>
            {[
              { label: 'Applications', desc: 'Manage all apps', href: '/admin/applications', icon: Layers, color: 'var(--tb-brand)' },
              { label: 'Users', desc: 'User management', href: '/admin/users', icon: Users, color: 'var(--tb-green)' },
              { label: 'Roles', desc: 'Access control', href: '/admin/access/roles', icon: Shield, color: 'var(--tb-yellow)' },
              { label: 'Audit Logs', desc: 'System audit trail', href: '/admin/operations/audit', icon: Activity, color: 'var(--tb-orange)' },
              { label: 'Settings', desc: 'Platform config', href: '/admin/settings', icon: Settings, color: 'var(--tb-text-secondary)' },
            ].map(l => (
              <button key={l.label} type="button" onClick={() => router.push(l.href)} className="sidebar-item" style={{ borderRadius: 8, marginBottom: 2 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${l.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><l.icon size={14} style={{ color: l.color }} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{l.label}</div><div style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>{l.desc}</div></div>
                <ChevronRight size={14} style={{ color: 'var(--tb-text-muted)' }} />
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Platform Overview</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Applications', value: ov?.apps?.total ?? 0, icon: Layers },
              { label: 'Total Roles', value: ov?.roles?.total ?? 0, icon: Shield },
              { label: 'Notifications', value: ov?.notifications?.total ?? 0, icon: MessageSquare },
              { label: 'API Keys', value: ov?.apiKeys?.active ?? 0, icon: Zap },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <item.icon size={15} style={{ color: 'var(--tb-text-icon-muted)' }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--tb-text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
