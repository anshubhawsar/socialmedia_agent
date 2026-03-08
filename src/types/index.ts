export interface User {
  id: string;
  twitter_id: string;
  email?: string;
  username: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  auto_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tweet {
  id: string;
  user_id: string;
  tweet_id: string;
  content: string;
  is_auto: boolean;
  created_at: string;
}

export interface TwitterTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface TwitterProfile {
  data: {
    id: string;
    username: string;
    name: string;
  };
}

export interface RSSItem {
  title?: string;
  content?: string;
  summary?: string;
  link?: string;
  pubDate?: string;
  author?: string;
}

export interface TweetRequest {
  context?: string;
  topic?: string;
  tweet?: string;
}

export interface GeminiResponse {
  content: {
    parts: Array<{
      text: string;
    }>;
  };
}
