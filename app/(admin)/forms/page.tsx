'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib';
import {
  FileText, Globe, EyeOff, Search, ExternalLink,
  Trash2, Play, Pause, RefreshCcw,
  ShieldAlert, UserX, Clock, UserCheck, Ban, ShieldCheck,
} from 'lucide-react';

export default function AdminFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ownerBusyId, setOwnerBusyId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch('/api/admin/forms?limit=200')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setForms(data.forms || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const setStatus = async (f: any, status: string) => {
    setBusyId(f.id);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/forms/${f.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const t = await res.text(); setError(t || 'Failed to update'); }
      else load();
    } catch (e: any) { setError(e.message || 'Failed to update'); }
    finally { setBusyId(null); }
  };

  const remove = async (f: any) => {
    if (!window.confirm(`Delete form "${f.title}" and all its responses? This cannot be undone.`)) return;
    setBusyId(f.id);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/forms/${f.id}`, { method: 'DELETE' });
      if (!res.ok) { const t = await res.text(); setError(t || 'Failed to delete'); }
      else load();
    } catch (e: any) { setError(e.message || 'Failed to delete'); }
    finally { setBusyId(null); }
  };

  // Moderate the form owner (ban/suspend spammers).
  const moderateOwner = async (f: any, action: 'ban' | 'suspend' | 'unban' | 'unsuspend') => {
    if (!f.user?.id) return;
    setMenuId(null);
    const email = f.user.email;
    let reason = '';
    let durationDays: number | undefined;

    if (action === 'ban') {
      reason = (window.prompt(`Ban ${email}? Enter a reason (required):`, 'Form spam') || '').trim();
      if (!reason) return;
      if (!window.confirm(`Ban ${email}? They will be logged out of all sessions and blocked from using Tirbeo.`)) return;
    } else if (action === 'suspend') {
      reason = (window.prompt(`Suspend ${email}? Enter a reason (required):`, 'Form spam') || '').trim();
      if (!reason) return;
      const d = (window.prompt('Suspend for how many days? (blank = indefinite):', '7') || '').trim();
      const days = parseInt(d, 10);
      if (!Number.isNaN(days) && days > 0) durationDays = days;
      if (!window.confirm(`Suspend ${email}${durationDays ? ` for ${durationDays} day(s)` : ' indefinitely'}? They will be logged out of all sessions.`)) return;
    } else if (action === 'unban') {
      if (!window.confirm(`Unban ${email}?`)) return;
    } else {
      if (!window.confirm(`Unsuspend ${email}?`)) return;
    }

    setOwnerBusyId(f.id);
    setError('');
    try {
      const body = action === 'unban' || action === 'unsuspend'
        ? {}
        : { reason, ...(durationDays !== undefined ? { durationDays } : {}) };
      const res = await apiFetch(`/api/admin/users/${f.user.id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) { const t = await res.text(); setError(t || `Failed to ${action} user`); }
      else load();
    } catch (e: any) { setError(e.message || `Failed to ${action} user`); }
    finally { setOwnerBusyId(null); }
  };

  const filtered = forms.filter((f: any) =>
    f.title?.toLowerCase().includes(search.toLowerCase()) ||
    f.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">Forms</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage and moderate all forms across the platform</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-[var(--color-error)] bg-[var(--color-error-surface)] text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search forms..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">No forms found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3 font-medium text-right">Responses</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f: any) => (
                <tr key={f.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      <span className="font-medium text-[var(--color-text)]">{f.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[var(--color-text-secondary)]">{f.user?.email || '—'}</span>
                      {f.ownerStatus === 'banned' || f.ownerStatus === 'suspended' ? (
                        <span className={cn(
                          'inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                          f.ownerStatus === 'banned'
                            ? 'bg-[var(--color-error-surface)] text-[var(--color-error)]'
                            : 'bg-[var(--color-warning-surface)] text-[var(--color-warning)]'
                        )}>
                          {f.ownerStatus === 'banned' ? <Ban className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          {f.ownerStatus}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      f.visibility === 'public'
                        ? 'bg-[var(--color-success-surface)] text-[var(--color-success)]'
                        : 'bg-[var(--color-surface-muted)] text-[var(--color-text-tertiary)]'
                    )}>
                      {f.visibility === 'public' ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {f.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                    {f.responseCount ?? f._count?.responses ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {f.status === 'published' ? (
                        <button onClick={() => setStatus(f, 'draft')} disabled={busyId === f.id}
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-50"
                          title="Unpublish">
                          <Pause className="w-3.5 h-3.5" /> Unpublish
                        </button>
                      ) : (
                        <button onClick={() => setStatus(f, 'published')} disabled={busyId === f.id}
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-success)] hover:underline disabled:opacity-50"
                          title="Publish">
                          <Play className="w-3.5 h-3.5" /> Publish
                        </button>
                      )}
                      <button onClick={() => router.push(`/admin/forms/${f.id}`)}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                        View <ExternalLink className="w-3 h-3" />
                      </button>
                      {f.user?.id && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuId(menuId === f.id ? null : f.id)}
                            disabled={ownerBusyId === f.id}
                            className={cn(
                              'inline-flex items-center gap-1 text-xs rounded-md px-2 py-1 border transition-colors disabled:opacity-50',
                              f.ownerStatus === 'banned'
                                ? 'border-[var(--color-error)]/30 text-[var(--color-error)] hover:bg-[var(--color-error-surface)]'
                                : f.ownerStatus === 'suspended'
                                  ? 'border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:bg-[var(--color-warning-surface)]'
                                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                            )}
                            title="Moderate owner">
                            {ownerBusyId === f.id ? 'Working…' : <><ShieldAlert className="w-3.5 h-3.5" /> Owner</>}
                          </button>
                          {menuId === f.id && (
                            <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} aria-hidden="true" />
                            <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
                              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                                Moderate owner
                              </div>
                              {f.ownerStatus === 'banned' ? (
                                <button onClick={() => moderateOwner(f, 'unban')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-success)] hover:bg-[var(--color-surface-muted)]">
                                  <UserCheck className="w-3.5 h-3.5" /> Unban user
                                </button>
                              ) : (
                                <button onClick={() => moderateOwner(f, 'ban')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-error)] hover:bg-[var(--color-surface-muted)]">
                                  <UserX className="w-3.5 h-3.5" /> Ban user
                                </button>
                              )}
                              {f.ownerStatus === 'suspended' ? (
                                <button onClick={() => moderateOwner(f, 'unsuspend')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-success)] hover:bg-[var(--color-surface-muted)]">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Unsuspend user
                                </button>
                              ) : (
                                <button onClick={() => moderateOwner(f, 'suspend')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-warning)] hover:bg-[var(--color-surface-muted)]">
                                  <Clock className="w-3.5 h-3.5" /> Suspend user
                                </button>
                              )}
                            </div>
                            </>
                          )}
                        </div>
                      )}
                      <button onClick={() => remove(f)} disabled={busyId === f.id}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-error)] hover:underline disabled:opacity-50"
                        title="Delete form">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
