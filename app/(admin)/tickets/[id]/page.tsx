'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib';
import {
  ArrowLeft, Loader2, Send, AlertCircle, Clock, CheckCircle2,
  User, MessageSquare, Settings, UserPlus,
} from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string };
  assigned?: { id: string; name: string };
  messages: any[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTicket();
    loadUsers();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const loadTicket = async () => {
    try {
      const res = await apiFetch(`/api/admin/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } catch {}
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const res = await apiFetch('/api/admin/users?limit=100');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {}
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, priority: ticket.priority }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket({ ...ticket, status: updated.status });
      }
    } catch {}
    setUpdating(false);
  };

  const handleAssign = async (userId: string) => {
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedId: userId, status: ticket?.status, priority: ticket?.priority }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket(t => t ? { ...t, assigned: updated.assigned } : t);
      }
    } catch {}
    setUpdating(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !ticket) return;
    setSending(true);
    try {
      const res = await apiFetch(`/api/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply.trim(), isInternal }),
      });
      if (res.ok) {
        const msg = await res.json();
        setTicket(t => t ? { ...t, messages: [...t.messages, msg] } : t);
        setReply('');
      }
    } catch {}
    setSending(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-1">Ticket not found</h3>
          <button onClick={() => router.push('/admin/tickets')} className="text-sm text-[var(--color-primary)] hover:underline">Back to tickets</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--color-surface-muted)]">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight truncate">{ticket.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            #{ticket.id} • {ticket.customer.name || ticket.customer.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Status</div>
          <select value={ticket.status} onChange={e => handleStatusChange(e.target.value)} disabled={updating}
            className="text-sm font-medium text-[var(--color-text)] bg-transparent border-none outline-none disabled:opacity-50">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Priority</div>
          <div className="text-sm font-medium text-[var(--color-text)] capitalize flex items-center gap-2">
            {ticket.priority === 'high' && <AlertCircle className="w-4 h-4 text-[var(--color-error)]" />}
            {ticket.priority === 'medium' && <Clock className="w-4 h-4 text-[var(--color-warning)]" />}
            {ticket.priority === 'low' && <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />}
            {ticket.priority}
          </div>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Assigned To</div>
          <select value={ticket.assigned?.id || ''} onChange={e => handleAssign(e.target.value)} disabled={updating}
            className="text-sm font-medium text-[var(--color-text)] bg-transparent border-none outline-none disabled:opacity-50">
            <option value="">Unassigned</option>
            {users.filter(u => u.id !== ticket.customer.id).map(u => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden mb-6">
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] font-medium flex-shrink-0">
              {ticket.customer.name?.charAt(0)?.toUpperCase() || ticket.customer.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[var(--color-text)]">{ticket.customer.name || ticket.customer.email}</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">Conversation</h2>
          <div className="space-y-4 mb-6">
            {ticket.messages?.length === 0 ? (
              <p className="text-sm text-[var(--color-text-tertiary)] text-center py-8">No messages yet</p>
            ) : (
              ticket.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isInternal ? 'bg-[var(--color-warning-surface)] -mx-2 px-2 py-2 rounded-lg' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center text-[var(--color-text-secondary)] text-xs font-medium flex-shrink-0">
                    {msg.author?.name?.charAt(0)?.toUpperCase() || msg.author?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--color-text)]">{msg.author?.name || msg.author?.email || 'User'}</span>
                      {msg.isInternal && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning)] text-white">Internal</span>}
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleReply} className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                <span className="text-xs text-[var(--color-text-secondary)]">Internal note (not visible to customer)</span>
              </label>
            </div>
            <div className="flex gap-3">
              <input type="text" value={reply} onChange={e => setReply(e.target.value)}
                placeholder={isInternal ? "Add internal note..." : "Reply to customer..."}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e); } }}
              />
              <button type="submit" disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
