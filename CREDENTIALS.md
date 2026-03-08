# Setup Credentials Guide

Complete step-by-step guide to obtain all required credentials.

## Twitter Developer Account

### Step 1: Create Developer Account
1. Go to https://developer.twitter.com
2. Click "Sign up for free"
3. Fill in account details (person or organization)
4. Agree to terms
5. Check your email for verification link
6. Verify and set up your developer account

### Step 2: Create a Project
1. In Twitter Developer Portal, go to "Projects"
2. Click "Create new project"
3. Name it (e.g., "AI Twitter Agent")
4. Select use case: "Making a bot"
5. Proceed to app creation

### Step 3: Create an App
1. Name your app (e.g., "ai-agent")
2. Save the API Key, API Secret Key, Bearer Token somewhere safe
3. Go to "Keys and tokens" tab
4. Under "Authentication Tokens":
   - Generate "Access Token" (copy these down)
   - Generate "Access Token Secret"

### Step 4: Enable OAuth 2.0
1. In app settings, go to "Authentication settings"
2. Enable "3-legged OAuth"
3. Check boxes:
   - [x] Request email address from users
   - [x] Offline Access (CRITICAL!)
4. Set Redirect URLs:
   ```
   http://localhost:3000/api/auth/callback
   ```
   (After deployment, add Vercel domain too)
5. Check scopes:
   - [x] tweet.write
   - [x] tweet.read
   - [x] users.read
   - [x] offline.access (REQUIRED)
6. Save

### Step 5: Get Your Credentials
In "Keys and tokens" tab, find:
- **API Key** (X-API-Key) = `TWITTER_CLIENT_ID`
- **API Secret Key** = `TWITTER_CLIENT_SECRET`

Store these in `.env.local`:
```env
TWITTER_CLIENT_ID=YOUR_API_KEY
TWITTER_CLIENT_SECRET=YOUR_API_SECRET_KEY
```

---

## Google Gemini API

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click "Create Project"
3. Name it "AI Twitter Agent"
4. Wait for project to be created

### Step 2: Enable Gemini API
1. Go to APIs & Services → Library
2. Search for "Generative Language API"
3. Click it
4. Click "Enable"

### Step 3: Create API Key
1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Restrict key (optional but recommended):
   - Application restrictions: Android, iOS, or HTTP...
   - Select: HTTP referrers
   - Add your Vercel domain

### Step 4: Alternative - Get Key from AI Studio
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Copy the generated key

Store in `.env.local`:
```env
GEMINI_API_KEY=YOUR_API_KEY
```

### Step 5: Verify It Works
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

---

## Supabase Project

### Step 1: Create Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify email

### Step 2: Create Project
1. Click "New project"
2. Enter project name: "ai-twitter-agent"
3. Set database password (save this!)
4. Select region closest to you
5. Click "Create new project"
6. Wait ~5 minutes for setup

### Step 3: Get Credentials
1. Go to project Settings → API
2. Find these values:
   - **Project URL** (under "API") = `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the URL (e.g., `https://xxxxx.supabase.co`)

3. Go to Settings → API → Service Role
4. Copy the key (starts with `eyJ...`) = `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Set Up Database
1. In Supabase, go to SQL Editor
2. Click "New query"
3. Copy entire content of `sql/schema.sql` from your project
4. Paste into SQL editor
5. Click "Execute" / "Run"
6. Check for green checkmark

### Step 5: Verify Tables
1. Go to Table Editor
2. You should see:
   - `users` table
   - `tweets` table
3. Check the columns match the schema

Store in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

---

## Vercel Account

### Step 1: Create Account
1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Verify email

### Step 2: Create Project
1. Click "New Project"
2. Import from Git (GitHub)
3. Select your repository
4. Project name: "ai-twitter-agent"
5. Create project

### Step 3: Add Environment Variables
1. Go to project Settings → Environment Variables
2. Add each variable:

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

### Step 4: Enable Cron Jobs
1. Crons are automatically configured in `vercel.json`
2. Check that your project has access to Crons
3. Cron jobs only run on production

### Step 5: Deploy
1. Push to GitHub
2. Vercel automatically deploys
3. Get your domain from Vercel dashboard
4. Update Twitter redirect URI to use this domain

---

## Environment File Template

Create `.env.local` in project root:

```env
# Supabase (PostgreSQL Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...abc123...xyz789

# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your_client_id_from_twitter
TWITTER_CLIENT_SECRET=your_client_secret_from_twitter
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Google Gemini API
GEMINI_API_KEY=AIzaSy...xyz789...abc123

# Vercel Cron Security
CRON_SECRET=generate_with_openssl_rand_hex_32

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVIRONMENT=development
```

**To Generate CRON_SECRET:**
```bash
# On Mac/Linux
openssl rand -hex 32

# On Windows PowerShell
[System.Convert]::ToHexString((1..32 | ForEach-Object {Get-Random -Max 256}))

# Or just use a random 64-character string
# e.g., abcdef0123456789abcdef0123456789
```

---

## Verification Checklist

Before deploying, verify all credentials work:

- [ ] Twitter OAuth redirects to authorization screen
- [ ] Supabase database has users & tweets tables
- [ ] Gemini API returns response to test request
- [ ] All environment variables are set
- [ ] CRON_SECRET is randomly generated
- [ ] TWITTER_REDIRECT_URI matches Twitter app settings

---

## Troubleshooting Credentials

### Twitter Client ID Not Working
- Verify app exists in Twitter Developer Portal
- Check that OAuth 2.0 is enabled
- Offline access checkbox must be checked
- Correct scopes: tweet.write, tweet.read, users.read, offline.access

### Supabase Connection Failed
- Check URL format: `https://xxxxx.supabase.co`
- Verify service role key starts with `eyJ`
- Run database schema script
- Check tables exist in Table Editor

### Gemini API Returns 429
- Free tier has 15 requests/minute limit
- Wait a minute between requests
- Upgrade if needed for higher limits

### Twitter Redirect URI Mismatch
- Exact match required (including http vs https)
- For localhost: `http://localhost:3000/api/auth/callback`
- For Vercel: `https://YOUR_PROJECT.vercel.app/api/auth/callback`

---

## Keeping Credentials Safe

✅ **DO:**
- Store in `.env.local` (never commit)
- Use environment variables in production
- Rotate credentials regularly
- Keep API keys secure

❌ **DON'T:**
- Share credentials via email
- Commit `.env.local` to Git
- Expose keys in client-side code
- Use same credentials across projects

---

## Getting Help

If you get stuck:

1. Check the credential provider's documentation
2. Verify all settings match this guide exactly
3. Look for typos or extra spaces
4. Test each credential individually
5. Ask in provider's support forum

Provider Support:
- Twitter: https://developer.twitter.com/en/support
- Google: https://support.google.com/googleapi
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/support
