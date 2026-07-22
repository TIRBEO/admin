'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Input, ColorInput, Toast } from '../shared';

interface ThemeConfig {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  fontPrimary: string;
  fontHeading: string;
  borderRadius: string;
  logoUrl: string;
  brandName: string;
  brandTagline: string;
  emailHeaderBg: string;
  emailButtonColor: string;
  emailTextColor: string;
  lightBgPrimary: string;
  lightBgSecondary: string;
  lightTextPrimary: string;
  lightAccentPrimary: string;
}

const DEFAULTS: ThemeConfig = {
  bgPrimary: '#0B0B0D',
  bgSecondary: '#121417',
  bgCard: '#16181C',
  bgElevated: '#252B31',
  textPrimary: '#F2EEE8',
  textSecondary: '#A6A6A6',
  textMuted: '#7B7E84',
  accentPrimary: '#D8B36A',
  accentSecondary: '#5F7352',
  accentHover: '#C9A458',
  success: '#238636',
  warning: '#D29922',
  error: '#DA3633',
  fontPrimary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontHeading: 'Inter Tight, Inter, -apple-system, sans-serif',
  borderRadius: '12px',
  logoUrl: '',
  brandName: 'Tirbeo',
  brandTagline: 'Build communities. Share ideas. Grow together.',
  emailHeaderBg: '#0B0B0D',
  emailButtonColor: '#D8B36A',
  emailTextColor: '#F2EEE8',
  lightBgPrimary: '#FFFFFF',
  lightBgSecondary: '#F5F5F5',
  lightTextPrimary: '#0B0B0D',
  lightAccentPrimary: '#D8B36A',
};

type SectionKey = keyof ThemeConfig;

export default function ThemeSettingsPage() {
  const [cfg, setCfg] = useState<ThemeConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/theme');
    if (res.ok) {
      const d = await res.json();
      if (d) setCfg({ ...DEFAULTS, ...d });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const res = await apiFetch('/api/admin/theme', {
      method: 'PUT', body: JSON.stringify(cfg),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Theme saved — applies to all apps on next load' });
    else setMsg({ type: 'error', text: 'Failed to save theme' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const reset = async () => {
    setCfg(DEFAULTS);
    setMsg(null);
  };

  const upd = (k: SectionKey, v: string) => setCfg(p => ({ ...p, [k]: v }));

  const colorFields = (fields: { key: SectionKey; label: string; varName: string }[]) =>
    fields.map(f => (
      <Field key={f.key} label={f.label} desc={`--${f.varName}`}>
        <ColorInput value={cfg[f.key]} onChange={v => upd(f.key, v)} />
      </Field>
    ));

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <SettingsPage title="Theme Configuration" desc="Customize the visual theme for all apps — colors, typography, and branding" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Live Preview */}
        <div style={{ flex: '0 0 280px', minWidth: 240 }}>
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <h3>Live Preview</h3>
            <div className="card-body" style={{ background: cfg.bgSecondary }}>
              <div style={{ background: cfg.bgCard, borderRadius: cfg.borderRadius, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.accentPrimary }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cfg.textPrimary }}>{cfg.brandName}</div>
                    <div style={{ fontSize: 11, color: cfg.textMuted }}>{cfg.brandTagline}</div>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: cfg.bgElevated, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 600, background: cfg.bgElevated, color: cfg.textSecondary }}>Feed</span>
                  <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 600, background: cfg.accentPrimary, color: '#000' }}>Explore</span>
                  <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 600, background: cfg.bgElevated, color: cfg.textSecondary }}>Chat</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: cfg.textPrimary, marginBottom: 4 }}>Welcome back!</div>
                <div style={{ fontSize: 11, color: cfg.textSecondary, marginBottom: 12, lineHeight: 1.4 }}>
                  You have <span style={{ color: cfg.accentPrimary }}>3 new messages</span> and <span style={{ color: cfg.success }}>2 notifications</span>.
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, padding: '6px 0', borderRadius: cfg.borderRadius, background: cfg.accentPrimary, color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>View</div>
                  <div style={{ flex: 1, padding: '6px 0', borderRadius: cfg.borderRadius, border: '1px solid ' + cfg.bgElevated, color: cfg.textSecondary, fontSize: 10, fontWeight: 600, textAlign: 'center' }}>Dismiss</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1, padding: '8px 0', borderRadius: cfg.borderRadius, background: cfg.success, color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>Success</div>
                <div style={{ flex: 1, padding: '8px 0', borderRadius: cfg.borderRadius, background: cfg.warning, color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>Warning</div>
                <div style={{ flex: 1, padding: '8px 0', borderRadius: cfg.borderRadius, background: cfg.error, color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>Error</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div style={{ flex: 1, minWidth: 360 }}>
          {/* 1. Core Colors */}
          <SectionCard title="Core Colors" desc="Main background and surface colors">
            {colorFields([
              { key: 'bgPrimary', label: 'Primary Background', varName: 'bg-primary' },
              { key: 'bgSecondary', label: 'Secondary Background', varName: 'bg-secondary' },
              { key: 'bgCard', label: 'Card/Surface', varName: 'bg-card' },
              { key: 'bgElevated', label: 'Elevated Surface', varName: 'bg-elevated' },
            ])}
          </SectionCard>

          {/* 2. Text Colors */}
          <SectionCard title="Text Colors" desc="Text hierarchy colors">
            {colorFields([
              { key: 'textPrimary', label: 'Primary Text', varName: 'text-primary' },
              { key: 'textSecondary', label: 'Secondary Text', varName: 'text-secondary' },
              { key: 'textMuted', label: 'Muted Text', varName: 'text-muted' },
            ])}
          </SectionCard>

          {/* 3. Accent Colors */}
          <SectionCard title="Accent Colors" desc="Interactive and highlight colors">
            {colorFields([
              { key: 'accentPrimary', label: 'Primary Accent', varName: 'accent-primary' },
              { key: 'accentSecondary', label: 'Secondary Accent', varName: 'accent-secondary' },
              { key: 'accentHover', label: 'Accent Hover', varName: 'accent-hover' },
            ])}
          </SectionCard>

          {/* 4. Semantic Colors */}
          <SectionCard title="Semantic Colors" desc="Status and feedback colors">
            {colorFields([
              { key: 'success', label: 'Success', varName: 'success' },
              { key: 'warning', label: 'Warning', varName: 'warning' },
              { key: 'error', label: 'Error', varName: 'error' },
            ])}
          </SectionCard>

          {/* 5. Typography */}
          <SectionCard title="Typography" desc="Font families and border radius">
            <Field label="Primary Font" desc="Body text font stack">
              <Input value={cfg.fontPrimary} onChange={e => upd('fontPrimary', e.target.value)} placeholder="Inter, sans-serif" />
            </Field>
            <Field label="Heading Font" desc="Heading font stack">
              <Input value={cfg.fontHeading} onChange={e => upd('fontHeading', e.target.value)} placeholder="Inter Tight, Inter, sans-serif" />
            </Field>
            <Field label="Border Radius" desc="Default border radius value (e.g. 12px, 0.75rem)">
              <Input value={cfg.borderRadius} onChange={e => upd('borderRadius', e.target.value)} placeholder="12px" />
            </Field>
          </SectionCard>

          {/* 6. Branding */}
          <SectionCard title="Branding" desc="Logo and brand identity">
            <Field label="Logo URL" desc="Direct URL to your logo image">
              <Input value={cfg.logoUrl} onChange={e => upd('logoUrl', e.target.value)} placeholder="https://..." />
            </Field>
            {cfg.logoUrl && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-canvas)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={cfg.logoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{cfg.brandName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cfg.brandTagline}</div>
                </div>
              </div>
            )}
            <Field label="Brand Name">
              <Input value={cfg.brandName} onChange={e => upd('brandName', e.target.value)} placeholder="Tirbeo" />
            </Field>
            <Field label="Brand Tagline">
              <Input value={cfg.brandTagline} onChange={e => upd('brandTagline', e.target.value)} placeholder="Build communities. Share ideas." />
            </Field>
          </SectionCard>

          {/* 7. Email Colors */}
          <SectionCard title="Email Colors" desc="Colors used in transactional email templates">
            {colorFields([
              { key: 'emailHeaderBg', label: 'Email Header Background', varName: 'email-header-bg' },
              { key: 'emailButtonColor', label: 'Email Button Color', varName: 'email-button-color' },
              { key: 'emailTextColor', label: 'Email Text Color', varName: 'email-text-color' },
            ])}
          </SectionCard>

          {/* 8. Light Theme Overrides */}
          <SectionCard title="Light Theme" desc="Optional overrides for light mode (leave empty to auto-derive)">
            {colorFields([
              { key: 'lightBgPrimary', label: 'Light Primary Background', varName: 'light-bg-primary' },
              { key: 'lightBgSecondary', label: 'Light Secondary Background', varName: 'light-bg-secondary' },
              { key: 'lightTextPrimary', label: 'Light Primary Text', varName: 'light-text-primary' },
              { key: 'lightAccentPrimary', label: 'Light Accent', varName: 'light-accent-primary' },
            ])}
          </SectionCard>

          {/* Actions */}
          <div className="card" style={{ marginTop: 8 }}>
            <div className="card-body" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={reset} type="button">Reset to Default</button>
              <button className="btn btn-primary" onClick={save} disabled={saving} type="button">
                {saving ? 'Saving...' : 'Save Theme'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingsPage>
  );
}
