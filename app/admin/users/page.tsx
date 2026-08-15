'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import {
  Users, Search, Shield, CheckCircle, XCircle, RefreshCw, Eye,
  UserX, ChevronLeft, ChevronRight, Mail, Clock, Globe,
  MoreVertical, Ban, RotateCcw, X, Key, Smartphone, Activity,
  AlertTriangle, Calendar, Fingerprint, Building2,
} from 'lucide-react';

interface User {
  id: string; name: string; email: string; photoUrl?: string;
  adminRole?: string; verified?: boolean; createdAt?: string;
  lastActive?: string; suspended?: boolean; isSuspended?: boolean;
  isBanned?: boolean; twoFactorEnabled?: boolean; is2FAEnabled?: boolean;
  emailVerified?: boolean;
}

interface UserDetail {
  id: string; email: string; name: string; photoUrl?: string;
  adminRole?: string; isBanned?: boolean; isSuspended?: boolean;
  is2FAEnabled?: boolean; emailVerified?: boolean;
  createdAt?: string; updatedAt?: string; status?: string;
  roles?: { id: string; name: string }[];
  sessions?: { id: string; userAgent?: string; ipAddress?: string; createdAt?: string; expiresAt?: string }[];
  _count?: { sessions?: number; memberships?: number; notifications?: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, admins: 0, verified: 0, suspended: 0, banned: 0 });
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'sessions' | 'roles'>('overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const perPage = 12;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('search', search);
      const res = await apiFetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.users || data || [];
        setUsers(list);
        setStats({
          total: list.length,
          admins: list.filter((u: User) => u.adminRole === 'super_admin' || u.adminRole === 'admin').length,
          verified: list.filter((u: User) => u.verified || u.emailVerified).length,
          suspended: list.filter((u: User) => u.suspended || u.isSuspended).length,
          banned: list.filter((u: User) => u.isBanned).length,
        });
      }
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin' && u.adminRole !== 'super_admin' && u.adminRole !== 'admin') return false;
      if (roleFilter === 'user' && (u.adminRole === 'super_admin' || u.adminRole === 'admin')) return false;
    }
    if (statusFilter === 'suspended' && !(u.suspended || u.isSuspended) && !u.isBanned) return false;
    if (statusFilter === 'active' && (u.suspended || u.isSuspended || u.isBanned)) return false;
    if (statusFilter === 'banned' && !u.isBanned) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(u => u.id)));
  };

  // Open user detail
  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    setDetailUser(null);
    setDetailTab('overview');
    setContextMenu(null);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailUser(data);
      }
    } catch {}
    setDetailLoading(false);
  };

  // Close detail
  const closeDetail = () => setDetailUser(null);

  // Suspend user (temporary)
  const suspendUser = async (id: string, reason?: string, days?: number) => {
    const res = await apiFetch(`/api/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason: reason || 'Suspended by admin' }) });
    if (res.ok) { showToast('User suspended temporarily'); fetchUsers(); if (detailUser?.id === id) openDetail(id); }
  };
  // Unsuspend user
  const unsuspendUser = async (id: string) => {
    const res = await apiFetch(`/api/admin/users/${id}/unsuspend`, { method: 'PATCH' });
    if (res.ok) { showToast('Suspension lifted'); fetchUsers(); if (detailUser?.id === id) openDetail(id); }
  };
  // Ban user (permanent)
  const banUser = async (id: string, reason?: string) => {
    const res = await apiFetch(`/api/admin/users/${id}/ban`, { method: 'PATCH', body: JSON.stringify({ reason: reason || 'Banned by admin' }) });
    if (res.ok) { showToast('User permanently banned'); fetchUsers(); if (detailUser?.id === id) openDetail(id); }
  };
  // Unban user
  const unbanUser = async (id: string) => {
    const res = await apiFetch(`/api/admin/users/${id}/unban`, { method: 'PATCH' });
    if (res.ok) { showToast('User unbanned'); fetchUsers(); if (detailUser?.id === id) openDetail(id); }
  };

  // Assign admin role
  const assignAdminRole = async (userId: string, role: string) => {
    setAssigningRole(userId);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ adminRole: role }) });
      if (res.ok) { showToast(`Role set to ${role || 'none'}`); fetchUsers(); if (detailUser?.id === userId) openDetail(userId); }
    } catch {}
    setAssigningRole(null);
  };

  return (
    <div className="page-stack">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200, padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? 'var(--tb-green-soft)' : 'var(--tb-red-soft)',
          color: toast.type === 'success' ? 'var(--tb-green)' : 'var(--tb-red)',
          border: `1px solid ${toast.type === 'success' ? 'var(--tb-green)' : 'var(--tb-red)'}30`,
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 200ms ease both', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Users</h1>
            <p className="page-header-description">{stats.total} total users · {stats.admins} admins</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={fetchUsers}><RefreshCw size={13} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'var(--tb-brand)' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'var(--tb-purple)' },
          { label: 'Verified', value: stats.verified, icon: CheckCircle, color: 'var(--tb-green)' },
          { label: 'Suspended', value: stats.suspended, icon: UserX, color: 'var(--tb-yellow)' },
          { label: 'Banned', value: stats.banned, icon: Ban, color: 'var(--tb-red)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><k.icon size={14} style={{ color: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tb-text-muted)' }} />
          <input className="input" placeholder="Search users by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 38 }} />
        </div>
        <select className="input" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ width: 130, cursor: 'pointer' }}>
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="user">Users</option>
        </select>
        <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 130, cursor: 'pointer' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <Users size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No users found</div>
          <div className="empty-state-desc">{search ? 'Try a different search' : 'No users match the current filters'}</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--tb-border)' }}>
          <table className="dashboard-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--tb-brand)' }} />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>2FA</th>
                <th>Created</th>
                <th>Last Active</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(user => {
                const isSuspended = user.suspended || user.isSuspended;
                const isBanned = user.isBanned;
                return (
                  <tr key={user.id} style={{ cursor: 'pointer', background: selected.has(user.id) ? 'var(--tb-surface-1)' : detailUser?.id === user.id ? 'var(--tb-surface-1)' : undefined }}
                    onClick={() => openDetail(user.id)}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelect(user.id)} style={{ accentColor: 'var(--tb-brand)' }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--tb-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--tb-text-secondary)', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--tb-border)' }}>
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Unnamed'}</div>
                          <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.adminRole === 'super_admin' ? 'badge-purple' : user.adminRole === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                        {user.adminRole === 'super_admin' ? 'Super Admin' : user.adminRole === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isBanned ? 'badge-red' : isSuspended ? 'badge-yellow' : 'badge-green'}`}>
                        {isBanned ? 'Banned' : isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {user.twoFactorEnabled || user.is2FAEnabled ? (
                        <CheckCircle size={14} style={{ color: 'var(--tb-green)' }} />
                      ) : (
                        <XCircle size={14} style={{ color: 'var(--tb-text-muted)' }} />
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>
                      {user.lastActive ? timeAgo(user.lastActive) : '—'}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setContextMenu(contextMenu === user.id ? null : user.id)}>
                        <MoreVertical size={14} />
                      </button>
                      {contextMenu === user.id && (
                        <div className="header-popover" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, minWidth: 160 }}>
                          <button className="menu-item" onClick={() => openDetail(user.id)}><Eye size={14} /> View Profile</button>
                          <button className="menu-item" onClick={() => setContextMenu(null)}><Mail size={14} /> Send Email</button>
                          <button className="menu-item" onClick={() => setContextMenu(null)}><Key size={14} /> Manage Sessions</button>
                          <div className="menu-divider" />
                          {user.isBanned ? (
                            <button className="menu-item" onClick={() => { unbanUser(user.id); setContextMenu(null); }}><RotateCcw size={14} /> Unban</button>
                          ) : isSuspended ? (
                            <button className="menu-item" onClick={() => { unsuspendUser(user.id); setContextMenu(null); }}><RotateCcw size={14} /> Unsuspend</button>
                          ) : (
                            <>
                              <button className="menu-item" onClick={() => { suspendUser(user.id); setContextMenu(null); }}><Clock size={14} /> Suspend (Temporary)</button>
                              <button className="menu-item danger" onClick={() => { banUser(user.id); setContextMenu(null); }}><Ban size={14} /> Ban (Permanent)</button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--tb-text-muted)' }}>
          <span>Page {page} of {totalPages} · {filtered.length} users</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {/* ═══ USER DETAIL DRAWER ═══ */}
      {(detailUser || detailLoading) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }} onClick={closeDetail}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
          {/* Panel */}
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 560, background: 'var(--tb-bg)', borderLeft: '1px solid var(--tb-border)', overflow: 'auto', animation: 'dialogIn 200ms ease both' }}>
            {detailLoading && !detailUser ? (
              <div style={{ padding: 24 }}>
                <div className="skeleton" style={{ height: 80, marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 200 }} />
              </div>
            ) : detailUser && (
              <div style={{ padding: 24 }}>
                {/* Close */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
                  <button className="btn btn-ghost btn-xs" onClick={closeDetail}><X size={16} /></button>
                </div>

                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--tb-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--tb-text-secondary)', border: '2px solid var(--tb-border)', overflow: 'hidden', flexShrink: 0 }}>
                    {detailUser.photoUrl ? (
                      <img src={detailUser.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (detailUser.name || detailUser.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tb-text-primary)' }}>{detailUser.name || 'Unnamed User'}</div>
                    <div style={{ fontSize: 13, color: 'var(--tb-text-muted)', marginTop: 2 }}>{detailUser.email}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <span className={`badge ${detailUser.adminRole === 'super_admin' ? 'badge-purple' : detailUser.adminRole === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                        {detailUser.adminRole === 'super_admin' ? 'Super Admin' : detailUser.adminRole === 'admin' ? 'Admin' : 'User'}
                      </span>
                      <span className={`badge ${detailUser.isBanned ? 'badge-red' : detailUser.isSuspended ? 'badge-yellow' : 'badge-green'}`}>
                        {detailUser.isBanned ? 'Banned (Permanent)' : detailUser.isSuspended ? 'Suspended (Temporary)' : 'Active'}
                      </span>
                      {detailUser.emailVerified && <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>}
                      {(detailUser.is2FAEnabled) && <span className="badge badge-blue"><Shield size={10} /> 2FA</span>}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {detailUser.isBanned ? (
                    <button className="btn btn-primary btn-sm" onClick={() => unbanUser(detailUser.id)}><RotateCcw size={13} /> Unban User</button>
                  ) : detailUser.isSuspended ? (
                    <button className="btn btn-primary btn-sm" onClick={() => unsuspendUser(detailUser.id)}><RotateCcw size={13} /> Unsuspend</button>
                  ) : (
                    <>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--tb-yellow)', border: '1px solid var(--tb-yellow)30' }} onClick={() => suspendUser(detailUser.id)}><Clock size={13} /> Suspend (Temporary)</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--tb-red)', border: '1px solid var(--tb-red)30' }} onClick={() => banUser(detailUser.id)}><Ban size={13} /> Ban (Permanent)</button>
                    </>
                  )}
                  <button className="btn btn-ghost btn-sm"><Mail size={13} /> Send Email</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--tb-border)', paddingBottom: 8 }}>
                  {(['overview', 'sessions', 'roles'] as const).map(tab => (
                    <button key={tab} className={`btn ${detailTab === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                      onClick={() => setDetailTab(tab)}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {detailTab === 'overview' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'User ID', value: detailUser.id?.slice(0, 12) + '...', icon: Fingerprint },
                      { label: 'Email', value: detailUser.email, icon: Mail },
                      { label: 'Admin Role', value: detailUser.adminRole || 'None', icon: Shield },
                      { label: 'Status', value: detailUser.status || 'Active', icon: detailUser.isSuspended ? AlertTriangle : CheckCircle },
                      { label: 'Email Verified', value: detailUser.emailVerified ? 'Yes' : 'No', icon: detailUser.emailVerified ? CheckCircle : XCircle },
                      { label: '2FA Enabled', value: detailUser.is2FAEnabled ? 'Yes' : 'No', icon: detailUser.is2FAEnabled ? Shield : XCircle },
                      { label: 'Sessions', value: detailUser._count?.sessions ?? '—', icon: Globe },
                      { label: 'Memberships', value: detailUser._count?.memberships ?? '—', icon: Building2 },
                      { label: 'Notifications', value: detailUser._count?.notifications ?? '—', icon: Activity },
                      { label: 'Created', value: detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString() : '—', icon: Calendar },
                    ].map(f => (
                      <div key={f.label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <f.icon size={12} style={{ color: 'var(--tb-text-icon-muted)' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)', fontFamily: ['User ID'].includes(f.label) ? 'monospace' : undefined, wordBreak: 'break-all' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === 'sessions' && (
                  <div>
                    {(!detailUser.sessions || detailUser.sessions.length === 0) ? (
                      <div className="empty-state" style={{ padding: '24px 0' }}>
                        <Globe size={24} style={{ color: 'var(--tb-text-muted)' }} />
                        <div className="empty-state-title">No sessions</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detailUser.sessions!.map((session, i) => (
                          <div key={session.id || i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Smartphone size={14} style={{ color: 'var(--tb-text-icon-muted)', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, color: 'var(--tb-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {session.userAgent || 'Unknown device'}
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 11, color: 'var(--tb-text-muted)' }}>
                                  {session.ipAddress && <span><Globe size={10} style={{ verticalAlign: -1 }} /> {session.ipAddress}</span>}
                                  <span><Clock size={10} style={{ verticalAlign: -1 }} /> {session.createdAt ? timeAgo(session.createdAt) : '—'}</span>
                                  {session.expiresAt && <span>Expires {new Date(session.expiresAt).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'roles' && (
                  <div>
                    {/* Admin Role Assignment */}
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-secondary)', marginBottom: 8 }}>Admin Role</h4>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { value: 'super_admin', label: 'Super Admin', color: 'var(--tb-purple)' },
                          { value: 'admin', label: 'Admin', color: 'var(--tb-blue)' },
                          { value: 'manager', label: 'Manager', color: 'var(--tb-green)' },
                          { value: '', label: 'None (User)', color: 'var(--tb-text-muted)' },
                        ].map(r => (
                          <button key={r.value} type="button"
                            className={`btn ${detailUser.adminRole === r.value || (!detailUser.adminRole && !r.value) ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                            disabled={assigningRole === detailUser.id || detailUser.adminRole === 'super_admin'}
                            onClick={() => assignAdminRole(detailUser.id, r.value)}
                            style={detailUser.adminRole === r.value ? { background: r.color, borderColor: r.color } : {}}>
                            {assigningRole === detailUser.id ? '...' : r.label}
                          </button>
                        ))}
                      </div>
                      {detailUser.adminRole === 'super_admin' && (
                        <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 4 }}>Super Admin role cannot be changed</div>
                      )}
                    </div>

                    {/* Assigned Roles */}
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-secondary)', marginBottom: 8 }}>
                      Assigned Roles ({detailUser.roles?.length || 0})
                    </h4>
                    {(!detailUser.roles || detailUser.roles.length === 0) ? (
                      <div style={{ fontSize: 13, color: 'var(--tb-text-muted)', padding: '12px 0' }}>No custom roles assigned</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detailUser.roles!.map(role => (
                          <div key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                            <Shield size={14} style={{ color: 'var(--tb-brand)' }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{role.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
