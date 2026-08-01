import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0d1117', color: '#e6edf3',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      padding: 24, textAlign: 'center',
    }}>
      <div style={{
        width: 400, maxWidth: '100%',
        background: '#151b23', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '48px 32px',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(248,81,73,0.1)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>Access Denied</h1>
        <p style={{ fontSize: 14, color: 'rgba(230,237,243,0.5)', margin: '0 0 28px', lineHeight: 1.5 }}>
          You do not have permission to access this panel.
          If you believe this is an error, contact your administrator.
        </p>
        <Link href="/login" style={{
          display: 'inline-block', padding: '10px 24px',
          background: '#238636', color: '#fff', textDecoration: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600,
        }}>Back to Login</Link>
      </div>
    </div>
  );
}
