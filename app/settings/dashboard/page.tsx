'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Select, Toast } from '../shared';

const DEFAULTS = {
  defaultHome: 'overview',
  itemsPerPage: 25,
  showActivityFeed: true,
  showQuickActions: true,
  showStats: true,
  enableNotifications: true,
  enableDarkMode: true,
  allowCustomTheme: true,
  sidebarCollapsedByDefault: false,
  showOnlineUsers: true,
  maxUploadSizeMb: 5,
  allowedFileTypes: 'jpg, png, gif, pdf, doc',
};

type Config = typeof DEFAULTS;

export default function DashboardSettingsPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/site-config?app=dashboard');
    if (res.ok) { const d = await res.json(); if (d?.config) setCfg({ ...DEFAULTS, ...d.config }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=dashboard').then(r => r.ok ? r.json() : { config: {} });
    const res = await apiFetch('/api/admin/site-config?app=dashboard', {
      method: 'PUT', body: JSON.stringify({ config: { ...(full.config || {}), ...cfg } }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Dashboard settings saved' }); else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof Config>(k: K, v: Config[K]) => setCfg(p => ({ ...p, [k]: v }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Dashboard Settings" desc="Configure dashboard.tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Layout" desc="Default dashboard appearance">
        <Field label="Default Home View">
          <Select value={cfg.defaultHome} onChange={e => upd('defaultHome', e.target.value)}>
            <option value="overview">Overview</option>
            <option value="activity">Activity Feed</option>
            <option value="messages">Messages</option>
          </Select>
        </Field>
        <Field label="Items Per Page">
          <Input type="number" min={5} max={100} value={cfg.itemsPerPage} onChange={e => upd('itemsPerPage', Number(e.target.value))} />
        </Field>
        <Field label="Show Stats Cards" horizontal>
          <Toggle checked={cfg.showStats} onChange={v => upd('showStats', v)} />
        </Field>
        <Field label="Show Quick Actions" horizontal>
          <Toggle checked={cfg.showQuickActions} onChange={v => upd('showQuickActions', v)} />
        </Field>
        <Field label="Show Activity Feed" horizontal>
          <Toggle checked={cfg.showActivityFeed} onChange={v => upd('showActivityFeed', v)} />
        </Field>
        <Field label="Show Online Users" horizontal>
          <Toggle checked={cfg.showOnlineUsers} onChange={v => upd('showOnlineUsers', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Preferences" desc="User experience settings">
        <Field label="Enable Notifications" horizontal>
          <Toggle checked={cfg.enableNotifications} onChange={v => upd('enableNotifications', v)} />
        </Field>
        <Field label="Allow Dark Mode" horizontal>
          <Toggle checked={cfg.enableDarkMode} onChange={v => upd('enableDarkMode', v)} />
        </Field>
        <Field label="Allow Custom Theme" horizontal>
          <Toggle checked={cfg.allowCustomTheme} onChange={v => upd('allowCustomTheme', v)} />
        </Field>
        <Field label="Sidebar Collapsed by Default" horizontal>
          <Toggle checked={cfg.sidebarCollapsedByDefault} onChange={v => upd('sidebarCollapsedByDefault', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Uploads" desc="File upload limits">
        <Field label="Max Upload Size" desc="Megabytes">
          <Input type="number" min={1} max={50} value={cfg.maxUploadSizeMb} onChange={e => upd('maxUploadSizeMb', Number(e.target.value))} />
        </Field>
        <Field label="Allowed File Types" desc="Comma-separated">
          <Input value={cfg.allowedFileTypes} onChange={e => upd('allowedFileTypes', e.target.value)} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
