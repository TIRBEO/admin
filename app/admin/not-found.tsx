'use client';

import { useRouter } from 'next/navigation';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function AdminNotFound() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', padding: 32 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, background: 'var(--tb-surface-2)',
        border: '1px solid var(--tb-border)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: 24,
      }}>
        <FileQuestion size={30} style={{ color: 'var(--tb-text-muted)' }} />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>
        Page not found
      </h1>
      <p style={{ fontSize: 14, color: 'var(--tb-text-muted)', marginTop: 8, textAlign: 'center', maxWidth: 380 }}>
        The admin page you&apos;re looking for doesn&apos;t exist or hasn&apos;t been created yet.
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
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
          onClick={() => router.push('/admin')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Home size={14} />
          Command Center
        </button>
      </div>
    </div>
  );
}
