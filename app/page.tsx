'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from './sidebar';
import { apiFetch } from './lib';

interface Stats { counts: { users: number; workspaces: number; routes: number; logs: number; blocked: number }; adminUsers: Array<{ id: string; email: string; name: string; adminRole: string }>; }
interface Me { id: string; email: string; name: string | null; adminRole: string; permissions: Record<string, boolean>; roles: Array<{ id: string; name: string; color: string; icon: string }>; }

function UsersIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function WsIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function RouteIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function LogIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function BlockIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function MonIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function SettingsIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>; }
function RoleIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function GlobeIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/me').then(async r => {
      if (r.ok) setMe(await r.json());
    }).catch(() => {});
    apiFetch('/api/admin/stats').then(async r => {
      if (!r.ok) { setError('Failed to load stats'); return; }
      setStats(await r.json());
    }).catch(() => setError('Network error'));
  }, []);

  if (error) return <div className="admin-layout"><AdminSidebar /><div className="main"><p className="error">{error}</p></div></div>;
  if (!stats) return <div className="admin-layout"><AdminSidebar /><div className="main"><p className="loading">Loading…</p></div></div>;

  const { counts, adminUsers } = stats;
  const perms = me?.permissions || {};

  const quickActions = [
    { href: '/routes', label: 'Manage Routes', icon: RouteIcon, perm: 'system.routes' },
    { href: '/users', label: 'Manage Users', icon: UsersIcon, perm: 'system.users' },
    { href: '/workspaces', label: 'Workspaces', icon: WsIcon, perm: 'system.workspaces' },
    { href: '/monitor', label: 'Monitor', icon: MonIcon, perm: 'system.monitor' },
    { href: '/settings/roles', label: 'Roles & Permissions', icon: RoleIcon, perm: 'roles.view' },
    { href: '/settings/domains', label: 'Domain Settings', icon: GlobeIcon, perm: 'domains.view' },
    { href: '/settings/landing', label: 'Landing Settings', icon: SettingsIcon, perm: 'landing.view' },
    { href: '/settings/accounts', label: 'Accounts Settings', icon: SettingsIcon, perm: 'accounts.view' },
  ].filter(a => perms[a.perm]);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        {/* Welcome header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>Welcome{me?.name ? `, ${me.name}` : ''}</h2>
            {me && <span className={`badge badge-${me.adminRole}`}>{me.adminRole}</span>}
          </div>
          <p className="desc" style={{ margin: 0 }}>System overview and quick access</p>
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          <div className="stat-card"><div className="num" style={{ color: '#7a9aff' }}>{counts.users}</div><div className="label"><UsersIcon /> Users</div></div>
          <div className="stat-card"><div className="num" style={{ color: '#4ade80' }}>{counts.workspaces}</div><div className="label"><WsIcon /> Workspaces</div></div>
          <div className="stat-card"><div className="num" style={{ color: '#facc15' }}>{counts.routes}</div><div className="label"><RouteIcon /> Routes</div></div>
          <div className="stat-card"><div className="num" style={{ color: '#a78bfa' }}>{counts.logs}</div><div className="label"><LogIcon /> Log Entries</div></div>
          <div className="stat-card"><div className="num" style={{ color: '#f87171' }}>{counts.blocked}</div><div className="label"><BlockIcon /> Blocked</div></div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            {quickActions.map(a => {
              const Icon = a.icon;
              return (
                <a key={a.href} href={a.href} className="quick-action-card">
                  <span className="icon"><Icon /></span>{a.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Admin Users */}
        {adminUsers.length > 0 && (
          <div className="card">
            <h3>Admin Users</h3>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Email</th><th>Name</th><th>Role</th></tr></thead>
                <tbody>{adminUsers.map(u => <tr key={u.id}><td>{u.email}</td><td>{u.name || '—'}</td><td><span className={`badge badge-${u.adminRole}`}>{u.adminRole}</span></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* My Roles */}
        {me && me.roles && me.roles.length > 0 && (
          <div className="card">
            <h3>My Custom Roles</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {me.roles.map(r => (
                <span key={r.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  background: r.color + '18', color: r.color,
                  border: `1px solid ${r.color}33`,
                  fontSize: 13, fontWeight: 500,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
