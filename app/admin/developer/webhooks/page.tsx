'use client';
import { useState } from 'react';
import { Webhook, RefreshCw, Plus, ExternalLink, CheckCircle, XCircle, Clock, Trash2, Send, RotateCcw } from 'lucide-react';

interface WebhookEntry { id: string; url: string; events: string[]; status: 'active' | 'paused' | 'failed'; lastDelivery?: string; lastStatus?: number; secret?: string; }

const MOCK_WEBHOOKS: WebhookEntry[] = [
  { id: '1', url: 'https://api.example.com/webhooks/tirbeo', events: ['user.created', 'ticket.created', 'submission.created'], status: 'active', lastDelivery: '2 minutes ago', lastStatus: 200, secret: 'whsec_***' },
  { id: '2', url: 'https://hooks.slack.com/services/T0000/B0000', events: ['security.event', 'maintenance.changed'], status: 'active', lastDelivery: '1 hour ago', lastStatus: 200, secret: 'whsec_***' },
  { id: '3', url: 'https://backup.example.com/sync', events: ['config.published', 'page.published'], status: 'paused', lastDelivery: '3 days ago', lastStatus: 503, secret: 'whsec_***' },
];

const EVENT_TYPES = ['user.created', 'user.updated', 'ticket.created', 'submission.created', 'security.event', 'config.published', 'page.published', 'maintenance.changed', 'deployment.completed', 'role.updated'];

export default function WebhooksPage() {
  const [webhooks] = useState<WebhookEntry[]>(MOCK_WEBHOOKS);
  const [showNew, setShowNew] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Webhooks</h1>
            <p className="page-header-description">Manage webhook endpoints for event notifications</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(!showNew)}><Plus size={13} /> New Webhook</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Webhooks', value: webhooks.length, color: 'var(--tb-brand)' },
          { label: 'Active', value: webhooks.filter(w => w.status === 'active').length, color: 'var(--tb-green)' },
          { label: 'Failed / Paused', value: webhooks.filter(w => w.status !== 'active').length, color: 'var(--tb-yellow)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><div style={{ width: 7, height: 7, borderRadius: '50%', background: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* New Webhook Form */}
      {showNew && (
        <div className="card" style={{ border: '1px solid var(--tb-brand)' }}>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>New Webhook</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Endpoint URL</label>
              <input className="input" placeholder="https://example.com/webhook" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Events</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {EVENT_TYPES.map(ev => (
                  <button key={ev} type="button"
                    className={`btn ${newEvents.includes(ev) ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    onClick={() => setNewEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])}
                    style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {ev}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" disabled={!newUrl || newEvents.length === 0}>
              <Plus size={13} /> Create Webhook
            </button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      {webhooks.length === 0 ? (
        <div className="empty-state">
          <Webhook size={28} style={{ color: 'var(--tb-text-muted)' }} />
          <div className="empty-state-title">No webhooks configured</div>
          <div className="empty-state-desc">Create a webhook to receive event notifications</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {webhooks.map(wh => (
            <div key={wh.id} className="card" style={{ borderLeft: `3px solid ${wh.status === 'active' ? 'var(--tb-green)' : wh.status === 'failed' ? 'var(--tb-red)' : 'var(--tb-yellow)'}` }}>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <code style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--tb-text-primary)', fontWeight: 500 }}>{wh.url}</code>
                      <span className={`badge ${wh.status === 'active' ? 'badge-green' : wh.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
                        {wh.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {wh.events.map(ev => (
                        <span key={ev} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--tb-surface-2)', color: 'var(--tb-text-secondary)', fontFamily: 'monospace' }}>{ev}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--tb-text-muted)' }}>
                      {wh.lastDelivery && <span><Clock size={11} style={{ verticalAlign: -1 }} /> Last delivery: {wh.lastDelivery}</span>}
                      {wh.lastStatus && (
                        <span style={{ color: wh.lastStatus < 300 ? 'var(--tb-green)' : 'var(--tb-red)' }}>
                          HTTP {wh.lastStatus}
                        </span>
                      )}
                      {wh.secret && <span style={{ fontFamily: 'monospace' }}>{wh.secret}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-xs" title="Test"><Send size={12} /></button>
                    <button className="btn btn-ghost btn-xs" title="Retry"><RotateCcw size={12} /></button>
                    <button className="btn btn-ghost btn-xs" title="Delete"><Trash2 size={12} style={{ color: 'var(--tb-red)' }} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
