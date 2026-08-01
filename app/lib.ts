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
  const match = document.cookie.match(/(?:^|;\s*)__csrf=([^;]+)/);
  return match?.[1] || '';
}

function getBearerToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const urlToken = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (urlToken) {
    try { window.localStorage.setItem('auth_token', urlToken); } catch {}
    window.location.hash = '';
    return urlToken;
  }
  try { return window.localStorage.getItem('auth_token') || undefined; } catch { return undefined; }
}

function csrfHeaders(method: string): Record<string, string> {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const token = getCsrf();
    return token ? { 'X-CSRF-Token': token } : {};
  }
  return {};
}

function resolveApiPath(path: string): string {
  if (path.startsWith('/api/')) return path;
  return `/api/${path.replace(/^\//, '')}`;
}

const cache = new Map<string, { data: unknown; expiry: number }>();
const TTL = 5000;

export async function apiFetch(path: string, opts?: RequestInit) {
  const resolvedPath = resolveApiPath(path);
  const cacheKey = `${opts?.method || 'GET'}:${resolvedPath}`;
  const cached = opts?.method ? undefined : cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.data as Response;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const headers: Record<string, string> = { ...csrfHeaders(opts?.method || 'GET') };
    const bearer = getBearerToken();
    if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
    if (!(opts?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${API}${resolvedPath}`, {
      credentials: 'include',
      signal: controller.signal,
      ...opts,
      headers: { ...headers, ...(opts?.headers as Record<string, string> || {}) },
    });
    clearTimeout(timeout);
    if (res.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    if (!opts?.method) cache.set(cacheKey, { data: res.clone(), expiry: Date.now() + TTL });
    return res;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') throw new Error('Request timed out');
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Cannot reach API server. Check your connection.');
    }
    throw err;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiPost(path: string, body?: Record<string, any>): Promise<any> {
  const resolvedPath = resolveApiPath(path);
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...csrfHeaders('POST') };
  const bearer = getBearerToken();
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
  const res = await fetch(`${API}${resolvedPath}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const errMsg = typeof data === 'string' ? data : data.error || data.message || 'Request failed';
    throw new ApiError(errMsg, res.status);
  }
  return data;
}

export function getFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function isImage(mime: string) { return mime.startsWith('image/'); }
export function isVideo(mime: string) { return mime.startsWith('video/'); }

export function isOnline(ua?: string) {
  if (!ua) return false;
  return Date.now() - new Date(ua).getTime() < 5 * 60 * 1000;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getDeviceFingerprint(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )__dfp=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
}
