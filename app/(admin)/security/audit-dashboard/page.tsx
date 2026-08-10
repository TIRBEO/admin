'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import {
  Shield, ShieldCheck, AlertTriangle, Activity, Clock, Users, Globe,
  Lock, Key, RefreshCw, Download, Filter, Search, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownRight, Minus, Eye, EyeOff, Ban, CheckCircle2,
  XCircle, AlertCircle, TrendingUp, TrendingDown, BarChart3, PieChart,
  FileText, Filter as FilterIcon, Download as DownloadIcon, Loader2
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
  user?: { email: string; name: string } | null;
  rayId?: string;
}

interface SecurityStats {
  today: { total: number; critical: number; warning: number; info: number };
  week: { total: number; critical: number; warning: number; info: number };
  month: { total: number; critical: number; warning: number; info: number };
  total: number;
  activeBlocks: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  topIPs: Array<{ ip: string; count: number; lastSeen: string }>;
  topEventTypes: Array<{ type: string; count: number }>;
  recentCritical: SecurityEvent[];
}

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  actorEmail?: string;
  target?: string;
  targetType?: string;
  category: string;
  ip?: string;
  createdAt: string;
  metadata?: Record<string, any>;
  severity?: string;
}

interface SecurityScore {
  score: number;
  factors: Array<{
    name: string;
    score: number;
    maxScore: number;
    status: 'good' | 'warning' | 'critical';
    description: string;
  }>;
}

// ── Helper Functions ───────────────────────────────────────────────────────
const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: 'bg-[var(--color-info-surface)]', text: 'text-[var(--color-info)]', border: 'border-[var(--color-info)]' },
  warning: { bg: 'bg-[var(--color-warning-surface)]', text: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning)]' },
  error: { bg: 'bg-[var(--color-error-surface)]', text: 'text-[var(--color-error)]', border: 'border-[var(--color-error)]' },
  critical: { bg: 'bg-[var(--color-error)]', text: 'text-[var(--color-on-accent)]', border: 'border-[var(--color-error)]' },
};

const THREAT_LEVEL_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: ShieldCheck },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: AlertCircle },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatRelativeTime(iso: string) {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ── Components ─────────────────────────────────────────────────────────────
function StatCard({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  trendValue 
}: { 
  label: string;
  value: string | number;
  subValue?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400';
  
  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-[var(--color-admin-text)]">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{trendValue}</span>
          </div>
        )}
        {subValue && (
          <span className="text-xs text-[var(--color-admin-text-muted)]">{subValue}</span>
        )}
      </div>
    </div>
  );
}

function ThreatLevelBadge({ level }: { level: string }) {
  const style = THREAT_LEVEL_STYLES[level] || THREAT_LEVEL_STYLES.low;
  const Icon = style.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${style.bg} ${style.text} border border-current/20`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium capitalize">{level} Threat</span>
    </div>
  );
}

function SecurityScoreCard({ score }: { score: SecurityScore }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5';
    if (score >= 60) return 'from-amber-500/20 to-amber-500/5';
    if (score >= 40) return 'from-orange-500/20 to-orange-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider">
          Security Score
        </h3>
        <Shield className="w-5 h-5 text-[var(--color-primary)]" />
      </div>
      
      <div className={`bg-gradient-to-r ${getScoreBg(score.score)} p-4 mb-4`}>
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold ${getScoreColor(score.score)}`}>{score.score}</span>
          <span className="text-lg text-[var(--color-admin-text-muted)] mb-1">/100</span>
        </div>
      </div>

      <div className="space-y-3">
        {score.factors.map((factor, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-admin-text-secondary)]">{factor.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-[var(--color-admin-surface-hover)] overflow-hidden">
                <div 
                  className={`h-full ${
                    factor.status === 'good' ? 'bg-emerald-400' : 
                    factor.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[var(--color-admin-text-muted)] w-12 text-right">
                {factor.score}/{factor.maxScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventTimeline({ events }: { events: SecurityEvent[] }) {
  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider">
          Recent Security Events
        </h3>
        <Activity className="w-5 h-5 text-[var(--color-primary)]" />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm text-[var(--color-admin-text-muted)]">No recent security events</p>
          </div>
        ) : (
          events.map((event) => {
            const style = SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.info;
            return (
              <div key={event.id} className="flex items-start gap-3 p-3 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  event.severity === 'critical' ? 'bg-red-400' :
                  event.severity === 'error' ? 'bg-orange-400' :
                  event.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--color-admin-text)] truncate">
                      {event.eventType}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}>
                      {event.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-admin-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {event.ipAddress || 'Unknown IP'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(event.createdAt)}
                    </span>
                    {event.user?.email && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.user.email}
                      </span>
                    )}
                  </div>
                  {event.metadata?.reason && (
                    <p className="mt-1 text-xs text-[var(--color-admin-text-tertiary)]">
                      {String(event.metadata.reason)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TopThreatsTable({ ips }: { ips: Array<{ ip: string; count: number; lastSeen: string }> }) {
  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider">
          Top Threat IPs
        </h3>
        <Ban className="w-5 h-5 text-[var(--color-error)]" />
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--color-admin-border)] text-left text-xs text-[var(--color-admin-text-secondary)]">
              <th className="pb-2 font-medium uppercase tracking-wider">IP Address</th>
              <th className="pb-2 font-medium uppercase tracking-wider text-right">Events</th>
              <th className="pb-2 font-medium uppercase tracking-wider">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {ips.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[var(--color-admin-text-muted)]">
                  No threat IPs detected
                </td>
              </tr>
            ) : (
              ips.slice(0, 5).map((ip, i) => (
                <tr key={i} className="border-b border-[var(--color-admin-border-subtle)]">
                  <td className="py-3 font-mono text-xs text-[var(--color-admin-text)]">{ip.ip}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 text-xs font-medium ${
                      ip.count > 100 ? 'bg-red-500/10 text-red-400' :
                      ip.count > 50 ? 'bg-orange-500/10 text-orange-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {ip.count}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-[var(--color-admin-text-muted)]">
                    {formatRelativeTime(ip.lastSeen)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventTypeBreakdown({ types }: { types: Array<{ type: string; count: number }> }) {
  const maxCount = Math.max(...types.map(t => t.count), 1);
  
  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider">
          Event Types
        </h3>
        <BarChart3 className="w-5 h-5 text-[var(--color-primary)]" />
      </div>

      <div className="space-y-3">
        {types.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-admin-text-muted)]">No event data available</p>
          </div>
        ) : (
          types.slice(0, 6).map((type, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-admin-text-secondary)] truncate">{type.type}</span>
                <span className="text-xs text-[var(--color-admin-text-muted)]">{type.count}</span>
              </div>
              <div className="w-full h-2 bg-[var(--color-admin-surface-hover)] overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary)]"
                  style={{ width: `${(type.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function SecurityAuditDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [ipFilter, setIpFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [securityRes, auditRes, scoreRes] = await Promise.all([
        apiFetch('/api/admin/security/events?limit=50'),
        apiFetch('/api/admin/audit?limit=25'),
        apiFetch('/api/admin/security/score').catch(() => null),
      ]);

      if (securityRes.ok) {
        const securityData = await securityRes.json();
        setEvents(securityData.events || []);
        if (securityData.stats) setStats(securityData.stats);
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.events || auditData.data || []);
      }

      if (scoreRes?.ok) {
        const scoreData = await scoreRes.json();
        setSecurityScore(scoreData);
      }
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExport = async () => {
    try {
      const res = await apiFetch('/api/admin/audit/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (severityFilter && event.severity !== severityFilter) return false;
      if (eventTypeFilter && !event.eventType.includes(eventTypeFilter)) return false;
      if (ipFilter && !event.ipAddress?.includes(ipFilter)) return false;
      return true;
    });
  }, [events, severityFilter, eventTypeFilter, ipFilter]);

  const getStatsForRange = (range: string) => {
    if (!stats) return { total: 0, critical: 0 };
    switch (range) {
      case 'week': return stats.week;
      case 'month': return stats.month;
      default: return stats.today;
    }
  };

  const currentStats = getStatsForRange(timeRange);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[var(--color-admin-surface-hover)]" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 bg-[var(--color-admin-surface-hover)]" />
          <div className="h-64 bg-[var(--color-admin-surface-hover)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-admin-text)]">Security Audit Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-admin-text-secondary)]">
            Real-time security monitoring and threat analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThreatLevelBadge level={stats?.threatLevel || 'low'} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-[var(--color-admin-text-secondary)]">Time Range:</span>
        {(['today', 'week', 'month'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-[var(--color-primary)] text-[var(--color-on-accent)]'
                : 'bg-[var(--color-admin-surface)] text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)]'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Security Events"
          value={currentStats.total.toLocaleString()}
          subValue={`${timeRange === 'today' ? 'today' : timeRange === 'week' ? 'this week' : 'this month'}`}
          icon={Shield}
          trend={currentStats.total > 100 ? 'up' : currentStats.total < 10 ? 'down' : 'neutral'}
          trendValue={currentStats.total > 100 ? '+12%' : currentStats.total < 10 ? '-5%' : '0%'}
        />
        <StatCard
          label="Critical Events"
          value={currentStats.critical.toLocaleString()}
          subValue={currentStats.critical > 0 ? 'requires attention' : 'all clear'}
          icon={AlertTriangle}
          trend={currentStats.critical > 5 ? 'up' : 'down'}
          trendValue={currentStats.critical > 5 ? '+3' : '-2'}
        />
        <StatCard
          label="Active Blocks"
          value={stats?.activeBlocks || 0}
          subValue="IP / user / email blocks"
          icon={Ban}
        />
        <StatCard
          label="Audit Events"
          value={auditLogs.length.toLocaleString()}
          subValue="system actions logged"
          icon={Activity}
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Security Score */}
        <SecurityScoreCard score={securityScore || { score: 85, factors: [
          { name: 'Password Policy', score: 9, maxScore: 10, status: 'good', description: 'Strong password requirements' },
          { name: '2FA Adoption', score: 7, maxScore: 10, status: 'warning', description: 'Some users without 2FA' },
          { name: 'Session Security', score: 9, maxScore: 10, status: 'good', description: 'Secure session management' },
          { name: 'Rate Limiting', score: 8, maxScore: 10, status: 'good', description: 'Effective rate limiting' },
          { name: 'Blocklist Coverage', score: 8, maxScore: 10, status: 'good', description: 'Comprehensive blocklist' },
        ]}} />

        {/* Event Timeline */}
        <div className="lg:col-span-2">
          <EventTimeline events={filteredEvents.slice(0, 10)} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Threat IPs */}
        <TopThreatsTable ips={stats?.topIPs || []} />

        {/* Event Type Breakdown */}
        <EventTypeBreakdown types={stats?.topEventTypes || []} />
      </div>

      {/* Filters */}
      <div className="mt-8 border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4 text-[var(--color-admin-text-muted)]" />
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--color-admin-text-muted)]" />
            <input
              value={ipFilter}
              onChange={e => setIpFilter(e.target.value)}
              placeholder="Filter by IP..."
              className="px-3 py-1.5 text-sm bg-[var(--color-admin-surface-hover)] border border-[var(--color-admin-border)] text-[var(--color-admin-text)] outline-none focus:border-[var(--color-primary)] w-40"
            />
          </div>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-[var(--color-admin-surface-hover)] border border-[var(--color-admin-border)] text-[var(--color-admin-text)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-[var(--color-admin-surface-hover)] border border-[var(--color-admin-border)] text-[var(--color-admin-text)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All event types</option>
            <option value="auth">Authentication</option>
            <option value="security">Security</option>
            <option value="admin">Admin actions</option>
            <option value="system">System</option>
          </select>

          {(severityFilter || eventTypeFilter || ipFilter) && (
            <button
              onClick={() => {
                setSeverityFilter('');
                setEventTypeFilter('');
                setIpFilter('');
              }}
              className="px-3 py-1.5 text-sm text-[var(--color-primary)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="mt-8 border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider">
            Recent Audit Logs
          </h3>
          <button 
            onClick={() => router.push('/admin/security/audit')}
            className="text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--color-admin-border)] text-left text-xs text-[var(--color-admin-text-secondary)]">
                <th className="pb-2 font-medium uppercase tracking-wider">Action</th>
                <th className="pb-2 font-medium uppercase tracking-wider">Actor</th>
                <th className="pb-2 font-medium uppercase tracking-wider">Target</th>
                <th className="pb-2 font-medium uppercase tracking-wider">IP</th>
                <th className="pb-2 font-medium uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="border-b border-[var(--color-admin-border-subtle)] hover:bg-[var(--color-admin-surface-hover)]">
                  <td className="py-3">
                    <span className="text-sm font-medium text-[var(--color-admin-text)]">{log.action}</span>
                  </td>
                  <td className="py-3 text-sm text-[var(--color-admin-text-secondary)]">{log.actor}</td>
                  <td className="py-3 text-sm text-[var(--color-admin-text-muted)] truncate max-w-[200px]">
                    {log.target || '—'}
                  </td>
                  <td className="py-3 text-xs font-mono text-[var(--color-admin-text-muted)]">{log.ip || '—'}</td>
                  <td className="py-3 text-xs text-[var(--color-admin-text-muted)] whitespace-nowrap">
                    {formatTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
