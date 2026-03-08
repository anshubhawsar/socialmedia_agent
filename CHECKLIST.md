# Deployment Checklist

Complete this checklist before deploying to production.

---

## 📋 Pre-Deployment

### Credentials Obtained
- [ ] Twitter Client ID & Secret
- [ ] Google Gemini API Key
- [ ] Supabase Project URL & Service Role Key
- [ ] Random CRON_SECRET generated

### Database
- [ ] Supabase project created
- [ ] SQL schema executed (sql/schema.sql)
- [ ] `users` table verified
- [ ] `tweets` table verified
- [ ] Row-level security configured

### Local Testing
- [ ] `.env.local` file created with all variables
- [ ] `npm install` completed
- [ ] `npm run build` passes without errors
- [ ] `npm run dev` starts successfully
- [ ] Landing page loads at http://localhost:3000
- [ ] Twitter login redirects properly
- [ ] OAuth callback works
- [ ] Dashboard loads after authentication
- [ ] Manual tweet posting works
- [ ] User profile fetches correctly

### Twitter App Configuration
- [ ] OAuth 2.0 enabled
- [ ] Scopes set: tweet.write, tweet.read, users.read, offline.access
- [ ] Offline access enabled (critical)
- [ ] Redirect URI configured for localhost: `http://localhost:3000/api/auth/callback`

---

## 🚀 Deployment Steps

### Step 1: Vercel Setup
- [ ] Logged into Vercel
- [ ] Project created or imported from Git
- [ ] Git repository contains all source code

### Step 2: Environment Variables
Set in Vercel project Settings → Environment Variables:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `TWITTER_CLIENT_ID`
- [ ] `TWITTER_CLIENT_SECRET`
- [ ] `TWITTER_REDIRECT_URI` = `https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callback`
- [ ] `GEMINI_API_KEY`
- [ ] `CRON_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://YOUR_VERCEL_DOMAIN.vercel.app`
- [ ] `ENVIRONMENT` = `production`

### Step 3: Update Twitter App
- [ ] Update callback URI in Twitter app to Vercel domain
- [ ] Verify exact match: `https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callback`

### Step 4: Verify Cron Configuration
- [ ] `vercel.json` exists in project root
- [ ] Cron path: `/api/cron/agent-loop`
- [ ] Cron schedule: `0 */6 * * *` (or your preference)
- [ ] Vercel project has Cron capability enabled

### Step 5: Production Build
- [ ] Push to main branch (if using Git)
- [ ] Vercel automatically builds and deploys
- [ ] Wait for green checkmark on deployment
- [ ] View deployment logs for any errors

---

## ✅ Post-Deployment Testing

### Access Application
- [ ] Visit `https://YOUR_VERCEL_DOMAIN.vercel.app`
- [ ] Landing page loads
- [ ] Twitter login button functional

### Test OAuth Flow
- [ ] Click "Login with Twitter"
- [ ] Redirects to Twitter authorization
- [ ] User authorizes
- [ ] Redirects back to dashboard
- [ ] Dashboard shows username

### Test Manual Tweet
- [ ] Enter context in textarea
- [ ] Click "Generate & Post Tweet"
- [ ] Tweet appears in success message
- [ ] Tweet visible on Twitter account
- [ ] Tweet logged in Supabase `tweets` table

### Test Auto Mode
- [ ] Enable "Autonomous Mode" on dashboard
- [ ] Run cron manually (curl or Vercel dashboard):
  ```bash
  curl -X POST https://YOUR_DOMAIN.vercel.app/api/cron/agent-loop \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```
- [ ] Check response for success message
- [ ] Tweet posted to Twitter account
- [ ] Tweet logged in Supabase

### Monitor Logs
- [ ] Vercel dashboard shows successful deployments
- [ ] No errors in Vercel functions logs
- [ ] Supabase shows database activity
- [ ] Twitter API usage within free tier limits

---

## 🔒 Security Verification

- [ ] No credentials in `vercel.json` or public files
- [ ] `.env.local` is in `.gitignore` (not committed)
- [ ] CRON_SECRET is strong (32+ random characters)
- [ ] Service role key only used server-side
- [ ] API keys never exposed in client code
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] HTTP-only cookies for sessions
- [ ] No console.logs with sensitive data

---

## 📊 Monitor & Maintain

### Daily (First Week)
- [ ] Check Vercel dashboard for errors
- [ ] Verify tweets posting to Twitter
- [ ] Monitor Supabase database size
- [ ] Review API quota usage

### Weekly
- [ ] Verify cron job executes on schedule
- [ ] Check for any authentication errors
- [ ] Monitor Gemini API usage
- [ ] Review Twitter API quota status

### Monthly
- [ ] Backup important data
- [ ] Review costs (should be $0)
- [ ] Update dependencies if needed
- [ ] Check free tier limits

---

## 🐛 Troubleshooting During Deployment

### Build Fails
- [ ] Check TypeScript errors in build log
- [ ] Verify all environment variables are set
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Review recent code changes

### OAuth Redirect Fails
- [ ] Check TWITTER_REDIRECT_URI matches exactly
- [ ] Verify it matches Twitter app settings
- [ ] Ensure HTTPS is used (not HTTP)
- [ ] Check for typos in domain

### Cron Not Running
- [ ] Verify `vercel.json` exists in root
- [ ] Check cron path is exactly `/api/cron/agent-loop`
- [ ] Confirm CRON_SECRET is set in environment
- [ ] Verify project is on production environment
- [ ] Check Vercel project has Cron support

### Tweet Not Posting
- [ ] Verify user tokens in Supabase `users` table
- [ ] Check Twitter API rate limits
- [ ] Ensure tweet is under 280 characters
- [ ] Verify `TWITTER_CLIENT_SECRET` is correct

---

## 📞 Support Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Twitter API Docs: https://developer.twitter.com/en/docs
- Google Gemini Docs: https://ai.google.dev
- Supabase Docs: https://supabase.com/docs

---

## Final Review

Before marking complete:

- [ ] Application is live at Vercel domain
- [ ] All environment variables configured
- [ ] Database initialized with schema
- [ ] OAuth working end-to-end
- [ ] Manual posting tested and working
- [ ] Autonomous mode enabled and tested
- [ ] Cron job scheduled and verified
- [ ] No errors in Vercel logs
- [ ] Twitter account receiving posts
- [ ] Documentation updated with your domain

---

## 🎉 Deployment Complete!

Your AI Twitter Agent is live and autonomous. Monitor periodically but it should run without intervention.

**Next Steps:**
1. Share your domain (tweets should appear regularly)
2. Monitor free tier quotas
3. Customize RSS feeds as desired
4. Enjoy autonomous tweets! 🤖🐦
