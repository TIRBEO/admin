'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, ColorInput, Toast } from '../../shared';

const APP = 'landing';
const SECTION = 'about';

const DEFAULTS = {
  headline: 'About Tirbeo',
  paragraphs: 'Tirbeo is a community-first platform designed for meaningful conversations.\nBuilt for developers, designers, educators, and startups — Tirbeo helps you connect, share, and thrive together.',
  textColor: '#ededee',
};

export default function AboutPage() {
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
    <SettingsPage title="About" desc="Configure the about section of the landing page" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="Content">
        <Field label="Headline">
          <Input value={cfg.headline} onChange={e => update({ headline: e.target.value })} />
        </Field>
        <Field label="Paragraphs" desc="One paragraph per line. Each line becomes a separate paragraph.">
          <Textarea value={cfg.paragraphs} onChange={e => update({ paragraphs: e.target.value })} rows={6} />
        </Field>
      </SectionCard>
      <SectionCard title="Styling">
        <Field label="Text Color">
          <ColorInput value={cfg.textColor} onChange={v => update({ textColor: v })} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
