'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';

interface AuditEvent {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  severity: string | null;
  createdAt: string;
  actor?: {
    email: string;
    name: string;
  } | null;
}

interface AuditResponse {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'MAINTENANCE_MODE_ENABLED': { label: 'Enabled (Manual)', color: 'text-amber-500' },
  'MAINTENANCE_MODE_DISABLED': { label: 'Disabled (Manual)', color: 'text-green-500' },
  'MAINTENANCE_SCHEDULED': { label: 'Scheduled', color: 'text-blue-500' },
  'MAINTENANCE_SCHEDULE_CANCELLED': { label: 'Schedule Cancelled', color: 'text-gray-500' },
  'MAINTENANCE_MODE_ENABLED_AUTO': { label: 'Enabled (Auto)', color: 'text-amber-500' },
  'MAINTENANCE_MODE_DISABLED_AUTO': { label: 'Disabled (Auto)', color: 'text-green-500' },
  'MAINTENANCE_MODE_CHANGED': { label: 'Configuration Changed', color: 'text-purple-500' },
};

export default function MaintenanceHistoryPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<string>('all');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
        targetType: 'maintenance',
      });
      
      if (filter !== 'all') {
        params.set('action', filter);
      }

      const res = await apiFetch(`/api/admin/audit?${params.toString()}`);
      if (res.ok) {
        const data: AuditResponse = await res.json();
        setEvents(data.events);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatMetadata = (metadata: Record<string, unknown>) => {
    const entries = Object.entries(metadata).filter(([key]) => 
      !key.includes('previousState') && key !== 'reason'
    );
    
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 p-2 rounded bg-[var(--color-surface)] text-xs space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="text-[var(--color-text-secondary)] capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="text-[var(--color-text)] font-mono">
              {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: 'text-[var(--color-text)]' };
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Maintenance History</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            View all maintenance mode changes and schedule modifications
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)]"
        >
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => { setFilter('all'); setPage(0); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
              : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          All Events
        </button>
        <button
          onClick={() => { setFilter('MAINTENANCE_MODE_ENABLED'); setPage(0); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'MAINTENANCE_MODE_ENABLED'
              ? 'bg-amber-500 text-white'
              : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          Enabled
        </button>
        <button
          onClick={() => { setFilter('MAINTENANCE_MODE_DISABLED'); setPage(0); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'MAINTENANCE_MODE_DISABLED'
              ? 'bg-green-500 text-white'
              : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          Disabled
        </button>
        <button
          onClick={() => { setFilter('MAINTENANCE_SCHEDULED'); setPage(0); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'MAINTENANCE_SCHEDULED'
              ? 'bg-blue-500 text-white'
              : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          Scheduled
        </button>
        <button
          onClick={() => { setFilter('MAINTENANCE_MODE_ENABLED_AUTO'); setPage(0); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'MAINTENANCE_MODE_ENABLED_AUTO'
              ? 'bg-amber-500 text-white'
              : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          Auto-Enabled
        </button>
        <button
          onClick={() => { setFilter('MAINTENANCE_MODE_DISABLED_AUTO'); setPage(0); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'MAINTENANCE_MODE_DISABLED_AUTO'
              ? 'bg-green-500 text-white'
              : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          Auto-Disabled
        </button>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="py-12 text-center text-[var(--color-text-secondary)]">
          Loading...
        </div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center border border-[var(--color-border)] rounded-lg">
          <p className="text-[var(--color-text-secondary)]">No maintenance events found</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Events will appear here when maintenance mode is enabled, disabled, or scheduled
          </p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Actor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {events.map((event) => {
                const actionInfo = getActionInfo(event.action);
                return (
                  <tr key={event.id} className="hover:bg-[var(--color-surface-hover)]">
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatTime(event.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                      {event.actor?.email || 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {formatMetadata(event.metadata)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} events
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">Event Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-amber-500">●</span>
            <span className="text-[var(--color-text-secondary)] ml-2">Enabled (Manual/Auto)</span>
          </div>
          <div>
            <span className="text-green-500">●</span>
            <span className="text-[var(--color-text-secondary)] ml-2">Disabled (Manual/Auto)</span>
          </div>
          <div>
            <span className="text-blue-500">●</span>
            <span className="text-[var(--color-text-secondary)] ml-2">Scheduled</span>
          </div>
          <div>
            <span className="text-gray-500">●</span>
            <span className="text-[var(--color-text-secondary)] ml-2">Schedule Cancelled</span>
          </div>
          <div>
            <span className="text-purple-500">●</span>
            <span className="text-[var(--color-text-secondary)] ml-2">Configuration Changed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
