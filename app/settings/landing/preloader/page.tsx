'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, Toggle, ColorInput, Toast } from '../../shared';

const APP = 'landing';
const SECTION = 'preloader';

const DEFAULTS = {
  enabled: true,
  greetings: 'Hello\nNamaste\nWelcome',
  cycleIntervalMs: 2000,
  durationMs: 800,
  textColor: '#ffffff',
  backgroundColor: '#00072d',
};

export default function PreloaderPage() {
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
    <SettingsPage title="Preloader" desc="Configure the preloader / splash screen for tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="General">
        <Field label="Enabled" horizontal>
          <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} />
        </Field>
      </SectionCard>
      <SectionCard title="Greetings">
        <Field label="Greetings" desc="One greeting per line. Each cycles through during the preloader.">
          <Textarea value={cfg.greetings} onChange={e => update({ greetings: e.target.value })} rows={5} />
        </Field>
      </SectionCard>
      <SectionCard title="Timing">
        <Field label="Cycle Interval (ms)" desc="How long each greeting displays before switching">
          <Input type="number" min={500} max={10000} value={cfg.cycleIntervalMs} onChange={e => update({ cycleIntervalMs: Number(e.target.value) })} />
        </Field>
        <Field label="Duration (ms)" desc="Total preloader duration">
          <Input type="number" min={200} max={15000} value={cfg.durationMs} onChange={e => update({ durationMs: Number(e.target.value) })} />
        </Field>
      </SectionCard>
      <SectionCard title="Styling">
        <Field label="Text Color">
          <ColorInput value={cfg.textColor} onChange={v => update({ textColor: v })} />
        </Field>
        <Field label="Background Color">
          <ColorInput value={cfg.backgroundColor} onChange={v => update({ backgroundColor: v })} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
