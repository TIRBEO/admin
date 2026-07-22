'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { apiFetch } from './lib';

interface SearchResult {
  pages: Array<{ label: string; url: string; category: string }>;
  users: Array<{ id: string; email: string; name: string | null; adminRole: string | null }>;
  routes: Array<{ id: string; path: string; method: string }>;
}

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number>(0);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch { setResults(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setOpen(p => !p); setQuery(''); setResults(null); setSelectedIdx(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => doSearch(query), 150);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  const flatItems = (): Array<{ label: string; url?: string; category: string; action?: () => void }> => {
    const items: Array<{ label: string; url?: string; category: string; action?: () => void }> = [];
    if (!results) return items;
    for (const p of results.pages) items.push({ label: p.label, url: p.url, category: 'Pages' });
    for (const u of results.users) items.push({ label: `${u.name || u.email} (${u.email})`, url: `/users?search=${encodeURIComponent(u.email)}`, category: 'Users' });
    for (const r of results.routes) items.push({ label: `${r.method} ${r.path}`, url: '/routes', category: 'Routes' });
    return items;
  };

  const items = flatItems();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && items[selectedIdx]) {
      const item = items[selectedIdx];
      if (item.url) { window.location.href = item.url; }
      else if (item.action) { item.action(); }
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 560,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }} onKeyDown={handleKeyDown}
            placeholder="Search pages, users, routes…" className="input" style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 16, boxShadow: 'none' }} />
          <kbd style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 4, color: 'var(--text-muted)' }}>ESC</kbd>
        </div>

        {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Searching…</div>}

        {!loading && items.length === 0 && query.trim() && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No results for &ldquo;{query}&rdquo;</div>
        )}

        {items.length > 0 && (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {['Pages', 'Users', 'Routes'].map(cat => {
              const group = items.filter(i => i.category === cat);
              if (group.length === 0) return null;
              return (
                <div key={cat}>
                  <div style={{ padding: '6px 16px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat}</div>
                  {group.map((item, gi) => {
                    const globalIdx = items.indexOf(item);
                    return (
                      <a key={`${cat}-${gi}`} href={item.url || '#'} onClick={() => setOpen(false)}
                        style={{
                          display: 'block', padding: '8px 16px', textDecoration: 'none',
                          background: globalIdx === selectedIdx ? 'var(--accent-subtle)' : 'transparent',
                          borderLeft: globalIdx === selectedIdx ? `2px solid var(--accent)` : '2px solid transparent',
                        }}>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{item.label}</div>
                        {item.url && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.url}</div>}
                      </a>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {!query.trim() && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Type to search across pages, users, and routes
          </div>
        )}
      </div>
    </div>
  );
}
