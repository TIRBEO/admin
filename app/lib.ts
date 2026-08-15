export const API = (() => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.tirbeo.app';
})();

function getCsrf(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/(?:^|;\s*)__csrf=([^;]+)/);
  return m?.[1] || '';
}

function csrfHeaders(method: string): Record<string, string> {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const t = getCsrf();
    return t ? { 'X-CSRF-Token': t } : {};
  }
  return {};
}

async function tryRefresh(): Promise<boolean> {
  try {
    const h: Record<string, string> = {};
    const csrf = getCsrf();
    if (csrf) h['X-CSRF-Token'] = csrf;
    const res = await fetch(`${API}/api/auth/refresh`, { method: 'POST', headers: h, credentials: 'include' });
    if (!res.ok) return false;
    const d = await res.json().catch(() => ({}));
    if (d?.token) { try { localStorage.setItem('auth_token', d.token); } catch {} }
    return true;
  } catch { return false; }
}

let _refreshAttempted = false;

/**
 * Fetch wrapper that:
 * - Adds auth headers
 * - Tries refresh on 401 (once globally)
 * - NEVER redirects during fetch — pages must handle 401 themselves
 */
export async function apiFetch(path: string, opts?: RequestInit): Promise<Response> {
  const url = path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`;
  const method = (opts?.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { ...csrfHeaders(method) };
  const bearer = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
  if (!(opts?.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  let res = await fetch(`${API}${url}`, {
    credentials: 'include',
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string> || {}) },
  });

  // Try refresh once globally on 401
  if (res.status === 401 && !_refreshAttempted) {
    _refreshAttempted = true;
    if (await tryRefresh()) {
      const freshH: Record<string, string> = { ...csrfHeaders(method) };
      const freshB = localStorage.getItem('auth_token');
      if (freshB) freshH['Authorization'] = `Bearer ${freshB}`;
      if (!(opts?.body instanceof FormData)) freshH['Content-Type'] = 'application/json';
      res = await fetch(`${API}${url}`, {
        credentials: 'include',
        ...opts,
        headers: { ...freshH, ...(opts?.headers as Record<string, string> || {}) },
      });
    }
  }

  // Return the response — pages handle 401 themselves (e.g., show empty state or redirect)
  return res;
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
