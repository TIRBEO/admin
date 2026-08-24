'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib';
import {
  Layers, ExternalLink, CheckCircle, AlertTriangle, Clock, Settings,
  RefreshCw, Globe, Eye, Code, Users, ChevronRight, Server,
  GitCommit, Terminal, FileText, Zap, Activity, X,
} from 'lucide-react';

interface AppInfo {
  name: string; slug: string; description: string; url: string;
  status: 'live' | 'maintenance' | 'dev'; version: string; icon: string;
  features: string[]; health: { api: boolean; frontend: boolean; database: boolean };
  deployment?: { id: string; url: string; readyState: string; createdAt: string; creator: string };
  repo?: string; branch?: string;
  envVars?: { key: string; value: string; target: string }[];
  commits?: { sha: string; message: string; author: string; date: string }[];
}

const TIRBEO_APPS: AppInfo[] = [
  { name: 'Landing', slug: 'landing', description: 'Marketing website and public pages', url: '/', status: 'live', version: '1.0.0', icon: '🌐', features: ['SEO', 'Theme', 'Navigation', 'Announcements'], health: { api: true, frontend: true, database: true }, repo: 'tirbeo/landing', branch: 'main' },
  { name: 'Accounts', slug: 'accounts', description: 'Authentication, registration, and identity', url: '/auth', status: 'live', version: '2.0.0', icon: '🔐', features: ['Login', 'Registration', '2FA', 'OAuth', 'Passkeys'], health: { api: true, frontend: true, database: true }, repo: 'tirbeo/accounts', branch: 'main' },
  { name: 'Dashboard', slug: 'dashboard', description: 'Main user dashboard and workspace', url: '/dashboard', status: 'live', version: '1.5.0', icon: '📊', features: ['Widgets', 'Navigation', 'Shortcuts', 'Notifications'], health: { api: true, frontend: true, database: true }, repo: 'tirbeo/dashboard', branch: 'main' },
  { name: 'Support', slug: 'support', description: 'Customer support ticketing and knowledge base', url: '/support', status: 'live', version: '1.0.0', icon: '💬', features: ['Tickets', 'Knowledge Base', 'FAQ', 'Live Chat'], health: { api: true, frontend: true, database: true }, repo: 'tirbeo/support', branch: 'main' },
  { name: 'Forms', slug: 'forms', description: 'Form builder and submission management', url: '/forms', status: 'live', version: '2.0.0', icon: '📝', features: ['Form Builder', '40+ Field Types', 'Conditional Logic', 'Embed', 'API Access'], health: { api: true, frontend: true, database: true }, repo: 'tirbeo/forms', branch: 'main' },
  { name: 'Documentation', slug: 'docs', description: 'Technical documentation and developer guides', url: '/docs', status: 'live', version: '1.0.0', icon: '📚', features: ['Search', 'Versioning', 'API Docs', 'Guides'], health: { api: true, frontend: true, database: false }, repo: 'tirbeo/docs', branch: 'main' },
  { name: 'Admin', slug: 'admin', description: 'Platform administration and control center', url: '/admin', status: 'live', version: '2.0.0', icon: '⚙️', features: ['Command Center', 'Users', 'Security', 'Analytics', 'Settings'], health: { api: true, frontend: true, database: true }, repo: 'tirbeo/tirbeo', branch: 'main' },
];

const MOCK_DEPLOYMENTS: Record<string, { id: string; url: string; readyState: string; createdAt: string; creator: string }> = {
  landing: { id: 'dpl_9kF2xL', url: 'landing.vercel.app', readyState: 'READY', createdAt: '2d ago', creator: 'bishnuneup4ne' },
  accounts: { id: 'dpl_3mN7pQ', url: 'accounts.vercel.app', readyState: 'READY', createdAt: '1d ago', creator: 'bishnuneup4ne' },
  dashboard: { id: 'dpl_8wR4tY', url: 'dashboard.vercel.app', readyState: 'READY', createdAt: '3h ago', creator: 'bishnuneup4ne' },
  support: { id: 'dpl_1aB5cD', url: 'support.vercel.app', readyState: 'READY', createdAt: '5d ago', creator: 'bishnuneup4ne' },
  forms: { id: 'dpl_6eF9gH', url: 'forms.vercel.app', readyState: 'READY', createdAt: '1w ago', creator: 'bishnuneup4ne' },
  docs: { id: 'dpl_2iJ3kL', url: 'docs.vercel.app', readyState: 'READY', createdAt: '2w ago', creator: 'bishnuneup4ne' },
  admin: { id: 'dpl_4mN8oP', url: 'admin.vercel.app', readyState: 'READY', createdAt: 'Today', creator: 'bishnuneup4ne' },
};

const MOCK_COMMITS: Record<string, { sha: string; message: string; author: string; date: string }[]> = {
  landing: [
    { sha: 'a1b2c3d', message: 'feat: update hero section for Q3 campaign', author: 'bishnuneup4ne', date: '2d ago' },
    { sha: 'e4f5g6h', message: 'fix: resolve mobile navigation overlap', author: 'bishnuneup4ne', date: '3d ago' },
    { sha: 'i7j8k9l', message: 'chore: update dependencies', author: 'bishnuneup4ne', date: '5d ago' },
  ],
  accounts: [
    { sha: 'm1n2o3p', message: 'feat: add passkey registration flow', author: 'bishnuneup4ne', date: '1d ago' },
    { sha: 'q4r5s6t', message: 'fix: OAuth callback redirect on Safari', author: 'bishnuneup4ne', date: '2d ago' },
  ],
  dashboard: [
    { sha: 'u1v2w3x', message: 'feat: add real-time notification badge', author: 'bishnuneup4ne', date: '3h ago' },
    { sha: 'y4z5a6b', message: 'fix: widget layout on ultrawide monitors', author: 'bishnuneup4ne', date: '1d ago' },
    { sha: 'c7d8e9f', message: 'refactor: extract AppShell to shared package', author: 'bishnuneup4ne', date: '2d ago' },
  ],
  admin: [
    { sha: 'g1h2i3j', message: 'feat: add user detail drawer and ban/suspend', author: 'bishnuneup4ne', date: 'Today' },
    { sha: 'k4l5m6n', message: 'feat: add notification bell in header', author: 'bishnuneup4ne', date: 'Today' },
    { sha: 'o7p8q9r', message: 'fix: activity page show real actor names', author: 'bishnuneup4ne', date: 'Today' },
  ],
};

const MOCK_ENV: Record<string, { key: string; target: string }[]> = {
  landing: [
    { key: 'NEXT_PUBLIC_API_URL', target: 'Production, Preview' },
    { key: 'NEXT_PUBLIC_SUPABASE_URL', target: 'Production, Preview' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', target: 'Production, Preview' },
  ],
  accounts: [
    { key: 'NEXT_PUBLIC_API_URL', target: 'Production, Preview' },
    { key: 'GITHUB_CLIENT_ID', target: 'Production' },
    { key: 'GITHUB_CLIENT_SECRET', target: 'Production' },
    { key: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', target: 'Production, Preview' },
  ],
  dashboard: [
    { key: 'NEXT_PUBLIC_API_URL', target: 'Production, Preview' },
    { key: 'NEXT_PUBLIC_WS_URL', target: 'Production, Preview' },
  ],
  admin: [
    { key: 'NEXT_PUBLIC_API_URL', target: 'Production, Preview' },
    { key: 'NEXT_PUBLIC_WS_URL', target: 'Production, Preview' },
  ],
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppInfo[]>(TIRBEO_APPS);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'deployments' | 'commits' | 'env'>('overview');
  const router = useRouter();

  const refreshHealth = useCallback(async () => {
    setLoading(true);
    try {
      const hb = await apiFetch('/api/admin/heartbeat').then(r => r.ok ? r.json() : null);
      if (hb) {
        setApps(prev => prev.map(app => ({
          ...app,
          health: { api: hb.api !== false, frontend: hb.frontend !== false, database: app.name !== 'Documentation' && hb.database !== false },
          deployment: MOCK_DEPLOYMENTS[app.slug],
          commits: MOCK_COMMITS[app.slug] || [],
          envVars: MOCK_ENV[app.slug] || [],
        }) as AppInfo));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refreshHealth(); }, [refreshHealth]);

  const filtered = apps;
  const liveCount = apps.filter(a => a.status === 'live').length;
  const healthyCount = apps.filter(a => Object.values(a.health).every(Boolean)).length;

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Applications</h1>
            <p className="page-header-description">{apps.length} Tirbeo applications · {healthyCount} healthy</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={refreshHealth} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Check Health
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Apps', value: apps.length, icon: Layers, color: 'var(--tb-brand)' },
          { label: 'Live', value: liveCount, icon: CheckCircle, color: 'var(--tb-green)' },
          { label: 'Healthy', value: healthyCount, icon: Activity, color: 'var(--tb-green)' },
          { label: 'Issues', value: apps.length - healthyCount, icon: AlertTriangle, color: 'var(--tb-yellow)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><k.icon size={14} style={{ color: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* App Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {filtered.map(app => {
          const allHealthy = Object.values(app.health).every(Boolean);
          const deploy = MOCK_DEPLOYMENTS[app.slug];
          return (
            <div key={app.name} className="card" style={{ cursor: 'pointer', transition: 'border-color 150ms', borderLeft: selectedApp?.slug === app.slug ? '3px solid var(--tb-brand)' : undefined }}
              onClick={() => { setSelectedApp(selectedApp?.slug === app.slug ? null : app); setDetailTab('overview'); }}>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--tb-surface-2)', border: '1px solid var(--tb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{app.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{app.name}</span>
                      <span className={`badge ${app.status === 'live' ? 'badge-green' : 'badge-yellow'}`}>{app.status === 'live' ? '● Live' : '● Dev'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 3 }}>{app.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                  {app.features.map(f => (
                    <span key={f} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 5, background: 'var(--tb-surface-2)', color: 'var(--tb-text-secondary)', border: '1px solid var(--tb-border)' }}>{f}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--tb-border)', fontSize: 12, color: 'var(--tb-text-muted)' }}>
                  <span>v{app.version}</span>
                  {deploy && <><span style={{ color: 'var(--tb-border)' }}>·</span><span>{deploy.createdAt}</span><span style={{ color: 'var(--tb-border)' }}>·</span><span style={{ color: 'var(--tb-green)' }}>{deploy.readyState}</span></>}
                  {app.repo && <><span style={{ color: 'var(--tb-border)' }}>·</span><Code size={11} style={{ verticalAlign: -1 }} /> {app.repo.split('/').pop()}</>}
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[{ ok: app.health.api, l: 'API' }, { ok: app.health.frontend, l: 'FE' }, { ok: app.health.database, l: 'DB' }].map(h => (
                      <div key={h.l} title={`${h.l}: ${h.ok ? 'OK' : 'Down'}`} style={{ width: 6, height: 6, borderRadius: '50%', background: h.ok ? 'var(--tb-green)' : 'var(--tb-red)' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Drawer */}
      {selectedApp && (
        <div className="card" style={{ border: '1px solid var(--tb-brand)' }}>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>{selectedApp.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>{selectedApp.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--tb-text-muted)', margin: 0, marginTop: 2 }}>{selectedApp.repo} · {selectedApp.branch}</p>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedApp(null)}><X size={14} /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--tb-border)', paddingBottom: 8 }}>
              {(['overview', 'deployments', 'commits', 'env'] as const).map(tab => (
                <button key={tab} className={`btn ${detailTab === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setDetailTab(tab)}>
                  {tab === 'overview' ? 'Overview' : tab === 'deployments' ? 'Deployments' : tab === 'commits' ? 'Commits' : 'Env Vars'}
                </button>
              ))}
            </div>

            {detailTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Status', value: selectedApp.status === 'live' ? '● Live' : '● Dev', color: 'var(--tb-green)' },
                  { label: 'Version', value: selectedApp.version, color: 'var(--tb-text-primary)' },
                  { label: 'Repo', value: selectedApp.repo || '—', color: 'var(--tb-text-primary)' },
                  { label: 'Branch', value: selectedApp.branch || '—', color: 'var(--tb-text-primary)' },
                  { label: 'API', value: selectedApp.health.api ? 'Healthy' : 'Down', color: selectedApp.health.api ? 'var(--tb-green)' : 'var(--tb-red)' },
                  { label: 'Frontend', value: selectedApp.health.frontend ? 'Healthy' : 'Down', color: selectedApp.health.frontend ? 'var(--tb-green)' : 'var(--tb-red)' },
                  { label: 'Database', value: selectedApp.health.database ? 'Healthy' : 'Down', color: selectedApp.health.database ? 'var(--tb-green)' : 'var(--tb-red)' },
                  { label: 'Features', value: selectedApp.features.length, color: 'var(--tb-text-primary)' },
                ].map(f => (
                  <div key={f.label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: f.color }}>{f.value}</div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'deployments' && (
              <div>
                {MOCK_DEPLOYMENTS[selectedApp.slug] ? (
                  <div style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <CheckCircle size={14} style={{ color: 'var(--tb-green)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tb-text-primary)' }}>Latest Deployment</span>
                      <span className="badge badge-green">{MOCK_DEPLOYMENTS[selectedApp.slug].readyState}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>ID: </span><code style={{ fontFamily: 'monospace' }}>{MOCK_DEPLOYMENTS[selectedApp.slug].id}</code></div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>URL: </span><a href={`https://${MOCK_DEPLOYMENTS[selectedApp.slug].url}`} target="_blank" style={{ color: 'var(--tb-brand)' }}>{MOCK_DEPLOYMENTS[selectedApp.slug].url}</a></div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>Deployed: </span>{MOCK_DEPLOYMENTS[selectedApp.slug].createdAt}</div>
                      <div><span style={{ color: 'var(--tb-text-muted)' }}>By: </span>{MOCK_DEPLOYMENTS[selectedApp.slug].creator}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-secondary btn-sm"><ExternalLink size={12} /> Open</button>
                      <button className="btn btn-ghost btn-sm"><RefreshCw size={12} /> Redeploy</button>
                      <button className="btn btn-ghost btn-sm"><Terminal size={12} /> Logs</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--tb-text-muted)', padding: '16px 0' }}>No deployment data available</div>
                )}
              </div>
            )}

            {detailTab === 'commits' && (
              <div>
                {(!selectedApp.commits || selectedApp.commits.length === 0) ? (
                  <div style={{ fontSize: 13, color: 'var(--tb-text-muted)', padding: '16px 0' }}>No commit data</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedApp.commits.map((c, i) => (
                      <div key={c.sha} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                        <GitCommit size={14} style={{ color: 'var(--tb-text-icon-muted)', marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--tb-text-primary)' }}>{c.message}</div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 11, color: 'var(--tb-text-muted)' }}>
                            <code style={{ fontFamily: 'monospace' }}>{c.sha}</code>
                            <span>{c.author}</span>
                            <span>{c.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detailTab === 'env' && (
              <div>
                {(!selectedApp.envVars || selectedApp.envVars.length === 0) ? (
                  <div style={{ fontSize: 13, color: 'var(--tb-text-muted)', padding: '16px 0' }}>No environment variables</div>
                ) : (
                  <div style={{ borderRadius: 8, border: '1px solid var(--tb-border)', overflow: 'hidden' }}>
                    <table className="dashboard-table" style={{ width: '100%' }}>
                      <thead><tr><th>Variable</th><th>Target</th></tr></thead>
                      <tbody>
                        {selectedApp.envVars.map(ev => (
                          <tr key={ev.key}>
                            <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{ev.key}</td>
                            <td><span className="badge badge-gray">{ev.target}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm"><Terminal size={12} /> View in Vercel</button>
                  <button className="btn btn-ghost btn-sm"><Plus size={12} /> Add Variable</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;
}
