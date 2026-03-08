import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getTwitterProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json(
      { error: 'Missing authorization code or state' },
      { status: 400 }
    );
  }

  const codeVerifier = request.cookies.get('code_verifier')?.value;
  if (!codeVerifier) {
    return NextResponse.json(
      { error: 'Missing code verifier' },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);
    const profile = await getTwitterProfile(tokenResponse.access_token);

    const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

    let userId: string;

    if (supabase) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('twitter_id', profile.id)
        .single();

      if (existingUser) {
        const { error } = await supabase
          .from('users')
          .update({
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);

        if (error) throw error;
        userId = existingUser.id;
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            twitter_id: profile.id,
            username: profile.username,
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: expiresAt,
          })
          .select('id')
          .single();

        if (error || !newUser) throw error;
        userId = newUser.id;
      }
    } else {
      // Supabase not configured - use Twitter ID as userId
      userId = profile.id;
    }

    const response = NextResponse.redirect(
      new URL('/dashboard', request.nextUrl.origin)
    );

    response.cookies.set('userId', userId, {
      httpOnly: true,
      maxAge: 86400 * 365,
    });
    
    // Store session data in cookies when Supabase is not configured
    if (!supabase) {
      response.cookies.set('twitter_id', profile.id, { httpOnly: true, maxAge: 86400 * 365 });
      response.cookies.set('username', profile.username, { httpOnly: true, maxAge: 86400 * 365 });
      response.cookies.set('access_token', tokenResponse.access_token, { httpOnly: true, maxAge: 86400 * 365 });
      response.cookies.set('refresh_token', tokenResponse.refresh_token, { httpOnly: true, maxAge: 86400 * 365 });
      response.cookies.set('expires_at', expiresAt.toString(), { httpOnly: true, maxAge: 86400 * 365 });
    }
    
    response.cookies.delete('code_verifier');
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorMessage)}`, request.nextUrl.origin)
    );
  }
}
