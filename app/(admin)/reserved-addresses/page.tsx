'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';

type ReservedAddress = {
  id: string;
  address: string;
  reason: string;
  level: string;
  category: string;
  createdAt: string;
};

const CATEGORIES = ['system', 'role', 'branding', 'infrastructure', 'protocol', 'content', 'legal', 'messaging', 'utility', 'custom'];
const LEVELS = ['hard', 'soft'];

const CATEGORY_COLORS: Record<string, string> = {
  system: '#da3633',
  role: '#d29922',
  branding: '#2f81f7',
  infrastructure: '#8b5cf6',
  protocol: '#238636',
  content: '#f78166',
  legal: '#9ca3af',
  messaging: '#56d364',
  utility: '#79c0ff',
  custom: '#d2a8ff',
};

export default function ReservedAddressesPage() {
  const [items, setItems] = useState<ReservedAddress[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newLevel, setNewLevel] = useState('hard');
  const [newCategory, setNewCategory] = useState('custom');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      if (filterCat) params.set('category', filterCat);
      if (filterLevel) params.set('level', filterLevel);
      const res = await apiFetch(`/api/admin/reserved-addresses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [page, search, filterCat, filterLevel]);

  useEffect(() => { load(); }, [load]);

  const addAddress = async () => {
    if (!newAddr.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/reserved-addresses', {
        method: 'POST',
        body: JSON.stringify({ address: newAddr.trim(), reason: newReason || 'Admin reserved', level: newLevel, category: newCategory }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewAddr('');
        setNewReason('');
        load();
      } else {
        const text = await res.text();
        setError(text || 'Failed to add');
      }
    } catch { setError('Network error'); }
    setAdding(false);
  };

  const deleteAddress = async (id: string, addr: string) => {
    if (!confirm(`Remove "${addr}" from reserved list?`)) return;
    try {
      const res = await apiFetch(`/api/admin/reserved-addresses/${id}`, { method: 'DELETE' });
      if (res.ok) load();
    } catch {}
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Reserved Mailbox Addresses</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{total} addresses blocked from user registration</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add Reserved'}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Address</label>
              <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="reserved-name" style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Reason</label>
              <input value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Why reserved?" style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Level</label>
              <select value={newLevel} onChange={e => setNewLevel(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}>
                <option value="hard">Hard (nobody can use)</option>
                <option value="soft">Soft (admin override)</option>
              </select>
            </div>
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{error}</div>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={addAddress} disabled={adding || !newAddr.trim()}>{adding ? 'Adding...' : 'Add'}</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search addresses..."
          style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, minWidth: 200 }}
        />
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }} style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(1); }} style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}>
          <option value="">All levels</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No reserved addresses found</div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Address</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Level</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Reason</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 500 }}>{item.address}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: (CATEGORY_COLORS[item.category] || '#666') + '22', color: CATEGORY_COLORS[item.category] || '#999', border: `1px solid ${(CATEGORY_COLORS[item.category] || '#666')}44` }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: item.level === 'hard' ? 'rgba(218,54,51,0.12)' : 'rgba(210,153,34,0.12)', color: item.level === 'hard' ? 'var(--danger)' : 'var(--warning)' }}>
                      {item.level}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.reason}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    {item.category !== 'system' ? (
                      <button className="btn btn-ghost" style={{ color: 'var(--danger)', fontSize: 12, padding: '4px 8px' }} onClick={() => deleteAddress(item.id, item.address)}>
                        Remove
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>System</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
