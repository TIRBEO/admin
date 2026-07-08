'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, ItemRow, AddButton, Toast, EmptyState } from '../../shared';

const APP = 'landing';
const SECTION = 'redirects';

const DEFAULTS: { redirects: Record<string, string> } = {
  redirects: {},
};

export default function RedirectsPage() {
  const [cfg, setCfg] = useState<{ redirects: Record<string, string> }>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/admin/site-config?app=${APP}`);
    if (res.ok) {
      const data = await res.json();
      const stored = data?.config?.[SECTION] || {};
      setCfg({ ...DEFAULTS, ...stored, redirects: stored.redirects || {} });
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

  const entries = Object.entries(cfg.redirects);

  const addRedirect = () => {
    const key = `/old-path-${entries.length + 1}`;
    setCfg(prev => ({ ...prev, redirects: { ...prev.redirects, [key]: '/new-path' } }));
  };

  const removeRedirect = (from: string) => {
    setCfg(prev => {
      const r = { ...prev.redirects };
      delete r[from];
      return { ...prev, redirects: r };
    });
  };

  const updateFrom = (oldFrom: string, newFrom: string) => {
    setCfg(prev => {
      const r = { ...prev.redirects };
      const val = r[oldFrom];
      delete r[oldFrom];
      r[newFrom] = val;
      return { ...prev, redirects: r };
    });
  };

  const updateTo = (from: string, to: string) => {
    setCfg(prev => ({ ...prev, redirects: { ...prev.redirects, [from]: to } }));
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Redirects" desc="Manage path-to-path URL redirects for tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="URL Redirects">
        <div style={{ marginBottom: 12 }}>
          <AddButton onClick={addRedirect} label="Add Redirect" />
        </div>
        {entries.length === 0 && <EmptyState text="No redirects configured" />}
        {entries.map(([from, to]) => (
          <NestedRedirectCard
            key={from}
            from={from}
            to={to}
            onUpdateFrom={v => updateFrom(from, v)}
            onUpdateTo={v => updateTo(from, v)}
            onRemove={() => removeRedirect(from)}
          />
        ))}
      </SectionCard>
    </SettingsPage>
  );
}

function NestedRedirectCard({ from, to, onUpdateFrom, onUpdateTo, onRemove }: {
  from: string; to: string;
  onUpdateFrom: (v: string) => void; onUpdateTo: (v: string) => void; onRemove: () => void;
}) {
  return (
    <div className="nested-card" style={{ position: 'relative' }}>
      <button className="btn btn-icon btn-danger" onClick={onRemove} title="Remove" style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 16, lineHeight: 1 }}>×</button>
      <Field label="From Path">
        <Input value={from} onChange={e => onUpdateFrom(e.target.value)} placeholder="/old-path" />
      </Field>
      <Field label="To Path">
        <Input value={to} onChange={e => onUpdateTo(e.target.value)} placeholder="/new-path" />
      </Field>
    </div>
  );
}
