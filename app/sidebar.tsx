'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from './lib';

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

type Perms = Record<string, boolean>;

const APPS = [
  { id: 'landing', label: 'Landing', icon: LayoutIcon, perm: 'landing.view' },
  { id: 'accounts', label: 'Accounts', icon: TypeIcon, perm: 'accounts.view' },
  { id: 'dashboard', label: 'Dashboard', icon: DashIcon, perm: 'settings.dashboard.view' },
  { id: 'admin', label: 'Admin', icon: CornerIcon, perm: 'settings.admin.view' },
  { id: 'api', label: 'API', icon: LinkIcon, perm: 'settings.api.view' },
] as const;

type AppId = (typeof APPS)[number]['id'];

const BASE_NAV = [
  { href: '/', label: 'Dashboard', icon: DashIcon, perm: 'access.dashboard' },
  { href: '/routes', label: 'Routes', icon: RouteIcon, perm: 'system.routes' },
  { href: '/monitor', label: 'Monitor', icon: MonitorIcon, perm: 'system.monitor' },
  { href: '/users', label: 'Users', icon: UsersIcon, perm: 'system.users' },
  { href: '/workspaces', label: 'Workspaces', icon: WsIcon, perm: 'system.workspaces' },
  { href: '/settings/roles', label: 'Roles', icon: RoleIcon, perm: 'roles.view' },
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

export default function AdminSidebar() {
  const [perms, setPerms] = useState<Perms>({});
  const [myRole, setMyRole] = useState<string>('');
  const current = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    apiFetch('/api/admin/me').then(async r => {
      if (!r.ok) return;
      const d = await r.json();
      setPerms(d.permissions || {});
      setMyRole(d.adminRole || '');
    }).catch(() => {});
  }, []);

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

  return (
    <div className="sidebar">
      <div className="brand">
        <h1>Tirbeo</h1>
        <p className="subtitle">Admin Panel</p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 10px', fontSize: 11, color: 'var(--text-muted)' }}>
          <span className={`badge badge-${myRole}`} style={{ fontSize: 10 }}>{myRole || '—'}</span>
          <button onClick={handleLogout} className="signout-btn" style={{ padding: '5px 10px', fontSize: 11, width: 'auto', marginLeft: 'auto' }}>
            <LogoutIcon /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
