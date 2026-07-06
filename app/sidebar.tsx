'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from './lib';

function DashIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function RouteIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function MonitorIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function WsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function LogoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

const NAV_BY_ROLE: Record<string, Array<{ href: string; label: string; icon: React.ComponentType }>> = {
  super_admin: [
    { href: '/', label: 'Dashboard', icon: DashIcon },
    { href: '/routes', label: 'Routes', icon: RouteIcon },
    { href: '/monitor', label: 'Monitor', icon: MonitorIcon },
    { href: '/users', label: 'Users', icon: UsersIcon },
    { href: '/workspaces', label: 'Workspaces', icon: WsIcon },
  ],
  admin: [
    { href: '/', label: 'Dashboard', icon: DashIcon },
    { href: '/routes', label: 'Routes', icon: RouteIcon },
    { href: '/monitor', label: 'Monitor', icon: MonitorIcon },
    { href: '/users', label: 'Users', icon: UsersIcon },
    { href: '/workspaces', label: 'Workspaces', icon: WsIcon },
  ],
  manager: [
    { href: '/', label: 'Dashboard', icon: DashIcon },
    { href: '/routes', label: 'Routes', icon: RouteIcon },
    { href: '/monitor', label: 'Monitor', icon: MonitorIcon },
    { href: '/users', label: 'Users', icon: UsersIcon },
  ],
  editor: [
    { href: '/', label: 'Dashboard', icon: DashIcon },
    { href: '/routes', label: 'Routes', icon: RouteIcon },
    { href: '/monitor', label: 'Monitor', icon: MonitorIcon },
  ],
};

export default function AdminSidebar() {
  const [role, setRole] = useState<string | null>(null);
  const current = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    apiFetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.adminRole) setRole(d.adminRole);
    }).catch(() => {});
  }, []);

  const navItems = NAV_BY_ROLE[role || 'editor'] || NAV_BY_ROLE.editor;

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <div className="brand">
        <h1>Tirbeo</h1>
        <p className="subtitle">Admin Panel</p>
      </div>
      <nav>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = current === item.href || (item.href !== '/' && current.startsWith(item.href));
          return (
            <a key={item.href} href={item.href} className={isActive ? 'active' : ''}>
              <Icon />{item.label}
            </a>
          );
        })}
      </nav>
      <div className="footer">
        <button onClick={handleLogout} className="signout-btn"><LogoutIcon /> Sign Out</button>
      </div>
    </div>
  );
}
