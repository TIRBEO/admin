'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib';
import { Toast } from '../settings/shared';
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
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [moderateDialog, setModerateDialog] = useState<{ form: any; action: 'ban' | 'suspend' | 'unban' | 'unsuspend' } | null>(null);
  const [moderateReason, setModerateReason] = useState('Form spam');
  const [moderateDays, setModerateDays] = useState('7');

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
    try {
      const res = await apiFetch(`/api/admin/forms/${f.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const t = await res.text(); setMsg({ type: 'error', text: t || 'Failed to update' }); }
      else { load(); setMsg({ type: 'success', text: `Form ${status === 'published' ? 'published' : 'unpublished'}` }); }
    } catch (e: any) { setMsg({ type: 'error', text: e.message || 'Failed to update' }); }
    finally { setBusyId(null); }
  };

  const remove = async (f: any) => {
    setConfirmDelete(null);
    setBusyId(f.id);
    try {
      const res = await apiFetch(`/api/admin/forms/${f.id}`, { method: 'DELETE' });
      if (!res.ok) { const t = await res.text(); setMsg({ type: 'error', text: t || 'Failed to delete' }); }
      else { load(); setMsg({ type: 'success', text: 'Form deleted' }); }
    } catch (e: any) { setMsg({ type: 'error', text: e.message || 'Failed to delete' }); }
    finally { setBusyId(null); }
  };

  // Open moderation dialog
  const openModerate = (f: any, action: 'ban' | 'suspend' | 'unban' | 'unsuspend') => {
    if (!f.user?.id) return;
    setMenuId(null);
    setModerateDialog({ form: f, action });
    setModerateReason('Form spam');
    setModerateDays('7');
  };

  // Execute moderation action
  const executeModerate = async () => {
    if (!moderateDialog) return;
    const { form: f, action } = moderateDialog;
    const email = f.user.email;
    setModerateDialog(null);
    setOwnerBusyId(f.id);
    try {
      let body: any = {};
      if (action === 'ban' || action === 'suspend') {
        const reason = moderateReason.trim();
        if (!reason) { setMsg({ type: 'error', text: 'Reason is required' }); return; }
        body.reason = reason;
        if (action === 'suspend') {
          const days = parseInt(moderateDays, 10);
          if (!Number.isNaN(days) && days > 0) body.durationDays = days;
        }
      }
      const res = await apiFetch(`/api/admin/users/${f.user.id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) { const t = await res.text(); setMsg({ type: 'error', text: t || `Failed to ${action} user` }); }
      else { load(); setMsg({ type: 'success', text: `User ${action}ed` }); }
    } catch (e: any) { setMsg({ type: 'error', text: e.message || `Failed to ${action} user` }); }
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

      <Toast msg={msg} onClose={() => setMsg(null)} />

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
                                <button onClick={() => openModerate(f, 'unban')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-success)] hover:bg-[var(--color-surface-muted)]">
                                  <UserCheck className="w-3.5 h-3.5" /> Unban user
                                </button>
                              ) : (
                                <button onClick={() => openModerate(f, 'ban')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-error)] hover:bg-[var(--color-surface-muted)]">
                                  <UserX className="w-3.5 h-3.5" /> Ban user
                                </button>
                              )}
                              {f.ownerStatus === 'suspended' ? (
                                <button onClick={() => openModerate(f, 'unsuspend')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-success)] hover:bg-[var(--color-surface-muted)]">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Unsuspend user
                                </button>
                              ) : (
                                <button onClick={() => openModerate(f, 'suspend')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--color-warning)] hover:bg-[var(--color-surface-muted)]">
                                  <Clock className="w-3.5 h-3.5" /> Suspend user
                                </button>
                              )}
                            </div>
                            </>
                          )}
                        </div>
                      )}
                      <button onClick={() => setConfirmDelete(f)} disabled={busyId === f.id}
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

      {/* Moderation Dialog */}
      {moderateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModerateDialog(null)}>
          <div className="w-full max-w-md rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
              {moderateDialog.action === 'ban' && `Ban ${moderateDialog.form.user?.email}?`}
              {moderateDialog.action === 'suspend' && `Suspend ${moderateDialog.form.user?.email}?`}
              {moderateDialog.action === 'unban' && `Unban ${moderateDialog.form.user?.email}?`}
              {moderateDialog.action === 'unsuspend' && `Unsuspend ${moderateDialog.form.user?.email}?`}
            </h3>
            {(moderateDialog.action === 'ban' || moderateDialog.action === 'suspend') && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                They will be logged out of all sessions and {moderateDialog.action === 'ban' ? 'blocked from using Tirbeo' : 'unable to access the platform'}.{' '}
                {moderateDialog.action === 'ban' ? 'This is permanent until manually unbanned.' : ''}
              </p>
            )}
            {(moderateDialog.action === 'unban' || moderateDialog.action === 'unsuspend') && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                They will regain full access to the platform.
              </p>
            )}
            {(moderateDialog.action === 'ban' || moderateDialog.action === 'suspend') && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Reason</label>
                  <input
                    type="text"
                    value={moderateReason}
                    onChange={e => setModerateReason(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
                    placeholder="Enter a reason..."
                  />
                </div>
                {moderateDialog.action === 'suspend' && (
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Duration (days, blank = indefinite)</label>
                    <input
                      type="number"
                      value={moderateDays}
                      onChange={e => setModerateDays(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
                      placeholder="7"
                      min="1"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setModerateDialog(null)} className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={executeModerate}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity ${
                  moderateDialog.action === 'ban' ? 'bg-[var(--color-error)]' :
                  moderateDialog.action === 'suspend' ? 'bg-[var(--color-warning)]' :
                  'bg-[var(--color-success)]'
                }`}
              >
                {moderateDialog.action === 'ban' && 'Ban User'}
                {moderateDialog.action === 'suspend' && 'Suspend User'}
                {moderateDialog.action === 'unban' && 'Unban User'}
                {moderateDialog.action === 'unsuspend' && 'Unsuspend User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-md rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">Delete form?</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Delete &quot;{confirmDelete.title}&quot; and all its responses? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => remove(confirmDelete)} className="px-4 py-2 text-sm font-medium bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-opacity">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
