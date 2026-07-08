import { NextResponse, NextRequest } from 'next/server';

const LOGIN_PATH = '/login';
const PUBLIC_PATHS = ['/login', '/unauthorized', '/_next/static', '/_next/image', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('__session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|unauthorized).*)'],
};
