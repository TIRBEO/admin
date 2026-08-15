'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import {
  Link, RefreshCw, CheckCircle, XCircle, ExternalLink, Settings,
  Zap, Webhook, Shield, Globe, MessageSquare, GitBranch, Users,
  Plus, Trash2, AlertTriangle, Clock, ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  connected: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: { id: string; email: string; name: string } | null;
  metadata?: Record<string, unknown>;
}

interface ProviderInfo {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category: 'communication' | 'development' | 'productivity' | 'analytics' | 'storage';
  features: string[];
  scopes?: string[];
}

const PROVIDERS: ProviderInfo[] = [
  { name: 'Slack', slug: 'slack', description: 'Team messaging and notifications', icon: '💬', color: '#4A154B', category: 'communication', features: ['Notifications', 'Ticket alerts', 'Security alerts', 'Deployment updates'], scopes: ['channels:read', 'chat:write', 'incoming-webhook'] },
  { name: 'Discord', slug: 'discord', description: 'Community and team chat', icon: '🎮', color: '#5865F2', category: 'communication', features: ['Bot notifications', 'Webhook alerts', 'Role sync'], scopes: ['bot', 'webhook.incoming'] },
  { name: 'GitHub', slug: 'github', description: 'Source code and CI/CD', icon: '🐙', color: '#24292e', category: 'development', features: ['OAuth login', 'Repo sync', 'CI/CD triggers', 'Deploy hooks'], scopes: ['repo', 'read:user', 'admin:org'] },
  { name: 'GitLab', slug: 'gitlab', description: 'DevOps platform integration', icon: '🦊', color: '#FC6D26', category: 'development', features: ['OAuth login', 'Pipeline triggers', 'Issue sync'], scopes: ['api', 'read_user', 'read_repository'] },
  { name: 'Google', slug: 'google', description: 'Google Workspace and OAuth', icon: '🔍', color: '#4285F4', category: 'productivity', features: ['OAuth login', 'Calendar sync', 'Drive integration', 'Analytics'], scopes: ['openid', 'email', 'profile', 'calendar'] },
  { name: 'Jira', slug: 'jira', description: 'Issue tracking and project management', icon: '📋', color: '#0052CC', category: 'productivity', features: ['Issue sync', 'Ticket linking', 'Sprint tracking'], scopes: ['read:jira-work', 'write:jira-work'] },
  { name: 'Notion', slug: 'notion', description: 'Documentation and knowledge base', icon: '📝', color: '#000000', category: 'productivity', features: ['Page sync', 'Database sync', 'Content publishing'], scopes: ['read_content', 'update_content'] },
  { name: 'Linear', slug: 'linear', description: 'Project tracking and issue management', icon: '📐', color: '#5E6AD2', category: 'productivity', features: ['Issue sync', 'Project linking', 'Sprint management'], scopes: ['issues:read', 'issues:write'] },
];

const CATEGORY_LABELS: Record<string, string> = {
  communication: 'Communication',
  development: 'Development',
  productivity: 'Productivity',
  analytics: 'Analytics',
  storage: 'Storage',
};

const CATEGORY_ICONS: Record<string, any> = {
  communication: MessageSquare,
  development: GitBranch,
  productivity: Zap,
  analytics: Globe,
  storage: Shield,
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isConnected = (slug: string) => integrations.some(i => i.provider === slug && i.connected);

  const connectProvider = async (slug: string) => {
    setConnecting(slug);
    try {
      const res = await apiFetch('/api/admin/integrations', {
        method: 'POST',
        body: JSON.stringify({ provider: slug, connected: true }),
      });
      if (res.ok) {
        showToast(`Connected to ${slug}`);
        fetchIntegrations();
      } else {
        showToast(`Failed to connect to ${slug}`, 'error');
      }
    } catch {
      showToast(`Failed to connect to ${slug}`, 'error');
    }
    setConnecting(null);
  };

  const disconnectProvider = async (slug: string) => {
    try {
      const integration = integrations.find(i => i.provider === slug && i.connected);
      if (!integration) return;
      const res = await apiFetch(`/api/admin/integrations/${integration.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Disconnected from ${slug}`);
        fetchIntegrations();
      }
    } catch {
      showToast(`Failed to disconnect`, 'error');
    }
  };

  const categories = [...new Set(PROVIDERS.map(p => p.category))];
  const filtered = categoryFilter === 'all' ? PROVIDERS : PROVIDERS.filter(p => p.category === categoryFilter);
  const connectedCount = PROVIDERS.filter(p => isConnected(p.slug)).length;

  return (
    <div className="page-stack">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200, padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? 'var(--tb-green-soft)' : 'var(--tb-red-soft)',
          color: toast.type === 'success' ? 'var(--tb-green)' : 'var(--tb-red)',
          border: `1px solid ${toast.type === 'success' ? 'var(--tb-green)' : 'var(--tb-red)'}30`,
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 200ms ease both', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Integrations</h1>
            <p className="page-header-description">Connect third-party services and manage webhooks</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={fetchIntegrations}><RefreshCw size={13} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Available', value: PROVIDERS.length, icon: Link, color: 'var(--tb-brand)' },
          { label: 'Connected', value: connectedCount, icon: CheckCircle, color: 'var(--tb-green)' },
          { label: 'Disconnected', value: PROVIDERS.length - connectedCount, icon: XCircle, color: 'var(--tb-text-muted)' },
          { label: 'Categories', value: categories.length, icon: Globe, color: 'var(--tb-purple)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><k.icon size={14} style={{ color: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className={`btn ${categoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setCategoryFilter('all')}>All Providers</button>
        {categories.map(cat => {
          const CatIcon = CATEGORY_ICONS[cat] || Globe;
          return (
            <button key={cat} className={`btn ${categoryFilter === cat ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setCategoryFilter(cat)}>
              <CatIcon size={13} /> {CATEGORY_LABELS[cat] || cat}
            </button>
          );
        })}
      </div>

      {/* Provider Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(provider => {
          const connected = isConnected(provider.slug);
          const isConnectingThis = connecting === provider.slug;
          return (
            <div key={provider.slug} className="card" style={{ cursor: 'pointer', transition: 'border-color 150ms, box-shadow 150ms', borderColor: connected ? 'var(--tb-green)' : undefined }}
              onClick={() => setSelectedProvider(selectedProvider?.slug === provider.slug ? null : provider)}>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${provider.color}15`, border: '1px solid var(--tb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {provider.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{provider.name}</span>
                      <span className={`badge ${connected ? 'badge-green' : 'badge-gray'}`}>
                        {connected ? '● Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 3 }}>{provider.description}</div>
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                  {provider.features.map(f => (
                    <span key={f} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 5, background: 'var(--tb-surface-2)', color: 'var(--tb-text-secondary)', border: '1px solid var(--tb-border)' }}>{f}</span>
                  ))}
                </div>

                {/* Action Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--tb-border)' }}>
                  <span className="badge badge-sm" style={{ background: `${provider.color}12`, color: provider.color }}>{provider.category}</span>
                  {connected ? (
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); disconnectProvider(provider.slug); }}
                      style={{ color: 'var(--tb-red)' }}>
                      <XCircle size={13} /> Disconnect
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-sm" disabled={isConnectingThis}
                      onClick={(e) => { e.stopPropagation(); connectProvider(provider.slug); }}>
                      {isConnectingThis ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail / Configuration Panel */}
      {selectedProvider && (
        <div className="card" style={{ border: '1px solid var(--tb-brand)' }}>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{selectedProvider.icon}</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>{selectedProvider.name} Configuration</h3>
                  <p style={{ fontSize: 12, color: 'var(--tb-text-muted)', margin: 0, marginTop: 2 }}>{isConnected(selectedProvider.slug) ? 'Connected and active' : 'Not connected'}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedProvider(null)}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Settings */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-secondary)', marginBottom: 10 }}>Connection Settings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="form-label">Client ID</label>
                    <input className="input" placeholder={`Enter ${selectedProvider.name} Client ID`} />
                  </div>
                  <div>
                    <label className="form-label">Client Secret</label>
                    <input className="input" type="password" placeholder="••••••••••••" />
                  </div>
                  <div>
                    <label className="form-label">Webhook URL</label>
                    <input className="input" readOnly value={`https://api.tirbeo.app/webhooks/${selectedProvider.slug}`} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                  </div>
                  <div>
                    <label className="form-label">Webhook Secret</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" type="password" placeholder="••••••••••••" style={{ flex: 1 }} />
                      <button className="btn btn-ghost btn-sm">Generate</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-secondary)', marginBottom: 10 }}>Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isConnected(selectedProvider.slug) ? <CheckCircle size={13} style={{ color: 'var(--tb-green)' }} /> : <XCircle size={13} style={{ color: 'var(--tb-text-muted)' }} />}
                      <span style={{ fontSize: 13, color: isConnected(selectedProvider.slug) ? 'var(--tb-green)' : 'var(--tb-text-muted)' }}>
                        {isConnected(selectedProvider.slug) ? 'Active' : 'Not connected'}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Scopes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(selectedProvider.scopes || []).map(s => (
                        <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--tb-brand-soft, var(--tb-surface-2))', color: 'var(--tb-brand, var(--tb-text-secondary))', fontFamily: 'monospace' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Features</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedProvider.features.map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--tb-text-secondary)' }}>
                          <CheckCircle size={11} style={{ color: 'var(--tb-green)' }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--tb-border)' }}>
              <button className="btn btn-primary btn-sm">Save Configuration</button>
              <button className="btn btn-secondary btn-sm"><ExternalLink size={13} /> Open {selectedProvider.name} Settings</button>
              {isConnected(selectedProvider.slug) && (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--tb-red)', marginLeft: 'auto' }} onClick={() => { disconnectProvider(selectedProvider.slug); setSelectedProvider(null); }}>
                  <Trash2 size={13} /> Disconnect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <Link size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No integrations in this category</div>
        </div>
      )}
    </div>
  );
}
