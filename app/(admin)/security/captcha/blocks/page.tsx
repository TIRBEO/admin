'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../../app/lib';
import { Shield, UserCheck, Search, Clock, AlertTriangle, Download, Trash2, CheckSquare, Square, Flag, Inbox } from 'lucide-react';

interface Block {
  id: string;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string;
  unblockedAt?: string;
  rayId: string;
  user?: { email: string; name: string };
}

interface Appeal {
  id: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  application?: string;
  createdAt: string;
  customer?: { email: string; name?: string };
}

export default function CaptchaBlocksPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);

  useEffect(() => {
    loadBlocks();
    loadAppeals();
  }, []);

  const loadBlocks = async () => {
    try {
      const res = await apiFetch('/api/captcha/admin/blocks');
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.blocks || []);
      }
    } catch {}
    setLoading(false);
  };

  const loadAppeals = async () => {
    try {
      const res = await apiFetch('/api/support/tickets/appeals');
      if (res.ok) {
        const data = await res.json();
        setAppeals(data.appeals || []);
      }
    } catch {}
  };

  const handleAppealUnblock = async (appeal: Appeal) => {
    const rayId = (appeal.description || '').match(/Ray ID:\s*([\w-]+)/i)?.[1];
    if (!rayId) {
      alert('No Ray ID found in this appeal. Open the ticket to resolve manually.');
      return;
    }
    if (!confirm(`Unblock Ray ID ${rayId} and close appeal "${appeal.subject}"?`)) return;
    setAppealLoading(true);
    try {
      const res = await apiFetch(`/api/support/tickets/appeals/${encodeURIComponent(rayId)}/unblock`, {
        method: 'POST',
      });
      if (res.ok) {
        alert(`Ray ID ${rayId} unblocked.`);
        loadBlocks();
        loadAppeals();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to unblock: ${data.error || 'unknown error'}`);
      }
    } catch {
      alert('Failed to unblock');
    }
    setAppealLoading(false);
  };

  const handleUnblock = async (rayId: string) => {
    if (!confirm('Are you sure you want to unblock this user?')) return;
    try {
      const res = await apiFetch('/api/captcha/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rayId, action: 'unblock' }),
      });
      if (res.ok) {
        setBlocks(blocks.filter(b => b.rayId !== rayId));
        setSelected(prev => {
          const next = new Set(prev);
          next.delete(rayId);
          return next;
        });
      }
    } catch {}
  };

  const handleBulkUnblock = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to unblock ${selected.size} user(s)?`)) return;
    
    setBulkLoading(true);
    try {
      const res = await apiFetch('/api/captcha/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rayIds: Array.from(selected), action: 'bulk_unblock' }),
      });
      if (res.ok) {
        setBlocks(blocks.filter(b => !selected.has(b.rayId)));
        setSelected(new Set());
      }
    } catch {}
    setBulkLoading(false);
  };

  const handleFlagForm = async () => {
    const formId = (window.prompt('Form ID or public ID to flag:' ) || '').trim();
    if (!formId) return;
    const reason = (window.prompt('Reason (e.g. suspicious_activity):') || 'suspicious_activity').trim();
    setFlagLoading(true);
    try {
      const res = await apiFetch('/api/captcha/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flag', formId, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(`Form flagged. The owner has been emailed. Ray ID: ${data.block?.rayId || data.rayId || 'generated'}`);
        loadBlocks();
      } else {
        alert(`Failed to flag form: ${data.error || 'unknown error'}`);
      }
    } catch {
      alert('Failed to flag form');
    }
    setFlagLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiFetch('/api/captcha/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `captcha-blocks-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {}
    setExporting(false);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(b => b.rayId)));
    }
  };

  const toggleSelect = (rayId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(rayId)) {
        next.delete(rayId);
      } else {
        next.add(rayId);
      }
      return next;
    });
  };

  const filtered = blocks.filter(b =>
    b.ipAddress.includes(search) ||
    b.rayId.includes(search) ||
    b.user?.email?.includes(search) ||
    b.reason.includes(search)
  );

  if (loading) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text)] leading-tight">Blocked Users</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage CAPTCHA blocks and access restrictions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFlagForm}
            disabled={flagLoading}
            className="btn-secondary"
            title="Flag a form by ID and email its owner"
          >
            <Flag className="w-4 h-4" />
            {flagLoading ? 'Flagging...' : 'Flag form'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          {selected.size > 0 && (
            <button
              onClick={handleBulkUnblock}
              disabled={bulkLoading}
              className="btn-primary"
            >
              <Trash2 className="w-4 h-4" />
              {bulkLoading ? 'Unblocking...' : `Unblock ${selected.size} selected`}
            </button>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Owner Appeals ({appeals.length})</h2>
          </div>
          <button onClick={loadAppeals} className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
            Refresh
          </button>
        </div>
        {appeals.length === 0 ? (
          <div className="p-6 text-center text-[var(--text-secondary)] text-sm">No open appeals</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Owner</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((a) => (
                <tr key={a.id}>
                  <td className="text-[var(--text)] font-medium">{a.subject}</td>
                  <td className="text-[var(--text-secondary)]">{a.customer?.email || '—'}</td>
                  <td>
                    <span className={`badge ${a.priority === 'high' ? 'badge-error' : a.priority === 'low' ? 'badge-muted' : 'badge-warning'}`}>
                      {a.priority}
                    </span>
                  </td>
                  <td className="text-[var(--text-secondary)]">{new Date(a.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPPORT_URL || 'http://localhost:3003'}/tickets/${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleAppealUnblock(a)}
                        disabled={appealLoading}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-success, var(--success))] hover:underline disabled:opacity-50"
                      >
                        <UserCheck className="w-3 h-3" />
                        Unblock
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, Ray ID, email, or reason..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-secondary)]">No blocked users</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <button onClick={toggleSelectAll} className="p-1 hover:bg-[var(--surface)] rounded">
                    {selected.size === filtered.length && filtered.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                    ) : (
                      <Square className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </button>
                </th>
                <th>User</th>
                <th>IP Address</th>
                <th>Reason</th>
                <th>Ray ID</th>
                <th>Blocked At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((block) => (
                <tr key={block.id} className={selected.has(block.rayId) ? 'bg-[var(--primary-surface)]' : ''}>
                  <td>
                    <button onClick={() => toggleSelect(block.rayId)} className="p-1 hover:bg-[var(--surface)] rounded">
                      {selected.has(block.rayId) ? (
                        <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                      ) : (
                        <Square className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </td>
                  <td>
                    {block.user ? (
                      <div>
                        <p className="font-medium text-[var(--text)]">{block.user.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{block.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-[var(--text-secondary)]">Anonymous</span>
                    )}
                  </td>
                  <td className="font-mono text-[var(--text-secondary)]">
                    {block.ipAddress}
                  </td>
                  <td>
                    <span className="badge badge-error">
                      <AlertTriangle className="w-3 h-3" />
                      {block.reason.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">
                    {block.rayId.slice(0, 16)}...
                  </td>
                  <td className="text-[var(--text-secondary)]">
                    {new Date(block.blockedAt).toLocaleString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleUnblock(block.rayId)}
                      className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    >
                      <UserCheck className="w-3 h-3" />
                      Unblock
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
