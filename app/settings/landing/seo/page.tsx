'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, Toast } from '../../shared';

const APP = 'landing';
const SECTION = 'seo';

const DEFAULTS = {
  title: 'Tirbeo — Connect. Share. Belong.',
  description: 'Connect with people who inspire you, share the moments that matter, and become part of communities that make the internet feel personal again.',
  keywords: 'Tirbeo, social platform, community, messaging, real-time chat',
  ogImage: '',
  favicon: '/logo1.png',
};

export default function SeoPage() {
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
      const keywords = Array.isArray(stored.keywords) ? stored.keywords.join(', ') : (stored.keywords || '');
      setCfg({ ...DEFAULTS, ...stored, keywords });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch(`/api/admin/site-config?app=${APP}`).then(r => r.ok ? r.json() : { config: {} });
    const payload = { ...cfg, keywords: cfg.keywords.split(',').map(k => k.trim()).filter(Boolean) };
    const merged = { ...(full.config || {}), [SECTION]: payload };
    const res = await apiFetch(`/api/admin/site-config?app=${APP}`, {
      method: 'PUT', body: JSON.stringify({ config: merged }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Saved!' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const update = (patch: Record<string, any>) => setCfg(prev => ({ ...prev, ...patch }));

  if (loading) return <div className="loading">Loading\u2026</div>;

  return (
    <SettingsPage title="SEO" desc="Configure search engine optimization settings for tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="Meta Tags">
        <Field label="Page Title" desc="Shown in browser tabs and search results (max 60 chars)">
          <Input value={cfg.title} onChange={e => update({ title: e.target.value })} />
        </Field>
        <Field label="Description" desc="Shown in search results (max 160 chars)">
          <Textarea value={cfg.description} onChange={e => update({ description: e.target.value })} rows={3} />
        </Field>
        <Field label="Keywords" desc="Comma-separated keywords">
          <Input value={cfg.keywords} onChange={e => update({ keywords: e.target.value })} placeholder="Tirbeo, social, community" />
        </Field>
      </SectionCard>
      <SectionCard title="Social Preview">
        <Field label="OG Image URL" desc="Image shown when shared on social media (1200x630 recommended)">
          <Input value={cfg.ogImage} onChange={e => update({ ogImage: e.target.value })} placeholder="https://tirbeo.app/og.png" />
        </Field>
      </SectionCard>
      <SectionCard title="Assets">
        <Field label="Favicon URL" desc="Browser tab icon">
          <Input value={cfg.favicon} onChange={e => update({ favicon: e.target.value })} placeholder="/logo1.png" />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
