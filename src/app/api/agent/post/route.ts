import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateTweet } from '@/lib/agent';
import { postTweet } from '@/lib/twitter';
import { ensureValidAccessToken } from '@/lib/auth';
import { TweetRequest } from '@/types';

export async function POST(request: NextRequest) {
  const body: TweetRequest = await request.json();
  const { context } = body;
  const userId = request.headers.get('x-user-id');

  if (!userId || !context) {
    return NextResponse.json(
      { error: 'Missing userId or context' },
      { status: 400 }
    );
  }

  try {
    let accessToken: string;
    
    if (!supabase) {
      // Cookie-based session
      const cookieToken = request.cookies.get('access_token')?.value;
      if (!cookieToken) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }
      accessToken = cookieToken;
    } else {
      // Database session
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      accessToken = await ensureValidAccessToken(user);
    }

    const tweet = await generateTweet(context);

    let tweetId: string | null = null;
    try {
      tweetId = await postTweet(accessToken, tweet);
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : String(postError);
      const isCreditError = message.includes('CreditsDepleted') || message.includes('Twitter API Error (402)');

      if (isCreditError) {
        return NextResponse.json({
          success: false,
          manualRequired: true,
          tweet,
          error: 'Twitter credits depleted. Copy this tweet and post manually from your X account.',
          details: message,
        });
      }

      throw postError;
    }

    if (supabase) {
      const { error: logError } = await supabase
        .from('tweets')
        .insert({
          user_id: userId,
          tweet_id: tweetId,
          content: tweet,
          is_auto: false,
        });

      if (logError) {
        console.warn('Failed to log tweet:', logError);
      }
    }

    return NextResponse.json({ success: true, tweet, tweetId });
  } catch (error) {
    console.error('Tweet error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
