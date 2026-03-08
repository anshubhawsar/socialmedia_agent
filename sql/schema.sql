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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_twitter_id ON users(twitter_id);
CREATE INDEX IF NOT EXISTS idx_users_auto_mode ON users(auto_mode);
CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can read their own tweets" ON tweets
  FOR SELECT USING (auth.uid()::text = user_id::text);
