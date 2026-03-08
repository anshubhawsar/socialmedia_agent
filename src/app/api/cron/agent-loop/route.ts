import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchLatestHeadlines, fetchFeedSummaries } from '@/lib/rss';
import { selectBestHeadline } from '@/lib/agent';
import { postTweet } from '@/lib/twitter';
import { ensureValidAccessToken } from '@/lib/auth';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { success: true, message: 'Supabase not configured. Auto-mode requires database setup.' }
    );
  }

  const db = supabase;

  try {
    const headlines = await fetchLatestHeadlines(5);

    if (headlines.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No headlines found' }
      );
    }

    const { index, synthesis } = await selectBestHeadline(headlines);

    const { data: users, error: usersError } = await db
      .from('users')
      .select('*, profiles(tokens_used, token_limit, is_subscribed)')
      .eq('auto_mode', true);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No auto-mode users' }
      );
    }

    const eligibleUsers = users.filter((user: User & { profiles?: { tokens_used?: number; token_limit?: number; is_subscribed?: boolean }[] }) => {
      const profile = Array.isArray(user.profiles) ? user.profiles[0] : undefined;
      if (!profile) return true;
      if (profile.is_subscribed) return true;

      const used = profile.tokens_used ?? 0;
      const limit = profile.token_limit ?? 10;
      return used < limit;
    });

    const results = await Promise.allSettled(
      eligibleUsers.map(async (user: User & { profiles?: { tokens_used?: number; token_limit?: number; is_subscribed?: boolean }[] }) => {
        const validAccessToken = await ensureValidAccessToken(user);
        return postTweet(validAccessToken, synthesis);
      })
    );

    const successful = results.filter(
      r => r.status === 'fulfilled'
    ).length;
    const failed = results.filter(
      r => r.status === 'rejected'
    ).length;

    const tweets = eligibleUsers.map((user: User, idx: number) => (
      {
        user_id: user.id,
        tweet_id: results[idx].status === 'fulfilled' ? (results[idx] as PromiseFulfilledResult<string>).value : `failed-${Date.now()}`,
        content: synthesis,
        is_auto: true,
      }
    ));

    const { error: tweetsError } = await db
      .from('tweets')
      .insert(tweets);

    if (tweetsError) {
      console.warn('Failed to log tweets:', tweetsError);
    }

    await Promise.all(
      eligibleUsers.map(async (user: User & { profiles?: { tokens_used?: number; token_limit?: number; is_subscribed?: boolean }[] }) => {
        const profile = Array.isArray(user.profiles) ? user.profiles[0] : undefined;
        if (!profile || profile.is_subscribed) return;

        const used = profile.tokens_used ?? 0;
        await db
          .from('profiles')
          .update({ tokens_used: used + 1 })
          .eq('user_id', user.id);
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: `Posted to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}${users.length !== eligibleUsers.length ? `, skipped ${users.length - eligibleUsers.length} locked accounts` : ''}`,
        selectedHeadline: headlines[index],
        tweet: synthesis,
      }
    );
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
