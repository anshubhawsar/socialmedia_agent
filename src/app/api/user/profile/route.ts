import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type ProfileRecord = {
  tokens_used: number;
  token_limit: number;
  is_subscribed: boolean;
};

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  try {
    if (!supabase) {
      // Cookie-based session (no database)
      const username = request.cookies.get('username')?.value || 'User';
      const twitterId = request.cookies.get('twitter_id')?.value;
      const rawTokensUsed = request.cookies.get('tokens_used')?.value;
      const tokensUsed = Number.parseInt(rawTokensUsed || '0', 10) || 0;
      const isSubscribed = request.cookies.get('is_subscribed')?.value === 'true';
      const tokenLimit = isSubscribed ? -1 : 10;
      return NextResponse.json({
        id: userId,
        username,
        twitter_id: twitterId,
        auto_mode: false, // Not supported without database
        tokens_used: tokensUsed,
        token_limit: tokenLimit,
        is_subscribed: isSubscribed,
        created_at: new Date().toISOString(),
      });
    }

    const { data: profile, error: profileError } = await supabase
      .rpc('refresh_profile_tokens_if_due', { p_user_id: userId })
      .single<ProfileRecord>();

    if (profileError) {
      console.warn('Profile refresh fallback:', profileError.message);
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, auto_mode, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      tokens_used: profile?.tokens_used ?? 0,
      token_limit: profile?.is_subscribed ? -1 : (profile?.token_limit ?? 10),
      is_subscribed: profile?.is_subscribed ?? false,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const body = await request.json();
  const { auto_mode, is_subscribed } = body;

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured. Auto-mode requires Supabase setup.' },
      { status: 501 }
    );
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({
        auto_mode: typeof auto_mode === 'boolean' ? auto_mode : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    if (typeof is_subscribed === 'boolean') {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          is_subscribed,
          tokens_used: 0,
          token_limit: is_subscribed ? -1 : 10,
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
