'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib';
import {
  MessageSquare, Search, ChevronRight, AlertCircle, Clock, CheckCircle2,
  Loader2, Filter,
} from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  user?: { email: string; name: string };
  replies: any[];
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      const res = await apiFetch(`/api/admin/support/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {}
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-[var(--color-primary)] bg-[var(--color-primary-surface)]';
      case 'in_progress': return 'text-[var(--color-warning)] bg-[var(--color-warning-surface)]';
      case 'resolved': return 'text-[var(--color-success)] bg-[var(--color-success-surface)]';
      case 'closed': return 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-muted)]';
      default: return 'text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)]';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-[var(--color-error)]" />;
      case 'medium': return <Clock className="w-4 h-4 text-[var(--color-warning)]" />;
      case 'low': return <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />;
      default: return <MessageSquare className="w-4 h-4 text-[var(--color-text-tertiary)]" />;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">Support Tickets</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage and resolve customer support requests</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTickets()}
              placeholder="Search tickets by title, description, or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); loadTickets(); }}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); loadTickets(); }}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]">
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">No tickets found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium text-right">Messages</th>
                <th className="px-4 py-3 font-medium text-right">Updated</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: any) => (
                <tr key={ticket.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ticket.priority)}
                      <span className="font-medium text-[var(--color-text)]">{ticket.subject}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {ticket.user?.email || ticket.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(ticket.status))}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] capitalize">
                    {ticket.priority}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                    {ticket.replies?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => router.push(`/admin/support/tickets/${ticket.id}`)}
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                      Manage <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
