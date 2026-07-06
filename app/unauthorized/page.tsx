import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="login-page">
      <div className="login-container" style={{ textAlign: 'center' }}>
        <div className="glass-card">
          <div>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(239,68,68,0.1)', fontSize: 24,
            }}>
              &#9888;
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Access Denied</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              You do not have permission to access this panel.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', padding: '12px 16px' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
