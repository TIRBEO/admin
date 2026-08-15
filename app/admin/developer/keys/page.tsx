'use client';
import { useState } from 'react';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, CheckCircle, Shield, Clock } from 'lucide-react';

interface ApiKey { id: string; name: string; key: string; scopes: string[]; createdAt: string; lastUsed?: string; expiresAt?: string; }

const MOCK_KEYS: ApiKey[] = [
  { id: '1', name: 'Dashboard App', key: 'tb_live_***k4x2', scopes: ['read:users', 'read:analytics', 'read:tickets'], createdAt: '2026-07-10', lastUsed: '2 hours ago', expiresAt: '2027-01-10' },
  { id: '2', name: 'Flows Integration', key: 'tb_live_***m8p1', scopes: ['read:forms', 'write:submissions', 'read:webhooks'], createdAt: '2026-08-01', lastUsed: '5 minutes ago' },
  { id: '3', name: 'CI/CD Pipeline', key: 'tb_live_***j9r3', scopes: ['read:config', 'write:config', 'read:deployments'], createdAt: '2026-06-15', lastUsed: '1 day ago', expiresAt: '2026-12-15' },
];

const AVAILABLE_SCOPES = ['read:users', 'write:users', 'read:analytics', 'read:tickets', 'write:tickets', 'read:forms', 'write:submissions', 'read:webhooks', 'write:webhooks', 'read:config', 'write:config', 'read:deployments', 'admin'];

export default function KeysPage() {
  const [keys] = useState<ApiKey[]>(MOCK_KEYS);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">API Keys</h1>
            <p className="page-header-description">Manage API keys for external integrations</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(!showNew)}><Plus size={13} /> Generate Key</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Keys', value: keys.length, color: 'var(--tb-brand)' },
          { label: 'Active', value: keys.length, color: 'var(--tb-green)' },
          { label: 'Expiring Soon', value: keys.filter(k => k.expiresAt).length, color: 'var(--tb-yellow)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><div style={{ width: 7, height: 7, borderRadius: '50%', background: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="card" style={{ border: '1px solid var(--tb-brand)' }}>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Generate API Key</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Key Name</label>
              <input className="input" placeholder="e.g. My Integration" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Permissions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {AVAILABLE_SCOPES.map(s => (
                  <button key={s} type="button"
                    className={`btn ${newScopes.includes(s) ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    onClick={() => setNewScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" disabled={!newName || newScopes.length === 0}><Key size={13} /> Generate</button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="empty-state">
          <Key size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No API keys</div>
          <div className="empty-state-desc">Generate an API key to authenticate external requests</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {keys.map(k => (
            <div key={k.id} className="card">
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--tb-surface-2)', border: '1px solid var(--tb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Key size={16} style={{ color: 'var(--tb-text-icon-muted)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{k.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <code style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--tb-text-secondary)', padding: '3px 8px', borderRadius: 5, background: 'var(--tb-surface-2)' }}>
                        {revealed.has(k.id) ? k.key.replace('***', 'abc123def456') : k.key}
                      </code>
                      <button className="btn btn-ghost btn-xs" onClick={() => toggleReveal(k.id)}>
                        {revealed.has(k.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button className="btn btn-ghost btn-xs" onClick={() => navigator.clipboard.writeText(k.key)}>
                        <Copy size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {k.scopes.map(s => (
                        <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--tb-brand-soft, var(--tb-surface-2))', color: 'var(--tb-brand, var(--tb-text-secondary))', fontFamily: 'monospace' }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--tb-text-muted)' }}>
                      <span><Clock size={11} style={{ verticalAlign: -1 }} /> Created {k.createdAt}</span>
                      {k.lastUsed && <span>Last used {k.lastUsed}</span>}
                      {k.expiresAt && <span style={{ color: 'var(--tb-yellow)' }}>Expires {k.expiresAt}</span>}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-xs" title="Delete"><Trash2 size={13} style={{ color: 'var(--tb-red)' }} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
