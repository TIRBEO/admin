'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '../../lib';
import { Clock, Shield, Key, Mail, LogIn, Settings, User, Globe, Smartphone, AlertTriangle, Link2, Trash2, Bell, Palette, Search, Filter, ChevronDown, Activity, TrendingUp, Download } from 'lucide-react';

interface AuditEvent {
  id: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  severity?: string;
  createdAt: string;
}

function formatUserAgent(ua?: string): string {
  if (!ua) return '';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return ua.slice(0, 40);
}

function formatActivity(event: AuditEvent) {
  const action = (event.action || '').toLowerCase();
  const meta = event.metadata || {};

  if (action.includes('login') || action.includes('signin')) {
    return {
      label: 'User signed in',
      subtitle: `${event.actorEmail || 'Unknown'} signed in${meta.ip ? ` from ${meta.ip}` : ''}`,
      icon: LogIn,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    };
  }

  if (action.includes('password')) {
    return {
      label: 'Password changed',
      subtitle: `${event.actorEmail || 'Unknown'} changed their password`,
      icon: Key,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    };
  }

  if (action.includes('2fa') || action.includes('totp')) {
    return {
      label: '2FA updated',
      subtitle: `${event.actorEmail || 'Unknown'} updated two-factor authentication`,
      icon: Shield,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    };
  }

  if (action.includes('session')) {
    return {
      label: 'Session activity',
      subtitle: `${event.actorEmail || 'Unknown'} - ${action}`,
      icon: Globe,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    };
  }

  if (action.includes('user') && action.includes('create')) {
    return {
      label: 'User created',
      subtitle: `New user account created: ${meta.email || event.targetId}`,
      icon: User,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    };
  }

  if (action.includes('user') && (action.includes('ban') || action.includes('suspend'))) {
    return {
      label: 'User moderation',
      subtitle: `${event.actorEmail || 'Admin'} ${action.includes('ban') ? 'banned' : 'suspended'} a user`,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    };
  }

  if (action.includes('form')) {
    return {
      label: 'Form activity',
      subtitle: `${event.actorEmail || 'Unknown'} - ${action}`,
      icon: Settings,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    };
  }

  return {
    label: action.replace(/[._-]/g, ' ').trim(),
    subtitle: `${event.actorEmail || 'Unknown'} - ${action}`,
    icon: Activity,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
  };
}

export default function AdminActivityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/admin/audit?limit=100')
      .then(r => r.ok ? r.json() : [])
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.events || data?.audit || [];
        setEvents(list);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch = !search || 
        e.action?.toLowerCase().includes(search.toLowerCase()) ||
        e.actorEmail?.toLowerCase().includes(search.toLowerCase()) ||
        e.targetType?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || e.action?.toLowerCase().includes(filter);
      return matchSearch && matchFilter;
    });
  }, [events, search, filter]);

  const stats = useMemo(() => ({
    total: events.length,
    logins: events.filter(e => e.action?.toLowerCase().includes('login')).length,
    security: events.filter(e => 
      e.action?.toLowerCase().includes('password') || 
      e.action?.toLowerCase().includes('2fa') ||
      e.action?.toLowerCase().includes('session')
    ).length,
  }), [events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Monitor system-wide activity and audit events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-accent)]/10">
              <Activity className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.total}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total events</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <LogIn className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.logins}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Login events</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.security}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Security events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm focus:outline-none"
        >
          <option value="all">All events</option>
          <option value="login">Logins</option>
          <option value="password">Passwords</option>
          <option value="2fa">2FA</option>
          <option value="session">Sessions</option>
        </select>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-border)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--color-border)] rounded w-1/3" />
                  <div className="h-3 bg-[var(--color-border)] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-text-muted)]">No activity events found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => {
            const formatted = formatActivity(event);
            const Icon = formatted.icon;
            return (
              <div key={event.id} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors">
                <div className={`p-2 rounded-lg ${formatted.bg}`}>
                  <Icon className={`w-5 h-5 ${formatted.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)]">{formatted.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{formatted.subtitle}</p>
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
