'use client';
import React, { useEffect, useState } from 'react';
import AdminSidebar from './sidebar';
import { apiFetch, isOnline } from './lib';
import { OnlineDot } from './components';

interface Stats { counts: { users: number; workspaces: number; routes: number; logs: number; blocked: number }; adminUsers: Array<{ id: string; email: string; name: string; adminRole: string }>; }
interface Me { id: string; email: string; name: string | null; adminRole: string; permissions: Record<string, boolean>; roles: Array<{ id: string; name: string; color: string; icon: string }>; }
interface OnlineUser { id: string; email: string; name: string | null; photoUrl: string | null; adminRole: string | null; lastActiveAt: string; }
interface LogEntry { id: string; method: string; path: string; userId: string | null; ip: string | null; createdAt: string; }

function UsersIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ActivityIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }



export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Heartbeat every 2 min
    const hb = () => apiFetch('/api/admin/heartbeat', { method: 'POST' }).catch(() => {});
    hb(); const hbInt = setInterval(hb, 120000);

    apiFetch('/api/admin/me').then(async r => { if (r.ok) setMe(await r.json()); }).catch(() => {});
    apiFetch('/api/admin/stats').then(async r => {
      if (!r.ok) { setError('Failed to load stats'); return; }
      setStats(await r.json());
    }).catch(() => setError('Network error'));
    apiFetch('/api/admin/activity').then(async r => {
      if (!r.ok) return;
      const d = await r.json();
      setOnlineUsers(d.onlineUsers || []);
      setRecentActivity(d.logs?.slice(0, 10) || []);
    }).catch(() => {});

    return () => clearInterval(hbInt);
  }, []);

  if (error) return <div className="admin-layout"><AdminSidebar /><div className="main"><p className="error">{error}</p></div></div>;
  if (!stats) return <div className="admin-layout"><AdminSidebar /><div className="main"><p className="loading">Loadingâ€¦</p></div></div>;

  const { counts, adminUsers } = stats;
  const perms = me?.permissions || {};

  const quickActions = [
    { href: '/routes', label: 'Manage Routes', perm: 'system.routes', emoji: 'ðŸ”€' },
    { href: '/users', label: 'Manage Users', perm: 'system.users', emoji: 'ðŸ‘¥' },
    { href: '/workspaces', label: 'Workspaces', perm: 'system.workspaces', emoji: 'ðŸ“¦' },
    { href: '/monitor', label: 'Monitor', perm: 'system.monitor', emoji: 'ðŸ“Š' },
    { href: '/settings/roles', label: 'Roles & Permissions', perm: 'roles.view', emoji: 'ðŸ›¡ï¸' },
    { href: '/settings/domains', label: 'Domain Settings', perm: 'domains.view', emoji: 'ðŸŒ' },
    { href: '/settings/landing', label: 'Landing Settings', perm: 'landing.view', emoji: 'ðŸŽ¨' },
  ].filter(a => perms[a.perm]);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>Welcome{me?.name ? `, ${me.name}` : ''}</h2>
            {me && <span className={`badge badge-${me.adminRole}`}>{me.adminRole}</span>}
          </div>
          <p className="desc" style={{ margin: 0 }}>System overview â€” {onlineUsers.length} online now</p>
        </div>

        {/* Stats + Online Users split */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div className="stats-grid" style={{ flex: 1, margin: 0 }}>
            <div className="stat-card"><div className="num" style={{ color: '#7a9aff' }}>{counts.users}</div><div className="label">Users</div></div>
            <div className="stat-card"><div className="num" style={{ color: '#4ade80' }}>{counts.workspaces}</div><div className="label">Workspaces</div></div>
            <div className="stat-card"><div className="num" style={{ color: '#facc15' }}>{counts.routes}</div><div className="label">Routes</div></div>
            <div className="stat-card"><div className="num" style={{ color: '#a78bfa' }}>{counts.logs}</div><div className="label">Logs</div></div>
            <div className="stat-card"><div className="num" style={{ color: '#f87171' }}>{counts.blocked}</div><div className="label">Blocked</div></div>
          </div>

          {/* Online users sidebar */}
          {onlineUsers.length > 0 && (
            <div className="card" style={{ width: 220, flexShrink: 0, margin: 0 }}>
              <h3 style={{ marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                <OnlineDot active /> Online Now
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {onlineUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0' }}>
                    <OnlineDot active />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name || u.email.split('@')[0]}</span>
                    {u.adminRole && <span className={`badge badge-${u.adminRole}`} style={{ fontSize: 9 }}>{u.adminRole}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              {quickActions.map(a => (
                <a key={a.href} href={a.href} className="quick-action-card">
                  <span className="icon" style={{ fontSize: 18 }}>{a.emoji}</span>{a.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="card">
            <h3>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentActivity.map(log => (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 6, fontSize: 12,
                  background: 'rgba(255,255,255,0.015)',
                }}>
                  <span className={`badge badge-${log.method?.toLowerCase() || 'get'}`} style={{ fontSize: 9, minWidth: 40, textAlign: 'center' }}>
                    {log.method || 'GET'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>{log.path}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 10 }}>
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <a href="/monitor" className="btn btn-outline btn-sm" style={{ marginTop: 10 }}>View All â†’</a>
          </div>
        )}

        {/* Admin Users */}
        {adminUsers.length > 0 && (
          <div className="card">
            <h3>Admin Users</h3>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>{adminUsers.map(u => {
                  const ou = onlineUsers.find(o => o.email === u.email);
                  return <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name || 'â€”'}</td>
                    <td><span className={`badge badge-${u.adminRole}`}>{u.adminRole}</span></td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <OnlineDot active={!!ou} />
                      {ou ? 'Online' : 'Offline'}
                    </span></td>
                  </tr>;
                })}</tbody>
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

