'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../../app/lib';
import { Shield, UserCheck, Search, Clock, AlertTriangle } from 'lucide-react';

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

export default function CaptchaBlocksPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBlocks();
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
      }
    } catch {}
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
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">Blocked Users</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage CAPTCHA blocks and access restrictions</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, Ray ID, email, or reason..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">No blocked users</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Ray ID</th>
                <th className="px-4 py-3 font-medium">Blocked At</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((block) => (
                <tr key={block.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    {block.user ? (
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{block.user.name}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{block.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-[var(--color-text-secondary)]">Anonymous</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--color-text-secondary)]">
                    {block.ipAddress}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3" />
                      {block.reason.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                    {block.rayId.slice(0, 16)}...
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {new Date(block.blockedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleUnblock(block.rayId)}
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
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
