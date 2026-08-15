'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { Code, RefreshCw, Globe, Server, Clock, CheckCircle, XCircle, Copy, ExternalLink, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Endpoint { method: string; path: string; description: string; rateLimit?: string; auth?: boolean; }

const API_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/admin/me', description: 'Current admin profile', auth: true },
  { method: 'GET', path: '/api/admin/users', description: 'List all users', rateLimit: '100/min', auth: true },
  { method: 'POST', path: '/api/admin/users', description: 'Create a new user', rateLimit: '10/min', auth: true },
  { method: 'GET', path: '/api/admin/roles', description: 'List all roles', rateLimit: '100/min', auth: true },
  { method: 'GET', path: '/api/admin/audit', description: 'Audit log entries', rateLimit: '100/min', auth: true },
  { method: 'GET', path: '/api/admin/activity', description: 'Activity timeline', rateLimit: '100/min', auth: true },
  { method: 'GET', path: '/api/admin/stats', description: 'Platform statistics', rateLimit: '60/min', auth: true },
  { method: 'GET', path: '/api/admin/security/events', description: 'Security events', rateLimit: '100/min', auth: true },
  { method: 'GET', path: '/api/admin/heartbeat', description: 'System health check', auth: false },
  { method: 'GET', path: '/api/admin/maintenance', description: 'Maintenance status', auth: false },
  { method: 'GET', path: '/api/admin/tickets', description: 'Support tickets', rateLimit: '100/min', auth: true },
  { method: 'GET', path: '/api/admin/analytics/overview', description: 'Analytics overview', rateLimit: '60/min', auth: true },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'var(--tb-green)', POST: 'var(--tb-blue)', PUT: 'var(--tb-yellow)', PATCH: 'var(--tb-orange)', DELETE: 'var(--tb-red)',
};

export default function ApiPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = API_ENDPOINTS.filter(e =>
    e.path.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())
  );

  const copyEndpoint = (path: string) => {
    navigator.clipboard.writeText(`http://localhost:3000${path}`);
    setCopied(path);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">API</h1>
            <p className="page-header-description">API endpoints and documentation</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-ghost btn-sm"><ExternalLink size={13} /> API Docs</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Endpoints', value: API_ENDPOINTS.length, icon: Code, color: 'var(--tb-brand)' },
          { label: 'Authenticated', value: API_ENDPOINTS.filter(e => e.auth).length, icon: Server, color: 'var(--tb-green)' },
          { label: 'Public', value: API_ENDPOINTS.filter(e => !e.auth).length, icon: Globe, color: 'var(--tb-yellow)' },
          { label: 'Rate Limited', value: API_ENDPOINTS.filter(e => e.rateLimit).length, icon: Clock, color: 'var(--tb-orange)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><k.icon size={14} style={{ color: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Code size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--tb-text-muted)' }} />
        <input className="input" placeholder="Search endpoints..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      {/* Endpoints Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--tb-border)' }}>
        <table className="dashboard-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
              <th style={{ width: 90 }}>Rate Limit</th>
              <th style={{ width: 70 }}>Auth</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ep => (
              <tr key={ep.path + ep.method}>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: `${METHOD_COLORS[ep.method]}15`, color: METHOD_COLORS[ep.method], fontFamily: 'monospace' }}>
                    {ep.method}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--tb-font-mono, monospace)', fontSize: 12, color: 'var(--tb-text-primary)' }}>{ep.path}</td>
                <td style={{ fontSize: 13, color: 'var(--tb-text-secondary)' }}>{ep.description}</td>
                <td style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>{ep.rateLimit || '—'}</td>
                <td>
                  {ep.auth ? <CheckCircle size={13} style={{ color: 'var(--tb-green)' }} /> : <Globe size={13} style={{ color: 'var(--tb-text-muted)' }} />}
                </td>
                <td>
                  <button className="btn btn-ghost btn-xs" onClick={() => copyEndpoint(ep.path)} title="Copy URL">
                    {copied === ep.path ? <CheckCircle size={12} style={{ color: 'var(--tb-green)' }} /> : <Copy size={12} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
