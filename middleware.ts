import { NextResponse, NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only protect page routes, not static assets
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Allow login page and unauthorized page without session
  if (pathname === '/login' || pathname === '/unauthorized') {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('__session');
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
