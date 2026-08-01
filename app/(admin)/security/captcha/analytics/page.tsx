'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../../lib';
import { ShieldCheck, Activity, Ban, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface DifficultyCount {
  difficulty: string;
  _count: number;
}

interface CaptchaSettings {
  enabled: boolean;
  riskEnabled: boolean;
  maxAttemptsPerChallenge: number;
  challengeExpiry: number;
  sessionDuration: number;
}

interface AnalyticsData {
  range: string;
  totalChallenges: number;
  totalAttempts: number;
  totalCorrect: number;
  passRate: number | null;
  failRate: number | null;
  totalBlocks: number;
  activeBlocks: number;
  avgSolveMs: number | null;
  difficultyDistribution: DifficultyCount[];
  topFailedIps: { ip: string; count: number }[];
  recentLogs: any[];
  blockedUsers: any[];
  settings: CaptchaSettings;
}

type Range = '24h' | '7d' | '30d';

export default function CaptchaAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('24h');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/captcha/admin/analytics?range=${r}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const saveSettings = async (patch: Partial<CaptchaSettings>) => {
    if (!data) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await apiFetch('/api/captcha/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const d = await res.json();
        setData({ ...data, settings: d.settings });
        setSaveMsg('Settings saved');
      } else {
        setSaveMsg('Failed to save settings');
      }
    } catch {
      setSaveMsg('Failed to save settings');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 2500);
  };

  if (!data) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  const d = data;

  const stats = [
    { label: 'Challenges issued', value: d.totalChallenges.toLocaleString(), icon: Activity, color: 'text-blue-600 bg-blue-100' },
    { label: 'Attempts', value: d.totalAttempts.toLocaleString(), icon: ShieldCheck, color: 'text-purple-600 bg-purple-100' },
    { label: 'Pass rate', value: d.passRate !== null ? `${d.passRate}%` : '—', icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Avg solve time', value: d.avgSolveMs !== null ? `${(d.avgSolveMs / 1000).toFixed(1)}s` : '—', icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'Blocks', value: d.totalBlocks.toLocaleString(), icon: Ban, color: 'text-red-600 bg-red-100' },
    { label: 'Active blocks', value: d.activeBlocks.toLocaleString(), icon: AlertTriangle, color: 'text-orange-600 bg-orange-100' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">CAPTCHA Analytics</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Anti-abuse challenge performance and risk enforcement</p>
        </div>
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
          {(['24h', '7d', '30d'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{s.value}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Difficulty distribution</h2>
          {d.difficultyDistribution.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No challenges in this window</p>
          ) : (
            <div className="space-y-2">
              {d.difficultyDistribution.map(dd => (
                <div key={dd.difficulty} className="flex items-center gap-2">
                  <span className="w-16 text-sm capitalize text-[var(--color-text-secondary)]">{dd.difficulty}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full"
                      style={{ width: `${Math.min(100, (dd._count / (d.totalChallenges || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text)]">{dd._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Top failed IPs</h2>
          {d.topFailedIps.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No failures in this window</p>
          ) : (
            <ul className="space-y-2">
              {d.topFailedIps.map(tf => (
                <li key={tf.ip} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-[var(--color-text-secondary)]">{tf.ip}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{tf.count} fails</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {d.settings && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Enforcement settings</h2>
            <span className="text-xs text-[var(--color-text-secondary)]">{saveMsg || (saving ? 'Saving...' : '')}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">CAPTCHA enabled</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Require challenges on auth flows</p>
              </div>
              <input
                type="checkbox"
                checked={d.settings.enabled}
                onChange={e => saveSettings({ enabled: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-primary)]"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Risk-based scoring</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Adapt difficulty from device and behavior signals</p>
              </div>
              <input
                type="checkbox"
                checked={d.settings.riskEnabled}
                onChange={e => saveSettings({ riskEnabled: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-primary)]"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Max attempts per challenge</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Auto-block after repeated failures</p>
              </div>
              <input
                type="number"
                min={1}
                max={10}
                value={d.settings.maxAttemptsPerChallenge}
                onChange={e => saveSettings({ maxAttemptsPerChallenge: Number(e.target.value) })}
                className="w-16 px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Challenge expiry (minutes)</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Time before an unsolved challenge expires</p>
              </div>
              <input
                type="number"
                min={1}
                max={30}
                value={d.settings.challengeExpiry}
                onChange={e => saveSettings({ challengeExpiry: Number(e.target.value) })}
                className="w-16 px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
              />
            </label>
          </div>
        </div>
      )}

      {d.blockedUsers.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Recently blocked</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                  <th className="px-3 py-2 font-medium">IP</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Blocked At</th>
                  <th className="px-3 py-2 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {d.blockedUsers.map((b: any) => (
                  <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-3 py-2 font-mono text-[var(--color-text-secondary)]">{b.ipAddress || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {(b.reason || 'blocked').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-secondary)]">{new Date(b.blockedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                      {b.expiresAt ? new Date(b.expiresAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
