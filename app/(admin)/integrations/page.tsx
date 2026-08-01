'use client';

import { useEffect, useState } from 'react';
import { AdminSection, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { Puzzle, Plus, ExternalLink, Check, X, RefreshCw } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  status: string;
  enabled?: boolean;
  lastSyncAt?: string;
  icon?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    apiFetch('/api/admin/integrations').then(async r => {
      if (r.ok) { const d = await r.json(); setIntegrations(d.integrations || d.data || d || []); }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const tabs = [
    { id: 'all', label: 'All Integrations' },
    { id: 'active', label: 'Active' },
    { id: 'available', label: 'Available' },
  ];

  const filtered = activeTab === 'all' ? integrations
    : activeTab === 'active' ? integrations.filter(i => i.enabled || i.status === 'active')
    : integrations;

  const availableIntegrations = [
    { name: 'Slack', description: 'Send notifications and alerts to Slack channels', provider: 'slack', icon: 'S' },
    { name: 'GitHub', description: 'Link repositories and track deployments', provider: 'github', icon: 'G' },
    { name: 'Discord', description: 'Webhook notifications to Discord servers', provider: 'discord', icon: 'D' },
    { name: 'Google Workspace', description: 'Sync users and groups with Google Directory', provider: 'google', icon: 'G' },
    { name: 'Microsoft 365', description: 'Directory sync with Azure AD / Entra ID', provider: 'microsoft', icon: 'M' },
    { name: 'Datadog', description: 'Send metrics and logs to Datadog', provider: 'datadog', icon: 'D' },
    { name: 'Sentry', description: 'Error tracking and performance monitoring', provider: 'sentry', icon: 'S' },
    { name: 'Stripe', description: 'Payment processing and subscription management', provider: 'stripe', icon: 'S' },
    { name: 'Twilio', description: 'SMS and voice communication', provider: 'twilio', icon: 'T' },
    { name: 'Cloudflare', description: 'CDN, DNS, and security configuration', provider: 'cloudflare', icon: 'C' },
    { name: 'OpenAI', description: 'AI-powered content and moderation', provider: 'openai', icon: 'O' },
    { name: 'Zapier', description: 'Connect with 5000+ apps via Zapier', provider: 'zapier', icon: 'Z' },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-[var(--color-admin-surface-hover)] rounded-xl" />)}
        </div>
      </div>
    );
  }

  const showAvailable = activeTab === 'available' || (activeTab === 'all' && integrations.length === 0);

  return (
    <AdminSection title="Integrations" description="Connect third-party services and tools"
      tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}
      actions={
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Add Integration
        </button>
      }>
      {/* Connected integrations */}
      {integrations.length > 0 && activeTab !== 'available' && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-3">Connected</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.filter(i => i.enabled || i.status === 'active').map(int => (
              <div key={int.id} className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-success-surface)] flex items-center justify-center text-[var(--color-success)] text-xs font-bold">
                      {int.name[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-admin-text)]">{int.name}</p>
                      <p className="text-xs text-[var(--color-admin-text-muted)]">{int.provider || int.name}</p>
                    </div>
                  </div>
                  <StatusBadge status="active" />
                </div>
                {int.description && <p className="text-xs text-[var(--color-admin-text-muted)] mb-3">{int.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-admin-text-muted)]">
                    {int.lastSyncAt ? `Last sync: ${new Date(int.lastSyncAt).toLocaleDateString()}` : 'Not synced'}
                  </span>
                  <button className="text-xs text-[var(--color-primary)] hover:underline">Configure</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available integrations */}
      {showAvailable && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-3">Available Integrations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableIntegrations.map(int => (
              <div key={int.provider} className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] text-xs font-bold">
                      {int.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-admin-text)]">{int.name}</p>
                      <p className="text-xs text-[var(--color-admin-text-muted)]">{int.provider}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-admin-surface-hover)] text-[var(--color-admin-text-muted)]">Available</span>
                </div>
                <p className="text-xs text-[var(--color-admin-text-muted)] mb-3">{int.description}</p>
                <button className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] text-sm text-[var(--color-primary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && !showAvailable && (
        <div className="p-12 text-center">
          <Puzzle className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
          <p className="text-sm text-[var(--color-admin-text-muted)]">No integrations found</p>
        </div>
      )}
    </AdminSection>
  );
}
