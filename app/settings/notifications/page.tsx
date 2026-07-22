'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Select, Toggle, Toast } from '../shared';

interface Prefs {
  emailDigest: string;
  digestTime: string;
  mention: boolean;
  comment: boolean;
  report: boolean;
  system: boolean;
  marketing: boolean;
}

const DEFAULTS: Prefs = {
  emailDigest: 'daily',
  digestTime: '08:00',
  mention: true,
  comment: true,
  report: true,
  system: true,
  marketing: false,
};

export default function NotificationPrefsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/notifications/prefs');
    if (res.ok) { const d = await res.json(); setPrefs({ ...DEFAULTS, ...d }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const res = await apiFetch('/api/admin/notifications/prefs', {
      method: 'PUT', body: JSON.stringify(prefs),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Preferences saved' });
    else setMsg({ type: 'error', text: 'Save failed' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs(p => ({ ...p, [k]: v }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Notification Preferences" desc="Control how and when you receive notifications" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Email Digest" desc="How often to receive email summaries">
        <Field label="Digest Frequency">
          <Select value={prefs.emailDigest} onChange={e => upd('emailDigest', e.target.value)}>
            <option value="off">Off (no email)</option>
            <option value="instant">Instant (send immediately)</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </Select>
        </Field>
        {prefs.emailDigest !== 'off' && prefs.emailDigest !== 'instant' && (
          <Field label="Digest Time" desc="Time of day to send (UTC)">
            <input type="time" className="input" value={prefs.digestTime} onChange={e => upd('digestTime', e.target.value)} style={{ width: 120 }} />
          </Field>
        )}
      </SectionCard>

      <SectionCard title="Notification Types" desc="Which events to notify you about">
        <Field label="Mentions" desc="When someone mentions you" horizontal>
          <Toggle checked={prefs.mention} onChange={v => upd('mention', v)} />
        </Field>
        <Field label="Comments" desc="Replies to your content" horizontal>
          <Toggle checked={prefs.comment} onChange={v => upd('comment', v)} />
        </Field>
        <Field label="Reports" desc="Content report updates" horizontal>
          <Toggle checked={prefs.report} onChange={v => upd('report', v)} />
        </Field>
        <Field label="System Alerts" desc="System-wide announcements" horizontal>
          <Toggle checked={prefs.system} onChange={v => upd('system', v)} />
        </Field>
        <Field label="Marketing" desc="Product updates and promotions" horizontal>
          <Toggle checked={prefs.marketing} onChange={v => upd('marketing', v)} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
