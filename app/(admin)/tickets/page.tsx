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
      const res = await apiFetch(`/api/admin/tickets?${params.toString()}`);
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
      case 'pending': return 'text-[var(--color-warning)] bg-[var(--color-warning-surface)]';
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
      <div className="relative mb-6 overflow-hidden">
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-56 w-[42rem] rounded-full bg-white/[0.05] blur-3xl" />
        <div className="relative">
          <h1 className="text-[28px] font-semibold leading-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Support Tickets</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-surface)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />{tickets.filter(t => t.status === 'open').length} open
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[var(--color-warning)] bg-[var(--color-warning-surface)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />{tickets.filter(t => t.status === 'pending' || t.status === 'in_progress').length} pending
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[var(--color-success)] bg-[var(--color-success-surface)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />{tickets.filter(t => t.status === 'resolved').length} resolved
            </span>
          </div>
        </div>
      </div>

      <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTickets()}
              placeholder="Search tickets by title, description, or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); loadTickets(); }}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); loadTickets(); }}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]">
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-[var(--color-surface-muted)] animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-tertiary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">No tickets found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)] bg-[var(--color-surface-muted)]/50">
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
                <tr key={ticket.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ticket.priority)}
                      <span className="font-medium text-[var(--color-text)]">{ticket.subject}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {ticket.customer?.email || ticket.email || '—'}
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
                    {ticket._count?.messages || ticket.messages?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
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
