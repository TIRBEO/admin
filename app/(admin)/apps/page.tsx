'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AdminSection,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  StatusBadge,
  Switch,
  Textarea,
} from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { Toast } from '../settings/shared';
import {
  Copy,
  ExternalLink,
  Eye,
  Globe,
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface OAuthClient {
  id: string;
  clientId: string;
  redirectUris: string[];
  scopes: string[];
  grants: string[];
  isActive: boolean;
  createdAt: string;
  hasSecret: boolean;
}

interface App {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  url?: string | null;
  icon?: string | null;
  isPublic: boolean;
  status: string;
  createdAt: string;
  owner?: { id: string; name?: string | null; email?: string | null } | null;
  clients: OAuthClient[];
}

interface SecretReveal {
  appName: string;
  clientId: string;
  clientSecret: string;
}

const GRANT_OPTIONS = ['authorization_code', 'refresh_token', 'client_credentials'];
const SCOPE_HINTS = ['openid', 'profile', 'email', 'offline_access'];

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function ClientSecretField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="text-xs font-medium text-[var(--color-admin-text-secondary)]">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] text-xs break-all select-all">
          {value}
        </code>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Copy className="w-3.5 h-3.5" />}
          onClick={() => {
            copyText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create-app modal
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [appForm, setAppForm] = useState({ name: '', slug: '', description: '', url: '', icon: '' });
  const [appBusy, setAppBusy] = useState(false);

  // Edit-app modal
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [editAppForm, setEditAppForm] = useState({ name: '', description: '', url: '', icon: '' });
  const [editAppPublic, setEditAppPublic] = useState(true);
  const [editAppBusy, setEditAppBusy] = useState(false);

  // Create-client modal
  const [clientForApp, setClientForApp] = useState<App | null>(null);
  const [clientForm, setClientForm] = useState({
    redirectUris: '',
    scopes: 'openid profile email',
    grants: ['authorization_code', 'refresh_token'],
  });
  const [clientBusy, setClientBusy] = useState(false);

  // Edit-client modal
  const [editingClient, setEditingClient] = useState<{ app: App; client: OAuthClient } | null>(null);
  const [editClientForm, setEditClientForm] = useState({ redirectUris: '', scopes: '', grants: [] as string[] });
  const [editClientActive, setEditClientActive] = useState(true);
  const [editClientBusy, setEditClientBusy] = useState(false);

  // Secret reveal
  const [secret, setSecret] = useState<SecretReveal | null>(null);

  // Delete confirms
  const [deleteApp, setDeleteApp] = useState<App | null>(null);
  const [deleteClient, setDeleteClient] = useState<{ app: App; client: OAuthClient } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      // Explicit GET bypasses apiFetch's 5s response cache so fresh data is
      // fetched right after a create/update/delete mutation.
      const res = await apiFetch('/api/admin/oauth/apps', { method: 'GET' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to load apps' });
        return;
      }
      const d = await res.json();
      setApps(d.apps || []);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to load apps' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleCreateApp = async () => {
    if (!appForm.name.trim() || !appForm.slug.trim()) {
      setMsg({ type: 'error', text: 'Name and slug are required' });
      return;
    }
    setAppBusy(true);
    try {
      const res = await apiFetch('/api/admin/oauth/apps', {
        method: 'POST',
        body: JSON.stringify({
          name: appForm.name,
          slug: appForm.slug,
          description: appForm.description || undefined,
          url: appForm.url || undefined,
          icon: appForm.icon || undefined,
          isPublic: true,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to create app' });
        return;
      }
      setShowCreateApp(false);
      setAppForm({ name: '', slug: '', description: '', url: '', icon: '' });
      loadApps();
      setMsg({ type: 'success', text: 'App created' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to create app' });
    } finally {
      setAppBusy(false);
    }
  };

  const openEditApp = (app: App) => {
    setEditingApp(app);
    setEditAppForm({
      name: app.name,
      description: app.description || '',
      url: app.url || '',
      icon: app.icon || '',
    });
    setEditAppPublic(app.isPublic);
  };

  const handleUpdateApp = async () => {
    if (!editingApp) return;
    if (!editAppForm.name.trim()) {
      setMsg({ type: 'error', text: 'Name cannot be empty' });
      return;
    }
    setEditAppBusy(true);
    try {
      const res = await apiFetch(`/api/admin/oauth/apps/${editingApp.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editAppForm.name,
          description: editAppForm.description || null,
          url: editAppForm.url || null,
          icon: editAppForm.icon || null,
          isPublic: editAppPublic,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to update app' });
        return;
      }
      setEditingApp(null);
      loadApps();
      setMsg({ type: 'success', text: 'App updated' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to update app' });
    } finally {
      setEditAppBusy(false);
    }
  };

  const handleCreateClient = async () => {
    if (!clientForApp) return;
    const redirectUris = clientForm.redirectUris.split('\n').map((s) => s.trim()).filter(Boolean);
    const scopes = clientForm.scopes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (redirectUris.length === 0) {
      setMsg({ type: 'error', text: 'At least one redirect URI is required' });
      return;
    }
    if (scopes.length === 0) {
      setMsg({ type: 'error', text: 'At least one scope is required' });
      return;
    }
    setClientBusy(true);
    try {
      const res = await apiFetch('/api/admin/oauth/clients', {
        method: 'POST',
        body: JSON.stringify({
          appId: clientForApp.id,
          redirectUris,
          scopes,
          grants: clientForm.grants,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to create client' });
        return;
      }
      const d = await res.json();
      setSecret({
        appName: clientForApp.name,
        clientId: d.client.clientId,
        clientSecret: d.clientSecret,
      });
      setClientForApp(null);
      setClientForm({ redirectUris: '', scopes: 'openid profile email', grants: ['authorization_code', 'refresh_token'] });
      loadApps();
      setMsg({ type: 'success', text: 'Client created' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to create client' });
    } finally {
      setClientBusy(false);
    }
  };

  const openEditClient = (app: App, client: OAuthClient) => {
    setEditingClient({ app, client });
    setEditClientForm({
      redirectUris: client.redirectUris.join('\n'),
      scopes: client.scopes.join(' '),
      grants: client.grants,
    });
    setEditClientActive(client.isActive);
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;
    const redirectUris = editClientForm.redirectUris.split('\n').map((s) => s.trim()).filter(Boolean);
    const scopes = editClientForm.scopes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (redirectUris.length === 0 || scopes.length === 0) {
      setMsg({ type: 'error', text: 'Redirect URIs and scopes are required' });
      return;
    }
    setEditClientBusy(true);
    try {
      const res = await apiFetch(`/api/admin/oauth/clients/${editingClient.client.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          redirectUris,
          scopes,
          grants: editClientForm.grants,
          isActive: editClientActive,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to update client' });
        return;
      }
      setEditingClient(null);
      loadApps();
      setMsg({ type: 'success', text: 'Client updated' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to update client' });
    } finally {
      setEditClientBusy(false);
    }
  };

  const handleRegenerateSecret = async (app: App, client: OAuthClient) => {
    try {
      const res = await apiFetch(`/api/admin/oauth/clients/${client.id}/secret`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to regenerate secret' });
        return;
      }
      const d = await res.json();
      setSecret({ appName: app.name, clientId: d.clientId, clientSecret: d.clientSecret });
      loadApps();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to regenerate secret' });
    }
  };

  const handleDeleteApp = async () => {
    if (!deleteApp) return;
    setDeleteBusy(true);
    try {
      const res = await apiFetch(`/api/admin/oauth/apps/${deleteApp.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to delete app' });
        return;
      }
      setDeleteApp(null);
      loadApps();
      setMsg({ type: 'success', text: 'App deleted' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to delete app' });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteClient) return;
    setDeleteBusy(true);
    try {
      const res = await apiFetch(`/api/admin/oauth/clients/${deleteClient.client.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || 'Failed to delete client' });
        return;
      }
      setDeleteClient(null);
      loadApps();
      setMsg({ type: 'success', text: 'Client deleted' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to delete client' });
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleGrant = (form: 'client' | 'editClient', grant: string) => {
    if (form === 'client') {
      setClientForm((prev) => ({
        ...prev,
        grants: prev.grants.includes(grant) ? prev.grants.filter((g) => g !== grant) : [...prev.grants, grant],
      }));
    } else {
      setEditClientForm((prev) => ({
        ...prev,
        grants: prev.grants.includes(grant) ? prev.grants.filter((g) => g !== grant) : [...prev.grants, grant],
      }));
    }
  };

  return (
    <AdminSection
      title="OAuth Clients"
      description="Manage apps in the 'Login with Tirbeo' registry and their OAuth 2.0 / OIDC clients"
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
      actions={
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateApp(true)}>
          New App
        </Button>
      }
    >
      <Toast msg={msg} onClose={() => setMsg(null)} />

      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--color-admin-text-muted)]">Loading apps…</div>
      ) : apps.length === 0 ? (
        <EmptyState
          icon={<Globe className="w-10 h-10" />}
          title="No apps registered"
          description="Create your first app to issue OAuth clients for the 'Login with Tirbeo' flow."
        />
      ) : (
        <div className="space-y-6">
          {apps.map((app) => (
            <div key={app.id} className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-card)] overflow-hidden">
              <div className="p-5 border-b border-[var(--color-admin-border)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {app.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={app.icon} alt="" className="w-10 h-10 rounded-lg object-cover border border-[var(--color-admin-border)]" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] text-sm font-bold shrink-0">
                        {app.name[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[var(--color-admin-text)]">{app.name}</h3>
                        <code className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] text-[var(--color-admin-text-secondary)]">
                          {app.slug}
                        </code>
                        <StatusBadge
                          status={app.isPublic ? 'active' : 'suspended'}
                          label={app.isPublic ? 'Public' : 'Private'}
                        />
                      </div>
                      {app.description && (
                        <p className="text-xs text-[var(--color-admin-text-secondary)] mt-0.5 line-clamp-1">{app.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--color-admin-text-muted)]">
                        {app.url && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                          >
                            {app.url.replace(/^https?:\/\//, '').split('/')[0]}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span>{app.clients.length} client{app.clients.length === 1 ? '' : 's'}</span>
                        {app.owner?.email && <span>Owner: {app.owner.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditApp(app)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setDeleteApp(app)}
                      className="text-[var(--color-danger)]"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {app.clients.length === 0 ? (
                  <div className="text-sm text-[var(--color-admin-text-muted)] py-2">
                    No OAuth clients yet.
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-3"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setClientForApp(app);
                      }}
                    >
                      Add client
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {app.clients.map((client) => (
                      <div
                        key={client.id}
                        className="rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] p-4"
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <ShieldCheck className={`w-4 h-4 shrink-0 ${client.isActive ? 'text-[var(--color-success)]' : 'text-[var(--color-admin-text-muted)]'}`} />
                            <code className="text-xs font-mono text-[var(--color-admin-text)] truncate">{client.clientId}</code>
                            <StatusBadge
                              status={client.isActive ? 'active' : 'suspended'}
                              label={client.isActive ? 'Active' : 'Disabled'}
                            />
                            {client.hasSecret ? (
                              <Badge variant="info">Secret set</Badge>
                            ) : (
                              <Badge variant="warning">No secret</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                              onClick={() => handleRegenerateSecret(app, client)}
                            >
                              Rotate secret
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Pencil className="w-3.5 h-3.5" />}
                              onClick={() => openEditClient(app, client)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              className="text-[var(--color-danger)]"
                              onClick={() => setDeleteClient({ app, client })}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mt-3 text-xs">
                          <div>
                            <p className="font-medium text-[var(--color-admin-text-secondary)] mb-1">Redirect URIs</p>
                            <div className="flex flex-wrap gap-1">
                              {client.redirectUris.map((u) => (
                                <code key={u} className="px-1.5 py-0.5 rounded bg-[var(--color-admin-card)] border border-[var(--color-admin-border)] text-[11px] break-all">
                                  {u}
                                </code>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-admin-text-secondary)] mb-1">Scopes</p>
                            <div className="flex flex-wrap gap-1">
                              {client.scopes.map((s) => (
                                <Badge key={s} variant="default">{s}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-admin-text-secondary)] mb-1">Grants</p>
                            <div className="flex flex-wrap gap-1">
                              {client.grants.map((g) => (
                                <Badge key={g} variant="success">{g}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setClientForApp(app);
                      }}
                    >
                      Add client
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create app */}
      <Dialog open={showCreateApp} onOpenChange={setShowCreateApp}>
        <div className="p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-[var(--color-admin-text)] mb-1">New App</h2>
          <p className="text-sm text-[var(--color-admin-text-secondary)] mb-5">
            Apps are registered applications that can hold OAuth clients for the 'Login with Tirbeo' flow.
          </p>
          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g. Tirbeo CRM"
              value={appForm.name}
              onChange={(e) => setAppForm({ ...appForm, name: e.target.value, slug: appForm.slug || slugify(e.target.value) })}
            />
            <Input
              label="Slug"
              placeholder="tirbeo-crm"
              value={appForm.slug}
              onChange={(e) => setAppForm({ ...appForm, slug: slugify(e.target.value) })}
            />
            <Input
              label="Description"
              placeholder="What does this app do?"
              value={appForm.description}
              onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
            />
            <Input
              label="Website URL"
              placeholder="https://app.example.com"
              value={appForm.url}
              onChange={(e) => setAppForm({ ...appForm, url: e.target.value })}
            />
            <Input
              label="Icon URL (optional)"
              placeholder="https://example.com/icon.png"
              value={appForm.icon}
              onChange={(e) => setAppForm({ ...appForm, icon: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-6">
            <Button loading={appBusy} onClick={handleCreateApp} className="flex-1">
              Create App
            </Button>
            <Button variant="secondary" onClick={() => setShowCreateApp(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit app */}
      {editingApp && (
        <Dialog open onOpenChange={() => setEditingApp(null)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-[var(--color-admin-text)] mb-5">Edit {editingApp.name}</h2>
            <div className="space-y-4">
              <Input
                label="Name"
                value={editAppForm.name}
                onChange={(e) => setEditAppForm({ ...editAppForm, name: e.target.value })}
              />
              <Input
                label="Description"
                value={editAppForm.description}
                onChange={(e) => setEditAppForm({ ...editAppForm, description: e.target.value })}
              />
              <Input
                label="Website URL"
                value={editAppForm.url}
                onChange={(e) => setEditAppForm({ ...editAppForm, url: e.target.value })}
              />
              <Input
                label="Icon URL"
                value={editAppForm.icon}
                onChange={(e) => setEditAppForm({ ...editAppForm, icon: e.target.value })}
              />
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-admin-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-admin-text)]">Public</p>
                  <p className="text-xs text-[var(--color-admin-text-secondary)]">Public apps appear in the app registry; private apps are hidden.</p>
                </div>
                <Switch checked={editAppPublic} onChange={setEditAppPublic} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button loading={editAppBusy} onClick={handleUpdateApp} className="flex-1">
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setEditingApp(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Create client */}
      {clientForApp && (
        <Dialog open onOpenChange={() => setClientForApp(null)}>
          <div className="p-6 max-w-lg w-full">
            <h2 className="text-lg font-semibold text-[var(--color-admin-text)] mb-1">New OAuth client</h2>
            <p className="text-sm text-[var(--color-admin-text-secondary)] mb-5">
              For <span className="font-medium text-[var(--color-admin-text)]">{clientForApp.name}</span> — the client ID and
              secret are shown once after creation.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--color-admin-text-secondary)]">Redirect URIs (one per line)</label>
                <Textarea
                  className="mt-1 font-mono text-xs"
                  rows={4}
                  placeholder={'https://app.example.com/callback\nhttp://localhost:3000/callback'}
                  value={clientForm.redirectUris}
                  onChange={(e) => setClientForm({ ...clientForm, redirectUris: e.target.value })}
                />
              </div>
              <Input
                label="Scopes (space or comma separated)"
                placeholder="openid profile email"
                value={clientForm.scopes}
                onChange={(e) => setClientForm({ ...clientForm, scopes: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5">
                  {SCOPE_HINTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const current = clientForm.scopes.split(/[\s,]+/).filter(Boolean);
                        const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
                        setClientForm({ ...clientForm, scopes: next.join(' ') });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                        clientForm.scopes.split(/[\s,]+/).includes(s)
                          ? 'bg-[var(--color-primary-surface)] border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'border-[var(--color-admin-border)] text-[var(--color-admin-text-secondary)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-admin-text-secondary)]">Grant types</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {GRANT_OPTIONS.map((g) => (
                    <label key={g} className="flex items-center gap-2 text-sm text-[var(--color-admin-text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clientForm.grants.includes(g)}
                        onChange={() => toggleGrant('client', g)}
                        className="accent-[var(--color-primary)]"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button loading={clientBusy} onClick={handleCreateClient} className="flex-1">
                Create Client
              </Button>
              <Button variant="secondary" onClick={() => setClientForApp(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edit client */}
      {editingClient && (
        <Dialog open onOpenChange={() => setEditingClient(null)}>
          <div className="p-6 max-w-lg w-full">
            <h2 className="text-lg font-semibold text-[var(--color-admin-text)] mb-1">Edit client</h2>
            <code className="text-xs text-[var(--color-admin-text-secondary)] break-all">{editingClient.client.clientId}</code>
            <div className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-medium text-[var(--color-admin-text-secondary)]">Redirect URIs (one per line)</label>
                <Textarea
                  className="mt-1 font-mono text-xs"
                  rows={4}
                  value={editClientForm.redirectUris}
                  onChange={(e) => setEditClientForm({ ...editClientForm, redirectUris: e.target.value })}
                />
              </div>
              <Input
                label="Scopes"
                value={editClientForm.scopes}
                onChange={(e) => setEditClientForm({ ...editClientForm, scopes: e.target.value })}
              />
              <div>
                <label className="text-xs font-medium text-[var(--color-admin-text-secondary)]">Grant types</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {GRANT_OPTIONS.map((g) => (
                    <label key={g} className="flex items-center gap-2 text-sm text-[var(--color-admin-text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editClientForm.grants.includes(g)}
                        onChange={() => toggleGrant('editClient', g)}
                        className="accent-[var(--color-primary)]"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-admin-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-admin-text)]">Active</p>
                  <p className="text-xs text-[var(--color-admin-text-secondary)]">Disabled clients are rejected by authorize and token endpoints.</p>
                </div>
                <Switch checked={editClientActive} onChange={setEditClientActive} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button loading={editClientBusy} onClick={handleUpdateClient} className="flex-1">
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setEditingClient(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Secret reveal */}
      {secret && (
        <Dialog open onOpenChange={() => setSecret(null)}>
          <div className="p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-success-subtle)] flex items-center justify-center text-[var(--color-success)]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-admin-text)]">Client credentials</h2>
                <p className="text-sm text-[var(--color-admin-text-secondary)]">for {secret.appName}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-subtle)] px-4 py-3 text-xs text-[var(--color-warning)]">
              <Eye className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              The client secret is shown only once — copy it now. You can rotate it later from the app card.
            </div>
            <div className="space-y-4 mt-5">
              <ClientSecretField label="Client ID" value={secret.clientId} />
              <ClientSecretField label="Client Secret" value={secret.clientSecret} />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setSecret(null)}>
                Done
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Delete app confirm */}
      {deleteApp && (
        <Dialog open onOpenChange={() => setDeleteApp(null)}>
          <div className="p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-danger-subtle)] flex items-center justify-center text-[var(--color-danger)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-admin-text)]">Delete {deleteApp.name}?</h2>
            </div>
            <p className="text-sm text-[var(--color-admin-text-secondary)]">
              This permanently removes the app and all of its OAuth clients, authorization codes, tokens, and consents.
              This cannot be undone.
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                loading={deleteBusy}
                className="flex-1 bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)]"
                onClick={handleDeleteApp}
              >
                Delete App
              </Button>
              <Button variant="secondary" onClick={() => setDeleteApp(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Delete client confirm */}
      {deleteClient && (
        <Dialog open onOpenChange={() => setDeleteClient(null)}>
          <div className="p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-danger-subtle)] flex items-center justify-center text-[var(--color-danger)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-admin-text)]">Delete client?</h2>
            </div>
            <code className="text-xs text-[var(--color-admin-text-secondary)] break-all block">{deleteClient.client.clientId}</code>
            <p className="text-sm text-[var(--color-admin-text-secondary)] mt-3">
              Apps signed in through this client will be unable to obtain new tokens.
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                loading={deleteBusy}
                className="flex-1 bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)]"
                onClick={handleDeleteClient}
              >
                Delete Client
              </Button>
              <Button variant="secondary" onClick={() => setDeleteClient(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AdminSection>
  );
}
