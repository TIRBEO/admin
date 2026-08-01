'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Toast } from '../shared';

interface BrandConfig {
  logoUrl: string;
  brandName: string;
  brandTagline: string;
  primaryColor: string;
  accentColor: string;
  emailFromName: string;
  emailFromAddress: string;
}

const DEFAULTS: BrandConfig = {
  logoUrl: '',
  brandName: 'Tirbeo',
  brandTagline: 'Build communities. Share ideas. Grow together.',
  primaryColor: '#022B22',
  accentColor: '#569578',
  emailFromName: 'Tirbeo',
  emailFromAddress: 'noreply@send.tirbeo.app',
};

export default function BrandSettingsPage() {
  const [cfg, setCfg] = useState<BrandConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/branding');
    if (res.ok) {
      const d = await res.json();
      if (d?.branding) {
        const b = d.branding;
        setCfg(p => ({ ...p, logoUrl: b.logoUrl || '', brandName: b.brandName || '', brandTagline: b.brandTagline || '', emailFromName: b.emailFromName || '', emailFromAddress: b.emailFromAddress || '' }));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const res = await apiFetch('/api/admin/branding', {
      method: 'PUT', body: JSON.stringify({
        logoUrl: cfg.logoUrl, brandName: cfg.brandName, brandTagline: cfg.brandTagline,
        emailFromName: cfg.emailFromName, emailFromAddress: cfg.emailFromAddress,
      }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Brand settings saved' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const uploadLogo = async (file: File) => {
    if (!file) return;
    setUploading(true); setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiFetch('/api/admin/branding', { method: 'POST', body: fd });
    if (res.ok) {
      const d = await res.json();
      if (d?.url) { setCfg(p => ({ ...p, logoUrl: d.url })); setMsg({ type: 'success', text: 'Logo uploaded' }); }
      else setMsg({ type: 'error', text: 'Upload failed' });
    } else {
      const text = await res.text();
      setMsg({ type: 'error', text: text || 'Upload failed' });
    }
    setUploading(false); setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof BrandConfig>(k: K, v: BrandConfig[K]) => setCfg(p => ({ ...p, [k]: v }));

  const testEmailSend = async () => {
    if (!testEmail) return;
    setTesting(true); setMsg(null);
    const res = await apiFetch('/api/admin/email/test', {
      method: 'POST', body: JSON.stringify({ to: testEmail }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Test email sent!' });
    else setMsg({ type: 'error', text: 'Failed to send test email' });
    setTesting(false); setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <SettingsPage title="Brand & Logo" desc="Configure your brand identity, logo, and email appearance" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Logo" desc="Used in email templates, login pages, and branding">
        <Field label="Logo URL" desc="Direct URL to your logo image (PNG, SVG, or WebP)">
          <Input value={cfg.logoUrl} onChange={e => upd('logoUrl', e.target.value)} placeholder="https://..." />
        </Field>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload logo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ''; }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>PNG, SVG, WebP, JPG up to 5MB</span>
        </div>
        {cfg.logoUrl && (
          <div style={{ marginTop: 12, padding: 16, background: 'var(--bg-canvas)', borderRadius: 12, border: '1px solid var(--border-default)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#12271D', padding: '20px 24px', borderRadius: 14, border: '1px solid #214434' }}>
              <img src={cfg.logoUrl} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{cfg.brandName}</p>
                <p style={{ fontSize: 13, color: '#8DA39A' }}>{cfg.brandTagline}</p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Brand Identity" desc="Name and tagline used across your platform">
        <Field label="Brand Name">
          <Input value={cfg.brandName} onChange={e => upd('brandName', e.target.value)} placeholder="Tirbeo" />
        </Field>
        <Field label="Tagline">
          <Input value={cfg.brandTagline} onChange={e => upd('brandTagline', e.target.value)} placeholder="Build communities. Share ideas." />
        </Field>
      </SectionCard>

      <SectionCard title="Brand Colors" desc="Colors used in email templates and branding">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Primary Color" desc="Dark green header gradient start">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={cfg.primaryColor} onChange={e => upd('primaryColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
              <Input value={cfg.primaryColor} onChange={e => upd('primaryColor', e.target.value)} />
            </div>
          </Field>
          <Field label="Accent Color" desc="Buttons, links, and highlights">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={cfg.accentColor} onChange={e => upd('accentColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
              <Input value={cfg.accentColor} onChange={e => upd('accentColor', e.target.value)} />
            </div>
          </Field>
        </div>
        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-canvas)', borderRadius: 12, border: '1px solid var(--border-default)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color Preview</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[cfg.primaryColor, cfg.accentColor, '#275D46', '#12271D', '#101C13', '#B7C6BE', '#F2EEE8'].map((c, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: c, border: '2px solid rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Email Sender" desc="Default sender for all platform emails">
        <Field label="From Name">
          <Input value={cfg.emailFromName} onChange={e => upd('emailFromName', e.target.value)} placeholder="Tirbeo" />
        </Field>
        <Field label="From Email">
          <Input value={cfg.emailFromAddress} onChange={e => upd('emailFromAddress', e.target.value)} placeholder="noreply@send.tirbeo.app" />
        </Field>
      </SectionCard>

      <SectionCard title="Test Email" desc="Send a test to verify branding looks correct">
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" />
          <button className="btn btn-outline" onClick={testEmailSend} disabled={testing || !testEmail}>
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </SectionCard>
    </SettingsPage>
  );
}
