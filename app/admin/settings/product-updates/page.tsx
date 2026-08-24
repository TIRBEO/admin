'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib';
import { Rocket, Users, Send, CheckCircle, AlertTriangle, Loader2, Eye } from 'lucide-react';

export default function ProductUpdatesPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [recipients, setRecipients] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/notifications/broadcast')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRecipients(d?.recipients ?? 0))
      .catch(() => setRecipients(0));
  }, []);

  const valid = title.trim().length > 0 && message.trim().length > 0;

  const send = async () => {
    setConfirming(false);
    setSending(true);
    setError('');
    setResult(null);
    try {
      const r = await apiFetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, ctaUrl, ctaLabel }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data?.error || 'Broadcast failed');
      } else {
        setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
        setTitle(''); setMessage(''); setCtaUrl(''); setCtaLabel('');
      }
    } catch {
      setError('Broadcast failed — check API connection');
    }
    setSending(false);
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Product Updates</h1>
            <p className="page-header-description">
              Broadcast product news to users who opted in to product emails. Users with the toggle off never receive these.
            </p>
          </div>
          <div className="page-header-actions">
            <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} style={{ color: 'var(--tb-brand)' }} />
              <span style={{ fontSize: 13, color: 'var(--tb-text-secondary)' }}>Recipients</span>
              <strong style={{ fontSize: 15 }}>{recipients === null ? '…' : recipients.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Composer */}
        <div className="card">
          <div className="card-header"><span className="card-title"><Rocket size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Compose Update</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label">Title *</label>
              <input className="form-input" maxLength={120} placeholder="Forms app v2 is here 🎉" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Message *</label>
              <textarea
                className="form-input" rows={7} maxLength={5000}
                placeholder="What's new, what improved, and why it matters…"
                value={message} onChange={e => setMessage(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Button link (optional)</label>
                <input className="form-input" placeholder="/dashboard or https://…" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Button label</label>
                <input className="form-input" placeholder="See What's New" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} />
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', fontSize: 13 }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            {result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', color: '#34d399', fontSize: 13 }}>
                <CheckCircle size={14} /> Sent to {result.sent} user{result.sent === 1 ? '' : 's'}{result.failed > 0 ? ` · ${result.failed} failed` : ''}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" disabled={!valid || sending} onClick={() => setConfirming(true)}>
                {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                {sending ? `Sending to ${(recipients ?? 0).toLocaleString()} users…` : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="card">
          <div className="card-header"><span className="card-title"><Eye size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Email Preview</span></div>
          <div className="card-body">
            <div style={{ border: '1px solid var(--tb-border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '22px 20px', background: 'var(--tb-surface-2)', borderBottom: '1px solid var(--tb-border)' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tb-text-muted)', marginBottom: 6 }}>🚀 Product Update</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--tb-text-primary)' }}>{title || 'Your update title'}</div>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: 'var(--tb-text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {message || 'Your message body will appear here, exactly as users will read it in their inbox.'}
                </p>
                {(ctaUrl || ctaLabel) && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} tabIndex={-1}>
                    {ctaLabel || "See What's New"}
                  </button>
                )}
              </div>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--tb-text-muted)' }}>
              Every email includes an unsubscribe link to notification preferences. Delivery uses your configured email provider.
            </p>
          </div>
        </div>
      </div>

      {confirming && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirming(false)}>
          <div className="card" style={{ maxWidth: 420, width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="card-body">
              <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Send to {(recipients ?? 0).toLocaleString()} users?</h3>
              <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.6, color: 'var(--tb-text-secondary)' }}>
                This emails everyone opted in to product emails and cannot be undone. Double-check your copy.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={send}><Send size={13} /> Confirm & Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
