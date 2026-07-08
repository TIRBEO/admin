'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, ColorInput, Toast } from '../../shared';

const APP = 'landing';
const SECTION = 'hero';

const DEFAULTS = {
  bgImage: '',
  headline1: 'Connect.',
  headline2: 'Share.',
  headline2Gradient: '#4f7aff',
  subtitle: 'Tirbeo is the community-first platform for meaningful conversations.',
  cta1Text: 'Get Started',
  cta1Url: '/login',
  cta2Text: 'Learn More',
  cta2Url: '/about',
  scrollText: 'Scroll to explore',
};

export default function HeroPage() {
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
    <SettingsPage title="Hero" desc="Configure the hero section of the landing page" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="Background">
        <Field label="Background Image URL" desc="Full-width hero background">
          <Input value={cfg.bgImage} onChange={e => update({ bgImage: e.target.value })} placeholder="https://tirbeo.app/hero-bg.jpg" />
        </Field>
      </SectionCard>
      <SectionCard title="Headlines">
        <Field label="Headline 1" desc="First headline line">
          <Input value={cfg.headline1} onChange={e => update({ headline1: e.target.value })} />
        </Field>
        <Field label="Headline 2" desc="Second headline line">
          <Input value={cfg.headline2} onChange={e => update({ headline2: e.target.value })} />
        </Field>
        <Field label="Headline 2 Gradient Color" desc="Gradient color for the second headline">
          <ColorInput value={cfg.headline2Gradient} onChange={v => update({ headline2Gradient: v })} />
        </Field>
      </SectionCard>
      <SectionCard title="Subtitle">
        <Field label="Subtitle">
          <Textarea value={cfg.subtitle} onChange={e => update({ subtitle: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Call to Action Buttons">
        <Field label="CTA 1 Text">
          <Input value={cfg.cta1Text} onChange={e => update({ cta1Text: e.target.value })} />
        </Field>
        <Field label="CTA 1 URL">
          <Input value={cfg.cta1Url} onChange={e => update({ cta1Url: e.target.value })} />
        </Field>
        <Field label="CTA 2 Text">
          <Input value={cfg.cta2Text} onChange={e => update({ cta2Text: e.target.value })} />
        </Field>
        <Field label="CTA 2 URL">
          <Input value={cfg.cta2Url} onChange={e => update({ cta2Url: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Scroll Indicator">
        <Field label="Scroll Text" desc="Text shown below the hero to indicate scrolling">
          <Input value={cfg.scrollText} onChange={e => update({ scrollText: e.target.value })} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
