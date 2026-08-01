'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib';
import { Search, Filter, Eye, MessageSquare, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  rayId?: string;
  email?: string;
  createdAt: string;
  user?: { email: string; name: string };
  replies: any[];
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await apiFetch(`/api/admin/support/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {}
    setLoading(false);
  };

  const filtered = tickets.filter(t => {
    if (search) {
      const s = search.toLowerCase();
      return t.subject.toLowerCase().includes(s) || t.message.toLowerCase().includes(s) || t.user?.email?.toLowerCase().includes(s);
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
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
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">Support Tickets</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage user support requests and captcha appeals</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); loadTickets(); }}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); loadTickets(); }}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]">
            <option value="all">All Categories</option>
            <option value="captcha_block">CAPTCHA Block</option>
            <option value="access">Access</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="general">General</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">No tickets found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Ray ID</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-text)] line-clamp-1">{ticket.subject}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)] line-clamp-1">{ticket.message}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {ticket.user ? ticket.user.email : ticket.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {ticket.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                    {ticket.rayId?.slice(0, 16) || '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/admin/support/tickets/${ticket.id}`)}
                      className="text-[var(--color-primary)] hover:underline text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
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
