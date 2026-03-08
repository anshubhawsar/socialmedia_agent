import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (userId) {
    const response = NextResponse.next();
    response.headers.set('x-user-id', userId);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
