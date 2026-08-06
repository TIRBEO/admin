'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../app/lib';
import { Shield, Settings, AlertTriangle, Users, FileText } from 'lucide-react';

export default function CaptchaSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiFetch('/api/captcha/admin');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch('/api/captcha/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage('Settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  if (!settings) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Failed to load settings</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text)] leading-tight">CAPTCHA Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Configure CAPTCHA enforcement and difficulty levels</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--success-surface)] border border-[var(--success)] text-[var(--success)]">
          {message}
        </div>
      )}

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            General Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text)]">Enable CAPTCHA</p>
                <p className="text-sm text-[var(--text-secondary)]">Turn on/off CAPTCHA challenges</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text)]">Auto-enforce</p>
                <p className="text-sm text-[var(--text-secondary)]">Automatically increase difficulty based on user behavior</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoEnforce}
                  onChange={(e) => setSettings({ ...settings, autoEnforce: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Difficulty Thresholds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Easy → Medium (warnings)
              </label>
              <input
                type="number"
                value={settings.easyThreshold}
                onChange={(e) => setSettings({ ...settings, easyThreshold: parseInt(e.target.value) || 2 })}
                className="w-full"
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="form-label">
                Medium → Hard (warnings)
              </label>
              <input
                type="number"
                value={settings.mediumThreshold}
                onChange={(e) => setSettings({ ...settings, mediumThreshold: parseInt(e.target.value) || 4 })}
                className="w-full"
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="form-label">
                Hard → Block (warnings)
              </label>
              <input
                type="number"
                value={settings.hardThreshold}
                onChange={(e) => setSettings({ ...settings, hardThreshold: parseInt(e.target.value) || 6 })}
                className="w-full"
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="form-label">
                Block threshold (warnings)
              </label>
              <input
                type="number"
                value={settings.blockThreshold}
                onChange={(e) => setSettings({ ...settings, blockThreshold: parseInt(e.target.value) || 8 })}
                className="w-full"
                min="1"
                max="50"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Challenge Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Challenge expiry (minutes)
              </label>
              <input
                type="number"
                value={settings.challengeExpiry}
                onChange={(e) => setSettings({ ...settings, challengeExpiry: parseInt(e.target.value) || 5 })}
                className="w-full"
                min="1"
                max="30"
              />
            </div>
            <div>
              <label className="form-label">
                Max attempts per challenge
              </label>
              <input
                type="number"
                value={settings.maxAttemptsPerChallenge}
                onChange={(e) => setSettings({ ...settings, maxAttemptsPerChallenge: parseInt(e.target.value) || 3 })}
                className="w-full"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="form-label">
                Cooldown (minutes)
              </label>
              <input
                type="number"
                value={settings.cooldownMinutes}
                onChange={(e) => setSettings({ ...settings, cooldownMinutes: parseInt(e.target.value) || 10 })}
                className="w-full"
                min="1"
                max="120"
              />
            </div>
            <div>
              <label className="form-label">
                Admin notify threshold
              </label>
              <input
                type="number"
                value={settings.adminNotifyThreshold}
                onChange={(e) => setSettings({ ...settings, adminNotifyThreshold: parseInt(e.target.value) || 5 })}
                className="w-full"
                min="1"
                max="20"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
