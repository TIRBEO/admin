'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#000', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 16 }}>{error.message}</p>
            <button
              onClick={() => reset()}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #3f3f46', background: '#fafafa', color: '#000', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
