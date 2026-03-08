import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateTweet } from '@/lib/agent';
import { postTweet } from '@/lib/twitter';
import { ensureValidAccessToken } from '@/lib/auth';
import { TweetRequest } from '@/types';

type ProfileRecord = {
  tokens_used: number;
  token_limit: number;
  is_subscribed: boolean;
};

export async function POST(request: NextRequest) {
  const body: TweetRequest = await request.json();
  const context = typeof body.context === 'string' ? body.context.trim() : '';
  const selectedTweet = typeof body.tweet === 'string' ? body.tweet.trim() : '';
  const userId = request.headers.get('x-user-id');

  if (!userId || (!context && !selectedTweet)) {
    return NextResponse.json(
      { error: 'Missing userId or tweet input' },
      { status: 400 }
    );
  }

  try {
    let accessToken: string;
    let isSubscribed = false;
    let tokensUsed = 0;
    let tokenLimit = 10;
    
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

      const rawTokensUsed = request.cookies.get('tokens_used')?.value;
      tokensUsed = Number.parseInt(rawTokensUsed || '0', 10) || 0;
      isSubscribed = request.cookies.get('is_subscribed')?.value === 'true';
      tokenLimit = isSubscribed ? Number.MAX_SAFE_INTEGER : 10;
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

      const { data: profile, error: profileError } = await supabase
        .rpc('refresh_profile_tokens_if_due', { p_user_id: userId })
        .single<ProfileRecord>();

      if (profileError) {
        throw new Error(`Profile lookup failed: ${profileError.message}`);
      }

      isSubscribed = profile?.is_subscribed ?? false;
      tokensUsed = profile?.tokens_used ?? 0;
      tokenLimit = isSubscribed ? Number.MAX_SAFE_INTEGER : (profile?.token_limit ?? 10);
    }

    if (!isSubscribed && tokensUsed >= tokenLimit) {
      return NextResponse.json(
        {
          error: 'Token limit reached. Upgrade to Pro for unlimited posting.',
          code: 'TOKEN_LIMIT_REACHED',
          tokensUsed,
          tokenLimit,
          isSubscribed,
        },
        { status: 402 }
      );
    }

    const tweet = selectedTweet || await generateTweet(context);

    let tweetId: string | null = null;
    try {
      tweetId = await postTweet(accessToken, tweet);
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : String(postError);
      const isCreditError = message.includes('CreditsDepleted') || message.includes('Twitter API Error (402)');

      if (isCreditError) {
        const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
        const response = NextResponse.json({
          success: false,
          manualRequired: true,
          tweet,
          intentUrl,
          error: 'Twitter credits depleted. Copy this tweet and post manually from your X account.',
          details: message,
          tokensUsed: isSubscribed ? tokensUsed : tokensUsed + 1,
          tokenLimit: isSubscribed ? -1 : tokenLimit,
          isSubscribed,
        });

        if (!isSubscribed) {
          if (supabase) {
            await supabase
              .from('profiles')
              .update({ tokens_used: tokensUsed + 1 })
              .eq('user_id', userId);
          } else {
            response.cookies.set('tokens_used', String(tokensUsed + 1), {
              httpOnly: true,
              maxAge: 86400 * 365,
              path: '/',
            });
          }
        }

        return response;
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

    const response = NextResponse.json({
      success: true,
      tweet,
      tweetId,
      tokensUsed: isSubscribed ? tokensUsed : tokensUsed + 1,
      tokenLimit: isSubscribed ? -1 : tokenLimit,
      isSubscribed,
    });

    if (!isSubscribed) {
      if (supabase) {
        await supabase
          .from('profiles')
          .update({ tokens_used: tokensUsed + 1 })
          .eq('user_id', userId);
      } else {
        response.cookies.set('tokens_used', String(tokensUsed + 1), {
          httpOnly: true,
          maxAge: 86400 * 365,
          path: '/',
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Tweet error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
