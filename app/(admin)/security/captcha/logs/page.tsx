'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../../app/lib';
import { FileText, Search, Filter } from 'lucide-react';

interface CaptchaLog {
  id: string;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  eventType: string;
  difficulty?: string;
  rayId?: string;
  metadata?: any;
  createdAt: string;
}

export default function CaptchaLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<CaptchaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (eventTypeFilter !== 'all') params.set('eventType', eventTypeFilter);
      const res = await apiFetch(`/api/captcha/admin/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {}
    setLoading(false);
  };

  const filtered = logs.filter(log => {
    if (eventTypeFilter !== 'all' && log.eventType !== eventTypeFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        log.ipAddress.includes(searchLower) ||
        log.rayId?.includes(searchLower) ||
        log.userId?.includes(searchLower) ||
        log.eventType.includes(searchLower)
      );
    }
    return true;
  });

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'unblocked': return 'bg-green-100 text-green-800';
      case 'attempt_failed': return 'bg-yellow-100 text-yellow-800';
      case 'challenge_shown': return 'bg-blue-100 text-blue-800';
      case 'challenge_solved': return 'bg-green-100 text-green-800';
      case 'settings_changed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">CAPTCHA Logs</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">View all CAPTCHA events and user interactions</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
              placeholder="Search by IP, Ray ID, User ID..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="all">All events</option>
            <option value="challenge_shown">Challenge Shown</option>
            <option value="attempt_failed">Failed Attempt</option>
            <option value="challenge_solved">Solved</option>
            <option value="blocked">Blocked</option>
            <option value="unblocked">Unblocked</option>
            <option value="settings_changed">Settings Changed</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">User/Session</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium">Ray ID</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEventColor(log.eventType)}`}>
                        {log.eventType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {log.userId || log.sessionId.slice(0, 16) || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--color-text-secondary)]">
                      {log.ipAddress}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                      {log.rayId?.slice(0, 16) || '—'}...
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
