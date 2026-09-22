import { NextResponse, type NextRequest } from 'next/server';

/** DEMO PLUMBING: `?bugs=a,b` sets the bug cookie, `?bugs=` clears it. */
export function middleware(req: NextRequest) {
  const bugs = req.nextUrl.searchParams.get('bugs');
  if (bugs === null) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.searchParams.delete('bugs');
  const res = NextResponse.redirect(url);
  res.cookies.set('bugs', bugs, { path: '/', sameSite: 'lax' });
  return res;
}

export const config = { matcher: ['/apply/:path*', '/'] };
