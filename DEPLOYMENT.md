# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **Twitter Developer Credentials**
   - Visit [developer.twitter.com](https://developer.twitter.com)
   - Create a project and app with OAuth 2.0 enabled
   - Request `offline.access` scope
   - Get your `Client ID` and `Client Secret`

2. **Google Gemini API Key**
   - Visit [makersuite.google.com](https://makersuite.google.com)
   - Enable Gemini API for your project
   - Get an API key

3. **Supabase Project**
   - Create a free project at [supabase.com](https://supabase.com)
   - Get your project URL and service role key

4. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)

## Step 1: Supabase Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query and paste the contents of `sql/schema.sql`
4. Run the query
5. Verify the `users` and `tweets` tables are created

## Step 2: Local Testing

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd social_media_manager
   npm install
   ```

2. Create `.env.local` from the template:
   ```bash
   cp .env.local .env.local.example
   ```

3. Fill in all environment variables with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   TWITTER_CLIENT_ID=YOUR_CLIENT_ID
   TWITTER_CLIENT_SECRET=YOUR_CLIENT_SECRET
   TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/callback
   GEMINI_API_KEY=YOUR_GEMINI_KEY
   CRON_SECRET=your-random-secret-generate-with-openssl-rand-hex-32
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ENVIRONMENT=development
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Test at `http://localhost:3000`

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to link your project.

### Option B: Using GitHub

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import from Git repository
5. Select this project

## Step 4: Configure Environment Variables on Vercel

In your Vercel project dashboard:

1. Go to Settings → Environment Variables
2. Add all variables from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TWITTER_CLIENT_ID
TWITTER_CLIENT_SECRET
TWITTER_REDIRECT_URI=https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callback
GEMINI_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
ENVIRONMENT=production
```

**Important**: Update `TWITTER_REDIRECT_URI` to your Vercel domain

## Step 5: Verify Cron Jobs

1. Check `vercel.json` in root of project
2. Cron job configured to run `/api/cron/agent-loop` every 6 hours
3. To test locally, run:
   ```bash
   curl -X POST http://localhost:3000/api/cron/agent-loop \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Step 6: Create Twitter App Redirect URI

Go to your Twitter app settings and ensure the Redirect URI matches exactly:

```
https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callback
```

For local development:
```
http://localhost:3000/api/auth/callback
```

## Testing the Deployment

1. Visit your Vercel domain
2. Click "Login with Twitter"
3. Authorize the application
4. You should land on `/dashboard`
5. Test manual tweet posting
6. Enable Autonomous Mode
7. Wait for cron to run (or manually test with curl above)

## Troubleshooting

### OAuth Redirect Failed
- Check `TWITTER_REDIRECT_URI` matches Twitter app settings
- Verify the exact domain is configured in both places

### API Errors
- Check all environment variables are set
- Verify Supabase tables exist
- Check Gemini API key is valid

### Cron Not Running
- Enable Cron in Vercel project settings
- Verify `vercel.json` is in root directory
- Check `CRON_SECRET` is set
- Cron only runs on production environment

### Tweet Not Posting
- Verify user credentials in Supabase `users` table
- Check Twitter API quotas
- Ensure tweets are under 280 characters

## Monitoring

To monitor your deployment:

1. **Vercel Dashboard**: Check function invocations and errors
2. **Supabase**: View `tweets` table for posted content
3. **Twitter**: Check your account for posted tweets

## Scaling Costs

All services used are on free tiers. Current limits:

| Service | Free Tier Limit | Upgrade Cost |
|---------|-----------------|--------------|
| Vercel | 100GB bandwidth | $0.50/GB overage |
| Supabase | 500MB storage | $0.25/GB over 500MB |
| Google Gemini | 15 requests/min | Enterprise pricing |
| Twitter API v2 | Essential tier | $100-2000/month |

The application will never exceed these limits with normal usage (< 100 tweets/month).
