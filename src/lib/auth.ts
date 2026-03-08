import { TwitterTokenResponse, User } from '@/types';
import { supabase } from './supabase';

const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const buffer = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Buffer.from(digest).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function getAuthorizationUrl(): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}> {
  const state = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: process.env.TWITTER_REDIRECT_URI!,
    scope: 'tweet.read tweet.write users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `${TWITTER_AUTH_URL}?${params.toString()}`,
    state,
    codeVerifier,
  };
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TwitterTokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.TWITTER_REDIRECT_URI!,
    code_verifier: codeVerifier,
  });

  // Public clients send client_id in the request body.
  if (!clientSecret) {
    body.set('client_id', clientId);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Confidential clients should authenticate with HTTP Basic auth.
  if (clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  }

  const response = await fetch(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TwitterTokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  if (!clientSecret) {
    body.set('client_id', clientId);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  }

  const response = await fetch(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function getTwitterProfile(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
}> {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get profile: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function ensureValidAccessToken(user: User): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  if (user.expires_at > now) {
    return user.access_token;
  }

  const tokenResponse = await refreshAccessToken(user.refresh_token);
  const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

  if (supabase) {
    const { error } = await supabase
      .from('users')
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || user.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update tokens: ${error.message}`);
    }
  }

  return tokenResponse.access_token;
}
