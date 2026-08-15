'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { Lock, Shield, Search, CheckCircle, XCircle, Edit3 } from 'lucide-react';

interface Role { id: string; name: string; permissions: Record<string, boolean>; isSystem?: boolean; color?: string; }

const PERMISSION_GROUPS: Record<string, string[]> = {
  'Users': ['users.view', 'users.create', 'users.update', 'users.delete', 'users.suspend', 'users.restore'],
  'Sessions': ['sessions.view', 'sessions.revoke', 'sessions.revoke_all'],
  'Roles': ['roles.view', 'roles.create', 'roles.update', 'roles.delete'],
  'Applications': ['apps.view', 'apps.configure', 'apps.deploy'],
  'Content': ['content.view', 'content.create', 'content.update', 'content.delete', 'content.publish'],
  'Navigation': ['navigation.view', 'navigation.update', 'navigation.publish'],
  'Media': ['media.view', 'media.upload', 'media.delete'],
  'Support': ['tickets.view', 'tickets.reply', 'tickets.assign', 'tickets.close'],
  'Analytics': ['analytics.view', 'analytics.export'],
  'Settings': ['settings.view', 'settings.update'],
  'Security': ['security.view', 'security.configure', 'security.audit'],
  'Webhooks': ['webhooks.view', 'webhooks.create', 'webhooks.delete'],
  'API Keys': ['apikeys.view', 'apikeys.create', 'apikeys.revoke'],
  'Audit': ['audit.view', 'audit.export'],
  'System': ['system.health', 'system.logs', 'system.maintenance'],
};

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [search, setSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(Object.keys(PERMISSION_GROUPS)));

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        const rolesList = data.roles || [];
        setRoles(rolesList);
        if (rolesList.length > 0 && !selectedRole) {
          setSelectedRole(rolesList[0]);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => { const n = new Set(prev); n.has(section) ? n.delete(section) : n.add(section); return n; });
  };

  const perms = selectedRole?.permissions || {};

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Permissions</h1>
            <p className="page-header-description">Permission matrix for {roles.length} roles</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
      ) : roles.length === 0 ? (
        <div className="empty-state">
          <Shield size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No roles found</div>
          <div className="empty-state-desc">Create roles in the Roles page first</div>
        </div>
      ) : (
        <>
          {/* Role Selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {roles.map(role => (
              <button key={role.id} className={`btn ${selectedRole?.id === role.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={() => setSelectedRole(role)}>
                <Shield size={13} style={{ color: role.color || undefined }} /> {role.name}
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                  ({Object.values(role.permissions || {}).filter(Boolean).length})
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tb-text-muted)' }} />
            <input className="input" placeholder="Search permissions..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>

          {/* Permission Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(PERMISSION_GROUPS).map(([section, sectionPerms]) => {
              const filteredPerms = search ? sectionPerms.filter(p => p.toLowerCase().includes(search.toLowerCase())) : sectionPerms;
              if (filteredPerms.length === 0) return null;
              const expanded = expandedSections.has(section);
              const grantedCount = filteredPerms.filter(p => perms[p]).length;
              return (
                <div key={section} className="card" style={{ overflow: 'hidden' }}>
                  <button type="button" onClick={() => toggleSection(section)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-primary)', flex: 1, textAlign: 'left' }}>{section}</span>
                    <span style={{ fontSize: 11, color: 'var(--tb-green)' }}>{grantedCount}/{filteredPerms.length}</span>
                    <span style={{ fontSize: 16, color: 'var(--tb-text-muted)', transform: expanded ? 'rotate(90deg)' : '', transition: 'transform 150ms' }}>›</span>
                  </button>
                  {expanded && (
                    <div style={{ padding: '0 18px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
                      {filteredPerms.map(p => {
                        const has = !!perms[p];
                        return (
                          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: has ? 'var(--tb-green-soft)' : 'var(--tb-surface-1)', border: `1px solid ${has ? 'var(--tb-green)' : 'var(--tb-border)'}20` }}>
                            {has ? <CheckCircle size={13} style={{ color: 'var(--tb-green)' }} /> : <XCircle size={13} style={{ color: 'var(--tb-text-muted)' }} />}
                            <span style={{ fontSize: 12, fontFamily: 'monospace', color: has ? 'var(--tb-text-primary)' : 'var(--tb-text-muted)' }}>{p}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
