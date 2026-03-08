import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/auth';

export async function GET() {
  const { url, state, codeVerifier } = await getAuthorizationUrl();

  const response = NextResponse.redirect(url);
  response.cookies.set('code_verifier', codeVerifier, {
    httpOnly: true,
    maxAge: 600,
  });
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    maxAge: 600,
  });

  return response;
}
