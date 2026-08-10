'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, ApiError } from '../../../../lib';
import { AlertTriangle, CheckCircle2, KeyRound, Mail, UserPlus } from 'lucide-react';
import { Toast } from '../../../settings/shared';

const ROLE_OPTIONS = [
  { value: '', label: 'Member (no admin access)' },
  { value: 'editor', label: 'Editor' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ email: string; temporaryPassword?: string; emailSent: boolean } | null>(null);

  const validate = () => {
    const fe: Record<string, string> = {};
    if (!email.trim()) fe.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) fe.email = 'Enter a valid email address';
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiPost('admin/users', {
        email: email.trim(),
        name: name.trim() || undefined,
        adminRole: adminRole || undefined,
        sendEmail,
      });
      setResult({ email: data.user.email, temporaryPassword: data.temporaryPassword, emailSent: data.emailSent });
    } catch (err: unknown) {
      if (err instanceof ApiError) setToast({ type: 'error', text: err.message });
      else setToast({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success-surface)]">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-[var(--color-admin-text)]">Admin account created</h2>
              <p className="text-sm text-[var(--color-admin-text-secondary)] mt-1">
                A temporary password was generated for <strong>{result.email}</strong>. The user will be asked to set a new password on first login.
              </p>
            </div>
          </div>

          {result.emailSent ? (
            <p className="text-sm text-[var(--color-admin-text-secondary)] mb-6">
              The temporary password has been emailed to <strong>{result.email}</strong>.
            </p>
          ) : (
            <p className="text-sm text-[var(--color-admin-text-secondary)] mb-6">
              The email could not be sent, so the temporary password is shown here. Share it with the user securely.
            </p>
          )}

          {result.temporaryPassword && (
            <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface-hover)] p-4 mb-6">
              <p className="text-xs uppercase tracking-wider text-[var(--color-admin-text-secondary)] mb-2">Temporary password</p>
              <div className="flex items-center justify-between gap-4">
                <code className="text-lg tracking-wide text-[var(--color-admin-text)] select-all break-all">{result.temporaryPassword}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(result.temporaryPassword!)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] text-sm text-[var(--color-admin-text-secondary)] hover:text-[var(--color-admin-text)] transition-colors"
                >
                  <KeyRound className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => router.push('/admin/directory/users')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
              Back to Users
            </button>
            <button onClick={() => { setResult(null); setEmail(''); setName(''); setAdminRole(''); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
              Add another user
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] overflow-hidden">
        <div className="border-b border-[var(--color-admin-border)] px-6 py-5">
          <h1 className="text-lg font-medium text-[var(--color-admin-text)] flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Add user
          </h1>
          <p className="text-sm text-[var(--color-admin-text-secondary)] mt-1">
            Create an account and email a temporary password. The user must set a new password on first sign-in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
          {error && (
            <div className="flex items-start gap-2 border-2 border-[var(--color-error)] bg-[var(--color-error-surface)] px-4 py-3 text-sm text-[var(--color-error)]">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-admin-text)] mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-admin-text-secondary)]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                placeholder="person@company.com"
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            {fieldErrors.email && <p className="text-sm text-[var(--color-error)] mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-admin-text)] mb-1.5">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="off"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label htmlFor="adminRole" className="block text-sm font-medium text-[var(--color-admin-text)] mb-1.5">Role</label>
            <select
              id="adminRole"
              value={adminRole}
              onChange={e => setAdminRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-admin-text-secondary)]">
              Email the temporary password to this user
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors">
              {loading ? 'Creating...' : 'Create account'}
            </button>
            <button type="button" onClick={() => router.push('/admin/directory/users')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
