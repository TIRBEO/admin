const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.tirbeo.app';

const cache = new Map<string, { data: unknown; expiry: number }>();
const TTL = 5000;

export async function apiFetch(path: string, opts?: RequestInit) {
  const cacheKey = `${opts?.method || 'GET'}:${path}`;
  const cached = opts?.method ? undefined : cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.data as Response;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API}${path}`, {
      credentials: 'include',
      signal: controller.signal,
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
    });
    clearTimeout(timeout);
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!opts?.method) cache.set(cacheKey, { data: res.clone(), expiry: Date.now() + TTL });
    return res;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}
