'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, Toast, AddButton, ItemRow, NestedCard } from '../../../shared';
import { use } from 'react';

interface Variable { name: string; label: string; defaultValue: string; }

export default function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [label, setLabel] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/admin/email/templates/${id}`);
    if (!res.ok) return;
    const t = await res.json();
    setLabel(t.label || '');
    setSubject(t.subject || '');
    setHtmlBody(t.htmlBody || '');
    setVariables(t.variables || []);
    setFromEmail(t.fromEmail || '');
    setFromName(t.fromName || '');
    const pv: Record<string, string> = {};
    for (const v of (t.variables || []) as Variable[]) pv[v.name] = v.defaultValue || '';
    setPreviewVars(pv);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const res = await apiFetch(`/api/admin/email/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ label, subject, htmlBody, variables, fromEmail, fromName }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Template saved' });
    else setMsg({ type: 'error', text: 'Save failed' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const addVar = () => {
    setVariables(p => [...p, { name: '', label: '', defaultValue: '' }]);
  };

  const updateVar = (i: number, field: keyof Variable, value: string) => {
    setVariables(p => {
      const next = [...p];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeVar = (i: number) => {
    setVariables(p => p.filter((_, idx) => idx !== i));
  };

  const renderPreview = () => {
    let result = htmlBody;
    for (const v of variables) {
      const val = previewVars[v.name] || v.defaultValue || `{{${v.name}}}`;
      result = result.replace(new RegExp(`\\{\\{\\s*${v.name}\\s*\\}\\}`, 'g'), val);
    }
    return result;
  };

  const insertVar = (varName: string) => {
    setHtmlBody(p => p + ` {{${varName}}} `);
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title={`Edit Template: ${label}`} desc="Edit the email template HTML and variables" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Template Details">
        <Field label="Label">
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Signup OTP" />
        </Field>
        <Field label="Subject" desc="Use {{variable}} placeholders">
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your code is {{otp}}" />
        </Field>
        <Field label="From Email (optional)" desc="Override default sender">
          <Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@tirbeo.app" />
        </Field>
        <Field label="From Name (optional)" desc="Override default sender name">
          <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Tirbeo" />
        </Field>
      </SectionCard>

      <SectionCard title="Variables" desc="Define placeholders available for this template">
        {variables.length > 0 && <div className="flex gap-1" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
          {variables.map((v, i) => (
            <button key={i} className="btn btn-outline btn-sm" onClick={() => insertVar(v.name)} title={`Insert {{${v.name}}}`} style={{ fontSize: 11 }}>
              {'{{'}{v.name}{'}}'}
            </button>
          ))}
        </div>}
        <AddButton onClick={addVar} label="Add Variable" />
        {variables.map((v, i) => (
          <NestedCard key={i} onRemove={() => removeVar(i)}>
            <ItemRow>
              <Input placeholder="name" value={v.name} onChange={e => updateVar(i, 'name', e.target.value)} style={{ flex: 1 }} />
              <Input placeholder="Label" value={v.label} onChange={e => updateVar(i, 'label', e.target.value)} style={{ flex: 1 }} />
              <Input placeholder="Default" value={v.defaultValue} onChange={e => updateVar(i, 'defaultValue', e.target.value)} style={{ flex: 1 }} />
            </ItemRow>
          </NestedCard>
        ))}
      </SectionCard>

      <SectionCard title="HTML Body" desc="Full HTML email template. Use {{variable}} for dynamic content.">
        <div className="field">
          <label className="field-label"><span>HTML Source</span></label>
          <textarea
            className="textarea"
            rows={16}
            value={htmlBody}
            onChange={e => setHtmlBody(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6 }}
          />
        </div>
      </SectionCard>

      <SectionCard title="Preview" desc="How the email will look with sample values">
        <div className="field">
          <label className="field-label"><span>Preview Values</span></label>
          <div className="flex gap-1" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
            {variables.map((v, i) => (
              <Input key={i} placeholder={`${v.name}=${v.defaultValue}`} value={previewVars[v.name] || ''}
                onChange={e => setPreviewVars(p => ({ ...p, [v.name]: e.target.value }))} style={{ width: 160 }} />
            ))}
          </div>
        </div>
        <div style={{
          background: '#fff', color: '#1f2328', borderRadius: 'var(--radius-sm)',
          padding: 16, maxHeight: 400, overflow: 'auto', fontSize: 13,
        }}>
          <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
        </div>
      </SectionCard>
    </SettingsPage>
  );
}
