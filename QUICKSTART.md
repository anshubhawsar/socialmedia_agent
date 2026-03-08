# Quick Start Guide

## 5-Minute Setup

### 1. Get Your Credentials

**Twitter:**
- Go to [developer.twitter.com](https://developer.twitter.com)
- Create app with OAuth 2.0
- Copy `Client ID` and `Client Secret`

**Gemini:**
- Go to [makersuite.google.com](https://makersuite.google.com)
- Create API key

**Supabase:**
- Create project at [supabase.com](https://supabase.com)
- Copy project URL and service role key

### 2. Setup Database

1. Open Supabase SQL editor
2. Copy entire content of `sql/schema.sql`
3. Paste and execute in SQL editor
4. Done!

### 3. Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local .env.local

# Edit with your credentials
nano .env.local

# Start dev server
npm run dev
```

### 4. Test Locally

1. Go to `http://localhost:3000`
2. Click "Login with Twitter"
3. Authorize app
4. Try posting a tweet
5. Enable Autonomous Mode (optional)

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in dashboard
# Update TWITTER_REDIRECT_URI to your Vercel domain
```

## Environment Variables Checklist

```json
{
  "NEXT_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
  "SUPABASE_SERVICE_ROLE_KEY": "eyJxxx",
  "TWITTER_CLIENT_ID": "xxx",
  "TWITTER_CLIENT_SECRET": "xxx",
  "TWITTER_REDIRECT_URI": "http://localhost:3000/api/auth/callback",
  "GEMINI_API_KEY": "AIzaSyxxx",
  "CRON_SECRET": "random-secret-string",
  "NEXT_PUBLIC_APP_URL": "http://localhost:3000",
  "ENVIRONMENT": "development"
}
```

## Common Issues

| Issue | Solution |
|-------|----------|
| OAuth Redirect Failed | Check `TWITTER_REDIRECT_URI` matches Twitter app settings |
| 400 Error on Profile | Expected if not logged in, log in with Twitter |
| Cron Not Running | Verify `vercel.json` exists, environment on production |
| Empty Tweets | Check Gemini API key is valid |

## Next Steps

1. **Customize RSS Feeds**: Edit `src/lib/rss.ts` to add/remove feeds
2. **Adjust Cron Schedule**: Edit `vercel.json` - `schedule` field uses cron syntax
3. **Modify Tweet Prompts**: Edit `src/lib/agent.ts` - adjust LLM prompts
4. **Add Analytics**: Connect Supabase dashboard to view tweet history

## Support

- Twitter API docs: https://developer.twitter.com/en/docs
- Gemini API docs: https://ai.google.dev/docs
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
