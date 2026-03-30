import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /api/social/* and /api/delete-account
  if (pathname.startsWith('/api/social/') || pathname === '/api/delete-account') {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ') || authHeader.length < 20) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/social/:path*', '/api/delete-account'],
};
