# AI Twitter Agent

A zero-cost, autonomous AI-powered Twitter agent built with Next.js, Gemini API, and RSS feeds. Deploy on Vercel with a PostgreSQL database on Supabase—completely free.

## Features

- **Manual Tweet Generation**: Input context and let AI generate professional tweets
- **Autonomous News Agent**: RSS feeds automatically synthesize AI news into tweets
- **OAuth 2.0 PKCE**: Secure Twitter login with token rotation
- **Vercel Cron Jobs**: Scheduled autonomous posting
- **Zero-Cost Stack**: Vercel, Supabase (free tier), Twitter API v2, Google Gemini

## Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase PostgreSQL (free tier)
- **Auth**: Twitter OAuth 2.0 PKCE
- **AI**: Google Gemini 1.5 Flash
- **RSS**: Multiple high-signal AI/news feeds
- **Hosting**: Vercel with scheduled crons

## Prerequisites

1. **Twitter Developer Account**
   - Apply at [developer.twitter.com](https://developer.twitter.com)
   - Create an app and enable OAuth 2.0 with PKCE
   - Get `Client ID` and `Client Secret`

2. **Google Gemini API Key**
   - Get free tier access at [makersuite.google.com](https://makersuite.google.com)

3. **Supabase Project**
   - Create free project at [supabase.com](https://supabase.com)
   - Get project URL and service role key

4. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)

## Local Setup

### 1. Clone & Install

```bash
git clone <repo>
cd social_media_manager
npm install
```

### 2. Configure Environment

Copy `.env.local` and fill in credentials:

```bash
cp .env.local.template .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/callback
GEMINI_API_KEY=your-gemini-api-key
CRON_SECRET=your-random-secret-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVIRONMENT=development
```

### 3. Database Setup

1. Go to Supabase SQL editor
2. Run `sql/schema.sql`
3. Verify tables created: `users` and `tweets`

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment

### 1. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### 2. Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TWITTER_CLIENT_ID
TWITTER_CLIENT_SECRET
TWITTER_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
GEMINI_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
ENVIRONMENT=production
```

### 3. Enable Cron Jobs

Cron configuration is in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/agent-loop",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours. Adjust the cron expression as needed.

## Usage

### Manual Mode

1. Log in with Twitter
2. Enter context for tweet
3. AI generates and posts immediately

### Autonomous Mode

1. Enable "Autonomous Mode" on dashboard
2. Cron job runs on schedule (default: every 6 hours)
3. Fetches latest AI news from RSS feeds
4. Gemini synthesizes into tweet
5. Posts to all enabled accounts

## API Endpoints

### Auth
- `GET /api/auth/login` - Start OAuth flow
- `GET /api/auth/callback` - OAuth callback handler

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update auto_mode setting

### Agent
- `POST /api/agent/post` - Generate and post tweet

### Cron
- `POST /api/cron/agent-loop` - Autonomous news agent (Vercel cron)

## Security

- OAuth 2.0 PKCE for Twitter
- HTTP-only cookies for session management
- CRON_SECRET for cron endpoint protection
- Row-level security on Supabase
- No sensitive data client-side

## Token Rotation

Tokens are automatically rotated before expiry. The `ensureValidAccessToken` function checks expiration and refreshes if needed on every API call.

## RSS Feeds

Default sources (configurable in `src/lib/rss.ts`):
- ArXiv CS.AI
- MIT News
- DeepLearning.AI
- The Algorithm Bridge
- Ars Technica

## Cost Breakdown

| Service | Cost | Limit |
|---------|------|-------|
| Vercel | Free | 100GB bandwidth/month |
| Supabase | Free | 500MB storage, 2 projects |
| Twitter API v2 | Free | Essential tier |
| Google Gemini | Free | 15 requests/minute |
| **Total** | **$0** | **Generous free limits** |

## Troubleshooting

**"Missing Supabase credentials"**
- Check `.env.local` has all required variables
- Verify Supabase URL and key are correct

**Cron not running**
- Verify `CRON_SECRET` is set in Vercel
- Check cron path in `vercel.json` matches route
- Cron only runs on production on Vercel

**Auth failing**
- Ensure `TWITTER_REDIRECT_URI` matches callback URL
- Verify Twitter app settings have correct redirect
- Check cookies are enabled

**Tweet posting fails**
- Verify Twitter credentials in Supabase `users` table
- Check Twitter API quotas
- Ensure tweets are under 280 characters

## License

MIT
