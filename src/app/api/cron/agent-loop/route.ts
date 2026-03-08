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

  try {
    const headlines = await fetchLatestHeadlines(5);

    if (headlines.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No headlines found' }
      );
    }

    const { index, synthesis } = await selectBestHeadline(headlines);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('auto_mode', true);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No auto-mode users' }
      );
    }

    const results = await Promise.allSettled(
      users.map(async (user: User) => {
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

    const tweets = users.map((user: User, idx: number) => (
      {
        user_id: user.id,
        tweet_id: results[idx].status === 'fulfilled' ? (results[idx] as PromiseFulfilledResult<string>).value : `failed-${Date.now()}`,
        content: synthesis,
        is_auto: true,
      }
    ));

    const { error: tweetsError } = await supabase
      .from('tweets')
      .insert(tweets);

    if (tweetsError) {
      console.warn('Failed to log tweets:', tweetsError);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Posted to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`,
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
