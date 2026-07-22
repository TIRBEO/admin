'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Toast, EmptyState, Input, Select, Field } from '../../shared';

interface Template {
  id: string;
  name: string;
  label: string;
  subject: string;
  htmlBody: string;
  variables: { name: string; label: string; defaultValue: string }[];
  fromEmail: string | null;
  fromName: string | null;
  createdAt: string;
  updatedAt: string;
}

const PRESETS = [
  {
    name: 'signup_otp',
    label: 'Signup OTP',
    subject: 'Your Tirbeo verification code is {{otp}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #d0d7de} h1{font-size:24px;color:#1f2328;margin:0 0 8px} p{color:#656d76;font-size:14px;line-height:1.5} .code{font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#1f2328;margin:24px 0;padding:16px;background:#f6f8fa;border-radius:6px} .footer{font-size:12px;color:#8b949e;margin-top:24px;border-top:1px solid #d0d7de;padding-top:16px}</style></head><body><div class="card"><h1>Verify your email</h1><p>Use this code to complete your signup:</p><div class="code">{{otp}}</div><p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'otp', label: 'OTP Code', defaultValue: '123456' }],
  },
  {
    name: 'password_reset',
    label: 'Password Reset',
    subject: 'Reset your Tirbeo password',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #d0d7de} h1{font-size:24px;color:#1f2328;margin:0 0 8px} p{color:#656d76;font-size:14px;line-height:1.5} .btn{display:inline-block;padding:12px 24px;background:#238636;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#8b949e;margin-top:24px;border-top:1px solid #d0d7de;padding-top:16px}</style></head><body><div class="card"><h1>Reset your password</h1><p>Click the button below to reset your password. This link expires in 1 hour.</p><a href="{{resetLink}}" class="btn">Reset Password</a><p>Or copy this URL: <br/><code style="font-size:12px;word-break:break-all">{{resetLink}}</code></p><p>If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'resetLink', label: 'Reset URL', defaultValue: 'https://accounts.tirbeo.app/reset?token=abc' }],
  },
  {
    name: 'welcome',
    label: 'Welcome Email',
    subject: 'Welcome to Tirbeo, {{name}}!',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #d0d7de} h1{font-size:24px;color:#1f2328;margin:0 0 8px} p{color:#656d76;font-size:14px;line-height:1.5} .footer{font-size:12px;color:#8b949e;margin-top:24px;border-top:1px solid #d0d7de;padding-top:16px}</style></head><body><div class="card"><h1>Welcome to Tirbeo, {{name}}!</h1><p>Your account is ready. Start exploring communities, connecting with people, and sharing ideas.</p><p>If you have any questions, reply to this email or visit our Help Center.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'name', label: 'User Name', defaultValue: 'John' }],
  },
  {
    name: 'notification_digest',
    label: 'Notification Digest',
    subject: 'Your Tirbeo digest — {{count}} new updates',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #d0d7de} h1{font-size:24px;color:#1f2328;margin:0 0 8px} p{color:#656d76;font-size:14px;line-height:1.5} .item{padding:12px 0;border-bottom:1px solid #f0f0f0} .footer{font-size:12px;color:#8b949e;margin-top:24px;border-top:1px solid #d0d7de;padding-top:16px}</style></head><body><div class="card"><h1>Your Digest</h1><p>You have <strong>{{count}}</strong> new updates since your last visit.</p>{{digestItems}}<a href="{{dashboardUrl}}" style="display:inline-block;padding:12px 24px;background:#238636;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;margin:16px 0">View All</a><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'count', label: 'Notification Count', defaultValue: '5' },
      { name: 'digestItems', label: 'HTML Items', defaultValue: '...' },
      { name: 'dashboardUrl', label: 'Dashboard URL', defaultValue: 'https://tirbeo.app/dashboard' },
    ],
  },
  {
    name: 'invoice',
    label: 'Invoice / Receipt',
    subject: 'Your Tirbeo receipt — {{plan}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #d0d7de} h1{font-size:24px;color:#1f2328;margin:0 0 8px} p{color:#656d76;font-size:14px;line-height:1.5} .table{width:100%;border-collapse:collapse;margin:16px 0} .table td{padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px} .footer{font-size:12px;color:#8b949e;margin-top:24px;border-top:1px solid #d0d7de;padding-top:16px}</style></head><body><div class="card"><h1>Receipt</h1><p>Thank you for your payment, {{name}}.</p><table class="table"><tr><td>Plan</td><td><strong>{{plan}}</strong></td></tr><tr><td>Amount</td><td><strong>{{amount}}</strong></td></tr><tr><td>Date</td><td><strong>{{date}}</strong></td></tr></table><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'name', label: 'User Name', defaultValue: 'John' },
      { name: 'plan', label: 'Plan Name', defaultValue: 'Pro Monthly' },
      { name: 'amount', label: 'Amount', defaultValue: '$19.99' },
      { name: 'date', label: 'Date', defaultValue: 'July 9, 2026' },
    ],
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [preset, setPreset] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newHtml, setNewHtml] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = async () => {
    const res = await apiFetch('/api/admin/email/templates');
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteTpl = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const res = await apiFetch(`/api/admin/email/templates/${id}`, { method: 'DELETE' });
    if (res.ok) { setMsg({ type: 'success', text: 'Template deleted' }); load(); }
    else setMsg({ type: 'error', text: 'Delete failed' });
    setTimeout(() => setMsg(null), 3000);
  };

  const createFromPreset = async () => {
    const p = PRESETS.find(x => x.name === preset);
    if (!p) return;
    const res = await apiFetch('/api/admin/email/templates', {
      method: 'POST',
      body: JSON.stringify({ name: p.name, label: newLabel || p.label, subject: newSubject || p.subject, htmlBody: newHtml || p.htmlBody, variables: p.variables }),
    });
    if (res.ok) { setMsg({ type: 'success', text: 'Template created' }); setShowCreate(false); load(); }
    else { const e = await res.json(); setMsg({ type: 'error', text: e.error || 'Create failed' }); }
    setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Email Templates" desc="Manage HTML email templates with variable placeholders">
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showCreate && (
        <SectionCard title="Create from Preset">
          <Field label="Preset">
            <Select value={preset} onChange={e => {
              setPreset(e.target.value);
              const p = PRESETS.find(x => x.name === e.target.value);
              if (p) { setNewLabel(p.label); setNewSubject(p.subject); setNewHtml(p.htmlBody); }
            }}>
              <option value="">Select a preset</option>
              {PRESETS.map(p => <option key={p.name} value={p.name}>{p.label}</option>)}
            </Select>
          </Field>
          {preset && (
            <>
              <Field label="Label">
                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} />
              </Field>
              <Field label="Subject">
                <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              </Field>
              <Field label="HTML Body">
                <textarea className="textarea" rows={8} value={newHtml} onChange={e => setNewHtml(e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              </Field>
              <button className="btn btn-primary" onClick={createFromPreset}>Create Template</button>
            </>
          )}
        </SectionCard>
      )}

      {templates.length === 0 && !showCreate ? (
        <EmptyState text="No email templates yet. Create one to get started." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Label</th>
                <th>Subject</th>
                <th>Variables</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td><code style={{ fontSize: 12, color: 'var(--accent)' }}>{t.name}</code></td>
                  <td>{t.label}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                  <td>{(t.variables as Array<{ name: string }>)?.length || 0}</td>
                  <td>
                    <div className="flex gap-1">
                      <a href={`/settings/email/templates/${t.id}`} className="btn btn-outline btn-sm">Edit</a>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteTpl(t.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsPage>
  );
}
