'use client';

import { useEffect, useState } from 'react';
import { AdminSection } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import { Shield, Key, Smartphone, Clock, Eye, FileText, Check } from 'lucide-react';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-admin-border)]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function PolicyCard({ icon: Icon, title, description, color, children }: { icon: any; title: string; description: string; color: string; children?: React.ReactNode }) {
  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-admin-text)]">{title}</h3>
          <p className="text-xs text-[var(--color-admin-text-muted)] mt-0.5">{description}</p>
        </div>
      </div>
      {children && <div className="space-y-3 pt-4 border-t border-[var(--color-admin-border)]">{children}</div>}
    </div>
  );
}

function PolicyRow({ label, value, checked, onChange }: { label: string; value?: string; checked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-[var(--color-admin-text)]">{label}</span>
      {value && <span className="text-sm text-[var(--color-admin-text-secondary)]">{value}</span>}
      {checked !== undefined && onChange && <Toggle checked={checked} onChange={onChange} />}
    </div>
  );
}

export default function SecurityPolicies() {
  const [policies, setPolicies] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/site-config?app=security').then(async r => {
      if (r.ok) { const d = await r.json(); setPolicies(d.config || d.data || d || {}); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updatePolicy = (key: string, value: any) => {
    setPolicies((prev: any) => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    apiFetch('/api/admin/site-config', {
      method: 'PUT',
      body: JSON.stringify({ app: 'security', config: { ...policies, [key]: value } }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-[var(--color-admin-surface-hover)] " />)}
        </div>
      </div>
    );
  }

  return (
    <AdminSection title="Security Policies" description="Define and manage organization-wide security policies"
      tabs={[]} activeTab="" onTabChange={() => {}}>
      {saved && (
        <div className="flex items-center gap-1.5 mb-4 px-4 py-2 rounded-lg bg-[var(--color-success-surface)] text-xs text-[var(--color-success)]">
          <Check className="w-3.5 h-3.5" /> Policies updated successfully
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PolicyCard icon={Key} title="Password Policy" description="Password complexity, length, and expiration rules" color="var(--color-primary)">
          <PolicyRow label="Minimum length" value={`${policies.minPasswordLength || 8} characters`} />
          <PolicyRow label="Require special characters" checked={policies.requireSpecial ?? true} onChange={v => updatePolicy('requireSpecial', v)} />
          <PolicyRow label="Require uppercase & lowercase" checked={policies.requireMixedCase ?? true} onChange={v => updatePolicy('requireMixedCase', v)} />
          <PolicyRow label="Require numbers" checked={policies.requireNumbers ?? true} onChange={v => updatePolicy('requireNumbers', v)} />
          <PolicyRow label="Expiration" value={`${policies.passwordExpiryDays || 90} days`} />
          <PolicyRow label="Password history" value={`${policies.passwordHistoryCount || 5} previous passwords`} />
        </PolicyCard>

        <PolicyCard icon={Smartphone} title="MFA Policy" description="Multi-factor authentication requirements" color="var(--color-warning)">
          <PolicyRow label="Require MFA for all users" checked={policies.mfaRequired ?? false} onChange={v => updatePolicy('mfaRequired', v)} />
          <PolicyRow label="Require MFA for admins" checked={policies.mfaRequiredForAdmins ?? true} onChange={v => updatePolicy('mfaRequiredForAdmins', v)} />
          <PolicyRow label="Allow authenticator apps" checked={policies.allowAuthenticator ?? true} onChange={v => updatePolicy('allowAuthenticator', v)} />
          <PolicyRow label="Allow SMS codes" checked={policies.allowSmsMfa ?? false} onChange={v => updatePolicy('allowSmsMfa', v)} />
          <PolicyRow label="Allow hardware keys" checked={policies.allowHardwareKeys ?? true} onChange={v => updatePolicy('allowHardwareKeys', v)} />
          <PolicyRow label="Grace period" value={`${policies.mfaGraceDays || 7} days`} />
        </PolicyCard>

        <PolicyCard icon={Clock} title="Session Policy" description="Session duration, timeout, and concurrent limits" color="var(--color-info)">
          <PolicyRow label="Session timeout" value={`${policies.sessionTimeoutMinutes || 60} minutes`} />
          <PolicyRow label="Max concurrent sessions" value={`${policies.maxConcurrentSessions || 5}`} />
          <PolicyRow label="Remember me duration" value={`${policies.rememberMeDays || 30} days`} />
          <PolicyRow label="Force re-auth on sensitive action" checked={policies.forceReauthSensitive ?? true} onChange={v => updatePolicy('forceReauthSensitive', v)} />
          <PolicyRow label="Idle session timeout" value={`${policies.idleTimeoutMinutes || 15} minutes`} />
        </PolicyCard>

        <PolicyCard icon={Eye} title="Audit & Monitoring Policy" description="What events to log and how long to retain them" color="var(--color-success)">
          <PolicyRow label="Log all admin actions" checked={policies.logAdminActions ?? true} onChange={v => updatePolicy('logAdminActions', v)} />
          <PolicyRow label="Log authentication events" checked={policies.logAuthEvents ?? true} onChange={v => updatePolicy('logAuthEvents', v)} />
          <PolicyRow label="Log data export events" checked={policies.logDataExports ?? true} onChange={v => updatePolicy('logDataExports', v)} />
          <PolicyRow label="Audit log retention" value={`${policies.auditRetentionDays || 365} days`} />
          <PolicyRow label="Alert on critical events" checked={policies.alertCriticalEvents ?? true} onChange={v => updatePolicy('alertCriticalEvents', v)} />
        </PolicyCard>

        <PolicyCard icon={Shield} title="Access Control Policy" description="Role-based access and permission inheritance" color="var(--color-error)">
          <PolicyRow label="Role inheritance enabled" checked={policies.roleInheritance ?? true} onChange={v => updatePolicy('roleInheritance', v)} />
          <PolicyRow label="Max roles per user" value={`${policies.maxRolesPerUser || 10}`} />
          <PolicyRow label="Require approval for role changes" checked={policies.requireApprovalRoleChange ?? false} onChange={v => updatePolicy('requireApprovalRoleChange', v)} />
          <PolicyRow label="Audit all permission changes" checked={policies.auditPermissionChanges ?? true} onChange={v => updatePolicy('auditPermissionChanges', v)} />
          <PolicyRow label="Enforce least privilege" checked={policies.enforceLeastPrivilege ?? true} onChange={v => updatePolicy('enforceLeastPrivilege', v)} />
        </PolicyCard>

        <PolicyCard icon={FileText} title="Data Protection Policy" description="Data handling, encryption, and retention" color="var(--color-primary)">
          <PolicyRow label="Encrypt sensitive fields at rest" checked={policies.encryptAtRest ?? true} onChange={v => updatePolicy('encryptAtRest', v)} />
          <PolicyRow label="Mask PII in logs" checked={policies.maskPiiLogs ?? true} onChange={v => updatePolicy('maskPiiLogs', v)} />
          <PolicyRow label="Data retention period" value={`${policies.dataRetentionDays || 730} days`} />
          <PolicyRow label="Auto-delete inactive accounts" value={`${policies.autoDeleteInactiveDays || 365} days`} />
          <PolicyRow label="Require export approval" checked={policies.requireExportApproval ?? false} onChange={v => updatePolicy('requireExportApproval', v)} />
        </PolicyCard>
      </div>
    </AdminSection>
  );
}
