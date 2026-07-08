'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, ColorInput, Toast } from '../../shared';

const APP = 'landing';
const SECTION = 'newsletter';

const DEFAULTS = {
  badge: 'Stay Updated',
  headline: 'Get early access to Tirbeo.',
  subtext: 'Be the first to know when we launch. No spam, ever.',
  placeholder: 'you@example.com',
  buttonLabel: 'Subscribe',
  disclaimer: 'We respect your privacy. Unsubscribe at any time.',
  accentColor: '#4f7aff',
};

export default function NewsletterPage() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/admin/site-config?app=${APP}`);
    if (res.ok) {
      const data = await res.json();
      const stored = data?.config?.[SECTION] || {};
      setCfg({ ...DEFAULTS, ...stored });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch(`/api/admin/site-config?app=${APP}`).then(r => r.ok ? r.json() : { config: {} });
    const merged = { ...(full.config || {}), [SECTION]: cfg };
    const res = await apiFetch(`/api/admin/site-config?app=${APP}`, {
      method: 'PUT', body: JSON.stringify({ config: merged }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Saved!' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const update = (patch: Record<string, any>) => setCfg(prev => ({ ...prev, ...patch }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Newsletter" desc="Configure the newsletter signup section on the landing page" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="Badge & Headlines">
        <Field label="Badge" desc="Small label above the headline">
          <Input value={cfg.badge} onChange={e => update({ badge: e.target.value })} />
        </Field>
        <Field label="Headline">
          <Input value={cfg.headline} onChange={e => update({ headline: e.target.value })} />
        </Field>
        <Field label="Subtext" desc="Supporting text below the headline">
          <Textarea value={cfg.subtext} onChange={e => update({ subtext: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Form">
        <Field label="Input Placeholder">
          <Input value={cfg.placeholder} onChange={e => update({ placeholder: e.target.value })} />
        </Field>
        <Field label="Button Label">
          <Input value={cfg.buttonLabel} onChange={e => update({ buttonLabel: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Footer">
        <Field label="Disclaimer" desc="Small text below the form">
          <Input value={cfg.disclaimer} onChange={e => update({ disclaimer: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Styling">
        <Field label="Accent Color" desc="Color used for buttons and highlights">
          <ColorInput value={cfg.accentColor} onChange={v => update({ accentColor: v })} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
