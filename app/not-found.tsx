'use client';

import { useRouter } from 'next/navigation';
import { FileQuestion, ArrowLeft, Shield } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--tb-bg)', padding: 32,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: 'var(--tb-surface-2)',
          border: '1px solid var(--tb-border)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <FileQuestion size={30} style={{ color: 'var(--tb-text-muted)' }} />
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 700, color: 'var(--tb-text-primary)', margin: 0 }}>
          404
        </h1>
        <p style={{ fontSize: 14, color: 'var(--tb-text-muted)', marginTop: 12 }}>
          This page doesn&apos;t exist in the Tirbeo Admin.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
          <button
            className="btn btn-secondary"
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            Go back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/login')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Shield size={14} />
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
