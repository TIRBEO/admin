'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Select, Toast, ColorInput } from '../shared';

const DEFAULTS = {
  panelName: 'Tirbeo Admin',
  panelLogo: '',
  panelFavicon: '',
  primaryColor: '#ffffff',
  defaultNewAdminRole: 'editor',
  notifyOnNewUser: true,
  notifyOnUserDelete: true,
  notifyOnError: true,
  auditLogRetentionDays: 90,
  maintenanceMode: false,
  allowSelfSignup: false,
  require2FAForAdmins: false,
  sessionTimeoutMinutes: 120,
  showUserOnlineStatus: true,
  enableAuditLog: true,
  logRetentionDays: 90,
};

type Config = typeof DEFAULTS;

interface MaintenanceState {
  enabled: boolean;
  message: string;
  estimatedEnd: number | null;
  allowedUsers: string[];
  startTime: number | null;
  scheduledStart: number | null;
  scheduledEnd: number | null;
}

const DEFAULT_MAINTENANCE: MaintenanceState = {
  enabled: false,
  message: 'Scheduled maintenance in progress. Please try again later.',
  estimatedEnd: null,
  allowedUsers: [],
  startTime: null,
  scheduledStart: null,
  scheduledEnd: null,
};

export default function AdminSettingsPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceState>(DEFAULT_MAINTENANCE);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [estimatedEndInput, setEstimatedEndInput] = useState('');
  const [scheduledStartInput, setScheduledStartInput] = useState('');
  const [scheduledEndInput, setScheduledEndInput] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'enable' | 'disable' | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/site-config?app=admin');
    if (res.ok) { const d = await res.json(); if (d?.config) setCfg({ ...DEFAULTS, ...d.config }); }
    setLoading(false);
  }, []);

  const loadMaintenance = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/maintenance');
      if (res.ok) {
        const d = await res.json();
        setMaintenance({
          enabled: d.enabled ?? false,
          message: d.message ?? DEFAULT_MAINTENANCE.message,
          estimatedEnd: d.estimatedEnd ?? null,
          allowedUsers: d.allowedUsers ?? [],
          startTime: d.startTime ?? null,
          scheduledStart: d.scheduledStart ?? null,
          scheduledEnd: d.scheduledEnd ?? null,
        });
        if (d.estimatedEnd) {
          const date = new Date(d.estimatedEnd);
          setEstimatedEndInput(date.toISOString().slice(0, 16));
        }
        if (d.scheduledStart) {
          const date = new Date(d.scheduledStart);
          setScheduledStartInput(date.toISOString().slice(0, 16));
          setScheduleMode('scheduled');
        }
        if (d.scheduledEnd) {
          const date = new Date(d.scheduledEnd);
          setScheduledEndInput(date.toISOString().slice(0, 16));
        }
      }
    } catch {
      // Maintenance API might not be available
    }
    setMaintenanceLoading(false);
  }, []);

  useEffect(() => { load(); loadMaintenance(); }, [load, loadMaintenance]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=admin').then(r => r.ok ? r.json() : { config: {} });
    const res = await apiFetch('/api/admin/site-config?app=admin', {
      method: 'PUT', body: JSON.stringify({ config: { ...(full.config || {}), ...cfg } }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Admin settings saved' }); else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const saveMaintenance = async () => {
    setMaintenanceSaving(true); setMsg(null);
    try {
      const isScheduled = scheduleMode === 'scheduled' && scheduledStartInput;
      
      const res = await apiFetch('/api/admin/maintenance', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: isScheduled ? false : maintenance.enabled,
          message: maintenance.message,
          estimatedEnd: estimatedEndInput ? new Date(estimatedEndInput).toISOString() : null,
          allowedUsers: maintenance.allowedUsers,
          notifyUsers: maintenance.enabled || isScheduled,
          scheduledStart: isScheduled ? new Date(scheduledStartInput).toISOString() : null,
          scheduledEnd: scheduledEndInput ? new Date(scheduledEndInput).toISOString() : null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.maintenance) {
          setMaintenance({
            enabled: d.maintenance.enabled ?? false,
            message: d.maintenance.message ?? maintenance.message,
            estimatedEnd: d.maintenance.estimatedEnd ?? null,
            allowedUsers: d.maintenance.allowedUsers ?? [],
            startTime: d.maintenance.startTime ?? null,
            scheduledStart: d.maintenance.scheduledStart ?? null,
            scheduledEnd: d.maintenance.scheduledEnd ?? null,
          });
        }
        setMsg({ type: 'success', text: isScheduled ? 'Maintenance scheduled' : (maintenance.enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled') });
      } else {
        setMsg({ type: 'error', text: 'Failed to update maintenance mode' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to update maintenance mode' });
    }
    setMaintenanceSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const cancelSchedule = async () => {
    setMaintenanceSaving(true); setMsg(null);
    try {
      const res = await apiFetch('/api/admin/maintenance', {
        method: 'PUT',
        body: JSON.stringify({ cancelSchedule: true }),
      });
      if (res.ok) {
        setMaintenance(DEFAULT_MAINTENANCE);
        setScheduledStartInput('');
        setScheduledEndInput('');
        setScheduleMode('immediate');
        setMsg({ type: 'success', text: 'Schedule cancelled' });
      } else {
        setMsg({ type: 'error', text: 'Failed to cancel schedule' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to cancel schedule' });
    }
    setMaintenanceSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const formatScheduledTime = (timestamp: number | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const isScheduleInFuture = scheduledStartInput && new Date(scheduledStartInput).getTime() > Date.now();

  const handleMaintenanceToggle = (enable: boolean) => {
    if (enable && !maintenance.enabled) {
      // Show confirmation dialog before enabling
      setPendingAction('enable');
      setShowConfirmDialog(true);
    } else if (!enable && maintenance.enabled) {
      // Show confirmation dialog before disabling
      setPendingAction('disable');
      setShowConfirmDialog(true);
    } else {
      updMaintenance('enabled', enable);
      if (enable) setScheduleMode('immediate');
    }
  };

  const confirmAction = () => {
    if (pendingAction === 'enable') {
      updMaintenance('enabled', true);
      setScheduleMode('immediate');
    } else if (pendingAction === 'disable') {
      updMaintenance('enabled', false);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const cancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const upd = <K extends keyof Config>(k: K, v: Config[K]) => setCfg(p => ({ ...p, [k]: v }));
  const updMaintenance = (k: keyof MaintenanceState, v: MaintenanceState[keyof MaintenanceState]) =>
    setMaintenance(p => ({ ...p, [k]: v }));

  const formatTimeRemaining = (estimatedEnd: number | null): string => {
    if (!estimatedEnd) return '';
    const remaining = estimatedEnd - Date.now();
    if (remaining <= 0) return 'Ending soon';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Admin Panel Settings" desc="Configure admin.tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Branding" desc="Appearance of the admin panel">
        <Field label="Panel Name">
          <Input value={cfg.panelName} onChange={e => upd('panelName', e.target.value)} placeholder="Tirbeo Admin" />
        </Field>
        <Field label="Logo URL" desc="Optional logo image">
          <Input value={cfg.panelLogo} onChange={e => upd('panelLogo', e.target.value)} placeholder="https://tirbeo.app/logo.png" />
        </Field>
        <Field label="Favicon URL">
          <Input value={cfg.panelFavicon} onChange={e => upd('panelFavicon', e.target.value)} placeholder="https://tirbeo.app/favicon.ico" />
        </Field>
        <Field label="Primary Color" desc="Main accent color">
          <ColorInput value={cfg.primaryColor} onChange={v => upd('primaryColor', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Access Control" desc="Who can access the admin panel">
        <Field label="Default Role for New Admins">
          <Select value={cfg.defaultNewAdminRole} onChange={e => upd('defaultNewAdminRole', e.target.value)}>
            <option value="editor">Editor</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <Field label="Allow Self-Signup" desc="Let users sign up for admin access" horizontal>
          <Toggle checked={cfg.allowSelfSignup} onChange={v => upd('allowSelfSignup', v)} />
        </Field>
        <Field label="Require 2FA for Admins" horizontal>
          <Toggle checked={cfg.require2FAForAdmins} onChange={v => upd('require2FAForAdmins', v)} />
        </Field>
        <Field label="Session Timeout" desc="Minutes of inactivity before logout">
          <Input type="number" min={5} max={480} value={cfg.sessionTimeoutMinutes} onChange={e => upd('sessionTimeoutMinutes', Number(e.target.value))} />
        </Field>
      </SectionCard>

      <SectionCard title="Notifications" desc="Email and in-app notifications">
        <Field label="New User Registration" horizontal>
          <Toggle checked={cfg.notifyOnNewUser} onChange={v => upd('notifyOnNewUser', v)} />
        </Field>
        <Field label="User Deletion" horizontal>
          <Toggle checked={cfg.notifyOnUserDelete} onChange={v => upd('notifyOnUserDelete', v)} />
        </Field>
        <Field label="System Errors" horizontal>
          <Toggle checked={cfg.notifyOnError} onChange={v => upd('notifyOnError', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Audit & Logging" desc="Track admin activity">
        <Field label="Enable Audit Log" horizontal>
          <Toggle checked={cfg.enableAuditLog} onChange={v => upd('enableAuditLog', v)} />
        </Field>
        <Field label="Show User Online Status" horizontal>
          <Toggle checked={cfg.showUserOnlineStatus} onChange={v => upd('showUserOnlineStatus', v)} />
        </Field>
        <Field label="Log Retention" desc="Days to keep audit logs">
          <Input type="number" min={1} max={365} value={cfg.logRetentionDays} onChange={e => upd('logRetentionDays', Number(e.target.value))} />
        </Field>
      </SectionCard>

      <SectionCard title="Maintenance Mode" desc="Control system-wide maintenance mode">
        {/* Status indicator */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              maintenance.enabled ? 'bg-[var(--color-error)]' : 
              maintenance.scheduledStart ? 'bg-yellow-500' : 
              'bg-[var(--color-success)]'
            }`} />
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">
                {maintenance.enabled ? 'Maintenance Mode Active' : 
                 maintenance.scheduledStart ? 'Maintenance Scheduled' : 
                 'System Operational'}
              </p>
              {maintenance.enabled && maintenance.startTime && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Started {new Date(maintenance.startTime).toLocaleString()}
                  {maintenance.estimatedEnd && ` · ${formatTimeRemaining(maintenance.estimatedEnd)}`}
                </p>
              )}
              {maintenance.scheduledStart && !maintenance.enabled && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Scheduled for {formatScheduledTime(maintenance.scheduledStart)}
                  {maintenance.scheduledEnd && ` until ${formatScheduledTime(maintenance.scheduledEnd)}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {maintenance.scheduledStart && !maintenance.enabled && (
              <button
                onClick={cancelSchedule}
                disabled={maintenanceSaving}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition-colors"
              >
                Cancel Schedule
              </button>
            )}
            <Toggle
              checked={maintenance.enabled}
              onChange={handleMaintenanceToggle}
            />
          </div>
        </div>

        {/* Mode selector */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setScheduleMode('immediate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scheduleMode === 'immediate' 
                ? 'bg-[var(--color-text)] text-[var(--color-bg)]' 
                : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            Immediate
          </button>
          <button
            onClick={() => setScheduleMode('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scheduleMode === 'scheduled' 
                ? 'bg-[var(--color-text)] text-[var(--color-bg)]' 
                : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            Schedule for Later
          </button>
        </div>

        {/* Configuration form */}
        <div className="mt-4 space-y-4">
          <Field label="Maintenance Message" desc="Displayed to users during maintenance">
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm min-h-[80px]"
              value={maintenance.message}
              onChange={e => updMaintenance('message', e.target.value)}
              placeholder="Scheduled maintenance in progress. Please try again later."
            />
          </Field>

          {scheduleMode === 'immediate' ? (
            <Field label="Estimated End Time" desc="Optional - shows countdown to users">
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
                value={estimatedEndInput}
                onChange={e => setEstimatedEndInput(e.target.value)}
              />
            </Field>
          ) : (
            <>
              <Field label="Start Time" desc="When maintenance should begin">
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
                  value={scheduledStartInput}
                  onChange={e => setScheduledStartInput(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </Field>
              <Field label="End Time" desc="When maintenance should end (optional)">
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
                  value={scheduledEndInput}
                  onChange={e => setScheduledEndInput(e.target.value)}
                  min={scheduledStartInput || new Date().toISOString().slice(0, 16)}
                />
              </Field>
            </>
          )}

          <Field label="Allowed Users" desc="User IDs that can access during maintenance (comma-separated)">
            <Input
              value={maintenance.allowedUsers.join(', ')}
              onChange={e => updMaintenance('allowedUsers', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Leave empty to block everyone except admins"
            />
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={saveMaintenance}
            disabled={maintenanceSaving || (scheduleMode === 'scheduled' && !scheduledStartInput)}
            className="px-4 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition-colors"
          >
            {maintenanceSaving ? 'Saving...' : 
             scheduleMode === 'scheduled' ? 'Schedule Maintenance' : 
             maintenance.enabled ? 'Save & Disable' : 'Enable Now'}
          </button>
        </div>
      </SectionCard>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                pendingAction === 'enable' ? 'bg-amber-500/10' : 'bg-[var(--color-success)]/10'
              }`}>
                {pendingAction === 'enable' ? (
                  <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-[var(--color-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  {pendingAction === 'enable' ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?'}
                </h3>
              </div>
            </div>

            <div className="mb-6">
              {pendingAction === 'enable' ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    This will <strong className="text-[var(--color-text)]">block all user access</strong> to the platform immediately.
                  </p>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>Warning:</strong> All users will see a maintenance page and won't be able to access their accounts until you disable maintenance mode.
                    </p>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Users in the allowed list will still have access.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    This will <strong className="text-[var(--color-text)]">restore normal access</strong> to all users.
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Users will be able to log in and use the platform normally.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelAction}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  pendingAction === 'enable'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-[var(--color-success)] hover:opacity-90'
                }`}
              >
                {pendingAction === 'enable' ? 'Enable Maintenance' : 'Disable Maintenance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsPage>
  );
}
