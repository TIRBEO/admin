'use client';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 32, textAlign: 'center',
      background: 'var(--bg-canvas)', color: 'var(--text-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: 40 }}>
        <div style={{ marginBottom: 8 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 style={{ margin: '0 0 8px' }}>Something went wrong</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
          An unexpected error occurred. This has been logged.
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
            Error ID: {error.digest}
          </p>
        )}
        <button className="btn btn-primary" onClick={reset}>
          Try Again
        </button>
      </div>
    </div>
  );
}
