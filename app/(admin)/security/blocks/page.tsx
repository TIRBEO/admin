'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../../app/lib';
import { Ban, Search, Plus, Globe, User as UserIcon, Mail, Trash2, Clock } from 'lucide-react';

interface BlockItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  users?: { email: string; name: string } | null;
}

const TYPE_META: Record<string, { label: string; icon: any; tone: string }> = {
  ip: { label: 'IP address', icon: Globe, tone: '#1A73E8' },
  user: { label: 'User', icon: UserIcon, tone: '#B06000' },
  email: { label: 'Email', icon: Mail, tone: '#188038' },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SecurityBlocksPage() {
  const [items, setItems] = useState<BlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [targetType, setTargetType] = useState<'ip' | 'user' | 'email'>('ip');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [hours, setHours] = useState('24');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50', activeOnly: 'true' });
      if (search) params.set('q', search);
      const res = await apiFetch(`/api/admin/security/blocks?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const createBlock = async () => {
    if (!targetId.trim()) { setMsg({ type: 'error', text: 'Target ID is required' }); return; }
    const res = await apiFetch('/api/admin/security/blocks', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId: targetId.trim(), reason: reason.trim(), hours: hours ? Number(hours) : undefined }),
    });
    if (res.ok) {
      setMsg({ type: 'success', text: 'Block added' });
      setShowForm(false); setTargetId(''); setReason('');
      load();
    } else {
      const text = await res.text();
      setMsg({ type: 'error', text: text || 'Failed to add block' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const removeBlock = async (item: BlockItem) => {
    if (!confirm(`Unblock ${item.targetId}?`)) return;
    const res = await apiFetch(`/api/admin/security/blocks/${item.targetType}/${encodeURIComponent(item.targetId)}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#202124]">Blocked targets</h1>
          <p className="text-sm text-[#5F6368] mt-0.5">Block or unblock IPs, users, and emails across the platform</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1765CC] transition-colors">
          <Plus className="w-4 h-4" /> New block
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-[#E6F4EA] text-[#188038]' : 'bg-[#FDECEA] text-[#D93025]'}`}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-[#DADCE0] p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <select value={targetType} onChange={e => setTargetType(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-[#DADCE0] text-sm outline-none">
              <option value="ip">IP address</option>
              <option value="user">User ID</option>
              <option value="email">Email</option>
            </select>
            <input value={targetId} onChange={e => setTargetId(e.target.value)} placeholder={targetType === 'ip' ? 'e.g. 203.0.113.7' : targetType === 'email' ? 'user@example.com' : 'user UUID'}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-[#DADCE0] text-sm outline-none focus:border-[#1A73E8]" />
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)"
              className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-[#DADCE0] text-sm outline-none focus:border-[#1A73E8]" />
            <select value={hours} onChange={e => setHours(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#DADCE0] text-sm outline-none">
              <option value="1">1 hour</option>
              <option value="24">24 hours</option>
              <option value="72">3 days</option>
              <option value="168">7 days</option>
              <option value="">Permanent</option>
            </select>
            <button onClick={createBlock} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1765CC]">Add block</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#DADCE0] p-3 flex items-center gap-2 bg-[#F1F3F4] max-w-md">
        <Search className="w-4 h-4 text-[#5F6368] ml-1" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search target ID or reason..."
          className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[#80868B]" />
      </div>

      <div className="bg-white rounded-xl border border-[#DADCE0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DADCE0] text-left text-xs text-[#5F6368]">
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[#80868B]">Loading blocks...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[#80868B]">No active blocks</td></tr>
            ) : items.map(item => {
              const meta = TYPE_META[item.targetType] || TYPE_META.ip;
              const Icon = meta.icon;
              return (
                <tr key={item.id} className="border-b border-[#DADCE0]/60 hover:bg-[#F8F9FA]">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#F1F3F4] text-xs font-medium text-[#5F6368]">
                      <Icon className="w-3 h-3" style={{ color: meta.tone }} /> {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#202124]">{item.targetId}</td>
                  <td className="px-4 py-3 text-[#5F6368]">{item.reason || '—'}</td>
                  <td className="px-4 py-3">
                    {item.expiresAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#B06000]">
                        <Clock className="w-3 h-3" /> {formatTime(item.expiresAt)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#D93025] font-medium">Permanent</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5F6368] whitespace-nowrap">{formatTime(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeBlock(item)} title="Unblock"
                      className="p-1.5 rounded-lg text-[#D93025] hover:bg-[#FDECEA] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#DADCE0]">
            <span className="text-xs text-[#80868B]">{total} active blocks</span>
            <div className="flex items-center gap-3">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-sm text-[#5F6368] disabled:opacity-40">Previous</button>
              <span className="text-sm text-[#5F6368]">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-sm text-[#5F6368] disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
