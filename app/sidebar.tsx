'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from './lib';
import { useWebSocket } from './hooks/use-websocket';
import ThemeToggle from './theme-toggle';

function DashIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function RouteIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function MonitorIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function WsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function RoleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function LogoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function LayoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>; }
function TypeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>; }
function LinkIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function CornerIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>; }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>; }
function EmailIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
function TemplateIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>; }
function AuditIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function BellIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function ShieldIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>; }
function MediaIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>; }
function ChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }

type Perms = Record<string, boolean>;

const APPS = [
  { id: 'landing', label: 'Landing', icon: LayoutIcon, perm: 'landing.view' },
  { id: 'accounts', label: 'Accounts', icon: TypeIcon, perm: 'accounts.view' },
  { id: 'dashboard', label: 'Dashboard', icon: DashIcon, perm: 'settings.dashboard.view' },
  { id: 'admin', label: 'Admin', icon: CornerIcon, perm: 'settings.admin.view' },
  { id: 'api', label: 'API', icon: LinkIcon, perm: 'settings.api.view' },
] as const;

type AppId = (typeof APPS)[number]['id'];

function BrandIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
function PaletteIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>; }

const BASE_NAV = [
  { href: '/', label: 'Dashboard', icon: DashIcon, perm: 'access.dashboard' },
  { href: '/settings/brand', label: 'Brand & Logo', icon: BrandIcon, perm: 'settings.admin.view' },
  { href: '/settings/theme', label: 'Theme Editor', icon: PaletteIcon, perm: 'settings.admin.view' },
  { href: '/routes', label: 'Routes', icon: RouteIcon, perm: 'system.routes' },
  { href: '/monitor', label: 'Monitor', icon: MonitorIcon, perm: 'system.monitor' },
  { href: '/users', label: 'Users', icon: UsersIcon, perm: 'system.users' },
  { href: '/workspaces', label: 'Workspaces', icon: WsIcon, perm: 'system.workspaces' },
  { href: '/settings/roles', label: 'Roles', icon: RoleIcon, perm: 'roles.view' },
  { href: '/settings/email', label: 'Email Config', icon: EmailIcon, perm: 'system.email' },
  { href: '/settings/email/templates', label: 'Email Templates', icon: TemplateIcon, perm: 'system.email' },
  { href: '/monitor/audit', label: 'Audit Trail', icon: AuditIcon, perm: 'system.audit' },
  { href: '/settings/notifications', label: 'Notifications', icon: BellIcon, perm: 'system.notifications' },
  { href: '/moderation', label: 'Moderation', icon: MonitorIcon, perm: 'system.moderation' },
  { href: '/settings/2fa', label: '2FA', icon: ShieldIcon, perm: 'system.2fa' },
  { href: '/media', label: 'Media', icon: MediaIcon, perm: 'system.media' },
  { href: '/analytics', label: 'Analytics', icon: ChartIcon, perm: 'system.analytics' },
];

const APP_NAV: Record<AppId, Array<{ href: string; label: string; perm: string }>> = {
  landing: [
    { href: '/settings/landing', label: 'General', perm: 'landing.view' },
    { href: '/settings/landing/navbar', label: 'Navbar', perm: 'landing.view' },
    { href: '/settings/landing/hero', label: 'Hero', perm: 'landing.view' },
    { href: '/settings/landing/about', label: 'About', perm: 'landing.view' },
    { href: '/settings/landing/faq', label: 'FAQ', perm: 'landing.view' },
    { href: '/settings/landing/newsletter', label: 'Newsletter', perm: 'landing.view' },
    { href: '/settings/landing/footer', label: 'Footer', perm: 'landing.view' },
    { href: '/settings/landing/preloader', label: 'Preloader', perm: 'landing.view' },
    { href: '/settings/landing/redirects', label: 'Redirects', perm: 'landing.view' },
  ],
  accounts: [
    { href: '/settings/accounts', label: 'General', perm: 'accounts.view' },
  ],
  dashboard: [
    { href: '/settings/dashboard', label: 'General', perm: 'settings.dashboard.view' },
  ],
  admin: [
    { href: '/settings/admin', label: 'General', perm: 'settings.admin.view' },
  ],
  api: [
    { href: '/settings/api', label: 'General', perm: 'settings.api.view' },
  ],
};

const APP_ICONS_MAP: Record<string, React.ComponentType> = {
  landing: LayoutIcon, accounts: TypeIcon,
  dashboard: DashIcon, admin: CornerIcon, api: LinkIcon,
};

interface NotifItem { id: string; title: string; body: string | null; type: string; read: boolean; link: string | null; createdAt: string; }

export default function AdminSidebar() {
  const [perms, setPerms] = useState<Perms>({});
  const [myRole, setMyRole] = useState<string>('');
  const [me, setMe] = useState<{ name: string | null; email: string; photoUrl: string | null } | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const current = typeof window !== 'undefined' ? window.location.pathname : '';

  const onWsMsg = useCallback((msg: any) => {
    if (msg.type === 'notification') {
      setNotifCount(c => c + 1);
    }
  }, []);

  const { connected } = useWebSocket(onWsMsg);

  useEffect(() => {
    const load = async () => {
      const [meRes, countRes] = await Promise.all([
        apiFetch('/api/admin/me'),
        apiFetch('/api/admin/notifications?count=true'),
      ]);
      if (meRes.ok) { const d = await meRes.json(); setPerms(d.permissions || {}); setMyRole(d.adminRole || ''); setMe(d); }
      if (countRes.ok) { const d = await countRes.json(); setNotifCount(d.count); }
    };
    load();
    // Heartbeat (keep polling heartbeat for online status)
    const hb = () => apiFetch('/api/admin/heartbeat', { method: 'POST' }).catch(() => {});
    hb(); const id1 = setInterval(hb, 120000);
    return () => { clearInterval(id1); };
  }, []);

  const openNotifs = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      const res = await apiFetch('/api/admin/notifications?limit=10');
      if (res.ok) { const d = await res.json(); setNotifs(d.items || []); }
    }
  };

  const markRead = async (id?: string) => {
    if (id) await apiFetch(`/api/admin/notifications/${id}`, { method: 'PUT' });
    else await apiFetch('/api/admin/notifications', { method: 'PUT' });
    setNotifCount(0);
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  const match = current.match(/^\/settings\/(landing|accounts|dashboard|admin|api)/);
  const selectedApp = match ? (match[1] as AppId) : null;

  const visibleNav = BASE_NAV.filter(n => perms[n.perm]);
  const appNav = selectedApp ? (APP_NAV[selectedApp] || []).filter(n => perms[n.perm]) : [];

  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    window.location.href = val ? `/settings/${val}` : '/';
  };

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const app = selectedApp ? APPS.find(a => a.id === selectedApp) : null;

  const formatTime = (ts: string) => {
    const d = new Date(ts); const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="sidebar">
      <div className="brand" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Tirbeo</h1>
            <p className="subtitle">Admin Panel</p>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} title={connected ? 'Connected' : 'Disconnected'} />
            <button onClick={openNotifs} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifCount > 0 && <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifCount > 9 ? '9+' : notifCount}</span>}
            </button>
            {showNotifs && (
              <div style={{ position: 'absolute', top: '100%', right: 0, width: 320, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-dropdown)', zIndex: 50, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-muted)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
                  <div className="flex gap-1">
                    <button className="btn btn-link" onClick={() => markRead()} style={{ fontSize: 11 }}>Mark all read</button>
                    <a href="/settings/notifications" className="btn btn-link" style={{ fontSize: 11 }}>Settings</a>
                  </div>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications</div>
                  ) : notifs.map(n => (
                    <a key={n.id} href={n.link || '#'} onClick={() => !n.read && markRead(n.id)} style={{ display: 'block', padding: '8px 12px', borderBottom: '1px solid var(--border-muted)', textDecoration: 'none', background: n.read ? 'transparent' : 'var(--accent-subtle)', opacity: n.read ? 0.7 : 1 }}>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                      {n.body && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{n.body}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{formatTime(n.createdAt)}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="app-selector">
        <label className="app-selector-label">App Settings</label>
        <select value={selectedApp || ''} onChange={handleAppChange}>
          <option value="">System</option>
          {APPS.filter(a => perms[a.perm]).map(app => {
            const Icon = app.icon;
            return <option key={app.id} value={app.id}>{app.label}</option>;
          })}
        </select>
      </div>

      {/* Settings sub-nav */}
      {selectedApp && appNav.length > 0 && (
        <>
          <div className="nav-section-label">{app?.label || selectedApp}</div>
          <nav className="app-nav">
            {appNav.map(item => {
              const isActive = current === item.href || (item.href !== '/' && current.startsWith(item.href));
              const AIcon = APP_ICONS_MAP[selectedApp];
              return (
                <a key={item.href} href={item.href} className={isActive ? 'active' : ''}>
                  {AIcon && <AIcon />}{item.label}
                </a>
              );
            })}
          </nav>
        </>
      )}

      {/* System nav */}
      {visibleNav.length > 0 && (
        <>
          <div className="nav-section-label">System</div>
          <nav>
            {visibleNav.map(item => {
              const Icon = item.icon;
              const isActive = current === item.href || (item.href !== '/' && current.startsWith(item.href));
              return (
                <a key={item.href} href={item.href} className={isActive ? 'active' : ''}>
                  <Icon />{item.label}
                </a>
              );
            })}
          </nav>
        </>
      )}

      <div className="footer">
        {me && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
              {me.photoUrl ? <img src={me.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (me.name || me.email)[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.name || 'Admin'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.email}</div>
            </div>
          </div>
        )}
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThemeToggle />
          <span className={`badge badge-${myRole}`} style={{ fontSize: 10 }}>{myRole || '—'}</span>
        </div>
        <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="https://dashboard.tirbeo.app" target="_blank" rel="noopener noreferrer" className="signout-btn" style={{ textDecoration: 'none', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Dashboard
          </a>
          <button onClick={handleLogout} className="signout-btn">
            <LogoutIcon /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
