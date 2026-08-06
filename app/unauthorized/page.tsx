import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          background: 'var(--color-surface-default, var(--bg-surface, #1d1a11))',
          border: '2px solid var(--color-border, var(--border))',
          boxShadow: 'var(--shadow-popover, 4px 4px 0 0 var(--text))',
          borderRadius: 0,
          padding: '48px 32px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 0,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--color-border, var(--border))',
            background: 'var(--color-error-surface, rgba(229,72,77,0.12))',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-error, var(--error))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
          Access Denied
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted, rgba(246,243,234,0.6))',
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}
        >
          You do not have permission to access this panel.
          <br />
          If you believe this is an error, contact your administrator.
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: 'var(--color-accent, var(--warning))',
            color: 'var(--color-on-accent, #17150f)',
            textDecoration: 'none',
            borderRadius: 0,
            fontSize: 14,
            fontWeight: 700,
            border: '2px solid var(--color-border, var(--border))',
            boxShadow: '4px 4px 0 0 var(--text, #f6f3ea)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
