-- Create users table with Twitter OAuth integration
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_id TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  auto_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create tweets table for tracking posted tweets
CREATE TABLE IF NOT EXISTS tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  is_auto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create profiles table for subscription and token limits
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  token_limit INTEGER NOT NULL DEFAULT 10,
  is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  tokens_reset_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_twitter_id ON users(twitter_id);
CREATE INDEX IF NOT EXISTS idx_users_auto_mode ON users(auto_mode);
CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_subscribed ON profiles(is_subscribed);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can read their own tweets" ON tweets
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Keep updated_at current on profile updates
CREATE OR REPLACE FUNCTION set_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_profile_updated_at();

-- Auto-reset free-tier tokens every 30 days on profile update/read-touch.
CREATE OR REPLACE FUNCTION refresh_profile_tokens_if_due(
  p_user_id UUID
)
RETURNS profiles AS $$
DECLARE
  p profiles;
BEGIN
  UPDATE profiles
  SET
    tokens_used = CASE
      WHEN NOT is_subscribed AND tokens_reset_at <= TIMEZONE('utc'::text, NOW()) - INTERVAL '30 days' THEN 0
      ELSE tokens_used
    END,
    tokens_reset_at = CASE
      WHEN NOT is_subscribed AND tokens_reset_at <= TIMEZONE('utc'::text, NOW()) - INTERVAL '30 days' THEN TIMEZONE('utc'::text, NOW())
      ELSE tokens_reset_at
    END,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE user_id = p_user_id
  RETURNING * INTO p;

  RETURN p;
END;
$$ LANGUAGE plpgsql;
