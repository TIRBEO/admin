import { NextResponse, NextRequest } from 'next/server';

const API_URL = 'https://api.tirbeo.app';

interface AuthCacheEntry {
  adminRole: string | null;
  isBanned: boolean;
  isSuspended: boolean;
  expires: number;
}

const authCache = new Map<string, AuthCacheEntry>();
const CACHE_TTL = 60_000;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname === '/' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (pathname === '/login' || pathname === '/unauthorized') {
    return NextResponse.next();
  }

  const session = request.cookies.get('__session');
  const authHeader = request.headers.get('authorization');
  const token = session?.value || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '');

  const redirectLogin = () => {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  };

  if (!token) return redirectLogin();

  const cacheKey = token.slice(0, 32);
  const cached = authCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    if (cached.isBanned) return NextResponse.redirect(new URL('/login?error=banned', request.url));
    if (cached.isSuspended) return NextResponse.redirect(new URL('/login?error=suspended', request.url));
    if (!cached.adminRole) return NextResponse.redirect(new URL('/unauthorized', request.url));
    return NextResponse.next();
  }

  try {
    const res = await fetch(`${API_URL}/api/admin/authorize`, {
      headers: { Cookie: `__session=${token}` },
      cache: 'no-store',
    });

    if (res.status === 401) return redirectLogin();

    const data = await res.json();
    const entry: AuthCacheEntry = {
      adminRole: data?.adminRole || null,
      isBanned: !!data?.isBanned,
      isSuspended: !!data?.isSuspended,
      expires: Date.now() + CACHE_TTL,
    };
    authCache.set(cacheKey, entry);

    if (entry.isBanned) return NextResponse.redirect(new URL('/login?error=banned', request.url));
    if (entry.isSuspended) return NextResponse.redirect(new URL('/login?error=suspended', request.url));
    if (!entry.adminRole) return NextResponse.redirect(new URL('/unauthorized', request.url));
    return NextResponse.next();
  } catch {
    return redirectLogin();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
