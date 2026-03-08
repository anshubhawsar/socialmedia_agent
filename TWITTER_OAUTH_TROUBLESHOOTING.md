# Setup Credentials Guideomething went wrong"

Complete step-by-step guide to obtain all required credentials.

## Twitter Developer Accountto give access to the App" means Twitter rejected the OAuth authorization request before you could approve it.

### Step 1: Create Developer Account
1. Go to https://developer.twitter.com
2. Click "Sign up for free"
3. Fill in account details (person or organization)
4. Agree to terms0 Not Properly Enabled** ⚠️ MOST COMMON
5. Check your email for verification link
6. Verify and set up your developer account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
### Step 2: Create a Project
1. In Twitter Developer Portal, go to "Projects"ttings**
2. Click "Create new project"
3. Name it (e.g., "AI Twitter Agent")
4. Select use case: "Making a bot"ad and write"
5. Proceed to app creation "Web App, Automated App or Bot"
8. **App info**:
### Step 3: Create an App//localhost:3000/api/auth/callback`
1. Name your app (e.g., "ai-agent"):3000`
2. Save the API Key, API Secret Key, Bearer Token somewhere safe
3. Go to "Keys and tokens" tab
4. Under "Authentication Tokens":k URI**
   - Generate "Access Token" (copy these down)
   - Generate "Access Token Secret"ct URL in the callback list:
```
### Step 4: Enable OAuth 2.0th/callback
1. In app settings, go to "Authentication settings"
2. Enable "3-legged OAuth"
3. Check boxes:
   - [x] Request email address from users
   - [x] Offline Access (CRITICAL!)
4. Set Redirect URLs:r localhost
   ```
   http://localhost:3000/api/auth/callback
   ```
   (After deployment, add Vercel domain too)
5. Check scopes:tings → Permissions
   - [x] tweet.write and write"** (not just "Read-only")
   - [x] tweet.read
   - [x] users.readOAuth 2.0 Client ID & Secret (they change when permissions change!)
   - [x] offline.access (REQUIRED)
6. Save**OAuth 1.0a Instead of OAuth 2.0**

### Step 5: Get Your Credentialsth PKCE**, not OAuth 1.0a.
In "Keys and tokens" tab, find:
- **API Key** (X-API-Key) = `TWITTER_CLIENT_ID`
- **API Secret Key** = `TWITTER_CLIENT_SECRET`ttings
2. Ensure OAuth 2.0 is enabled
Store these in `.env.local`:d (we don't use it)
```env
TWITTER_CLIENT_ID=YOUR_API_KEYss" Scope**
TWITTER_CLIENT_SECRET=YOUR_API_SECRET_KEY
```ix:**
1. In Twitter app settings → User authentication settings
---Under "Additional permissions"
3. Check the box for **"Request email address from users"** (this sometimes enables offline access)
## Google Gemini API

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click "Create Project"
3. Name it "AI Twitter Agent"
4. Wait for project to be createdttings

### Step 2: Enable Gemini APIitter.com/en/portal/projects-and-apps
1. Go to APIs & Services → Library
2. Search for "Generative Language API"
3. Click itettings"
4. Click "Enable"
### Step 2: Check User Authentication Settings
### Step 3: Create API Key
1. Go to APIs & Services → Credentialsings"
2. Click "Create Credentials" → "API Key"onfigured)
3. Copy the generated API key
4. Restrict key (optional but recommended):
   - Application restrictions: Android, iOS, or HTTP...
   - Select: HTTP referrers
   - Add your Vercel domainot needed)

### Step 4: Alternative - Get Key from AI Studio
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Copy the generated keyRL:
http://localhost:3000/api/auth/callback
Store in `.env.local`:
```enve URL:
GEMINI_API_KEY=YOUR_API_KEY
```

### Step 5: Verify It Worksredentials
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```Copy these (NOT the API Key/Secret from OAuth 1.0a section)
4. Update your `.env.local`:
---```env
   TWITTER_CLIENT_ID=your_oauth2_client_id_here
## Supabase ProjectECRET=your_oauth2_client_secret_here
   ```
### Step 1: Create Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify email
   npm run dev
### Step 2: Create Project
1. Click "New project"ost:3000
2. Enter project name: "ai-twitter-agent"
3. Set database password (save this!)
4. Select region closest to you
5. Click "Create new project"
6. Wait ~5 minutes for setup
## Still Not Working?
### Step 3: Get Credentials
1. Go to project Settings → API
2. Find these values:
   - **Project URL** (under "API") = `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the URL (e.g., `https://xxxxx.supabase.co`)
- [ ] Callback URI is exactly `http://localhost:3000/api/auth/callback`
3. Go to Settings → API → Service RoleAuth 1.0a API Key)
4. Copy the key (starts with `eyJ...`) = `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Dev server restarted after changing `.env.local`
### Step 4: Set Up Databasent variables
1. In Supabase, go to SQL Editored
2. Click "New query"
3. Copy entire content of `sql/schema.sql` from your project
4. Paste into SQL editor
5. Click "Execute" / "Run"for errors:
6. Check for green checkmark
2. Go to Console tab
### Step 5: Verify Tables
1. Go to Table Editorsages
2. You should see:
   - `users` table for error logs when callback is hit.
   - `tweets` table
3. Check the columns match the schema

Store in `.env.local`:uth 1.0a (Not Recommended)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co 1.0a, but you'll lose:
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```KCE security
- Offline access
---
**Not recommended** - Keep troubleshooting OAuth 2.0 instead.
## Vercel Account
---
### Step 1: Create Account
1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Verify email your Twitter app settings** (User authentication settings page)
2. **Check if your Twitter Developer account is approved** (not in pending state)
### Step 2: Create Projectp** in Twitter Developer Portal
1. Click "New Project"upport**: https://twittercommunity.com/
2. Import from Git (GitHub)
3. Select your repository
4. Project name: "ai-twitter-agent"
5. Create project

### Step 3: Add Environment Variablesw:
1. Go to project Settings → Environment Variablester
2. Add each variable:orization screen ✅
3. Click "Authorize app"
```Redirects back to your dashboard ✅
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEYorization screen (step 2), the issue is in your Twitter app configuration.
TWITTER_CLIENT_IDTWITTER_CLIENT_SECRETTWITTER_REDIRECT_URI=https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callbackGEMINI_API_KEYCRON_SECRETNEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_DOMAIN.vercel.appENVIRONMENT=production```### Step 4: Enable Cron Jobs1. Crons are automatically configured in `vercel.json`2. Check that your project has access to Crons3. Cron jobs only run on production### Step 5: Deploy1. Push to GitHub2. Vercel automatically deploys3. Get your domain from Vercel dashboard4. Update Twitter redirect URI to use this domain---## Environment File TemplateCreate `.env.local` in project root:```env# Supabase (PostgreSQL Database)NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.coSUPABASE_SERVICE_ROLE_KEY=eyJhbGc...abc123...xyz789# Twitter OAuth 2.0TWITTER_CLIENT_ID=your-client-idTWITTER_CLIENT_SECRET=your-client-secretTWITTER_REDIRECT_URI=http://localhost:3000/api/auth/callback# Google Gemini APIGEMINI_API_KEY=AIzaSy...xyz789...abc123# Vercel Cron SecurityCRON_SECRET=generate_with_openssl_rand_hex_32# Application SettingsNEXT_PUBLIC_APP_URL=http://localhost:3000ENVIRONMENT=development```**To Generate CRON_SECRET:**```bash# On Mac/Linuxopenssl rand -hex 32# On Windows PowerShell[System.Convert]::ToHexString((1..32 | ForEach-Object {Get-Random -Max 256}))# Or just use a random 64-character string# e.g., abcdef0123456789abcdef0123456789```---## Verification ChecklistBefore deploying, verify all credentials work:- [ ] Twitter OAuth redirects to authorization screen- [ ] Supabase database has users & tweets tables- [ ] Gemini API returns response to test request- [ ] All environment variables are set- [ ] CRON_SECRET is randomly generated- [ ] TWITTER_REDIRECT_URI matches Twitter app settings---## Troubleshooting Credentials### Twitter Client ID Not Working- Verify app exists in Twitter Developer Portal- Check that OAuth 2.0 is enabled- Offline access checkbox must be checked- Correct scopes: tweet.write, tweet.read, users.read, offline.access### Supabase Connection Failed- Check URL format: `https://xxxxx.supabase.co`- Verify service role key starts with `eyJ`- Run database schema script- Check tables exist in Table Editor### Gemini API Returns 429- Free tier has 15 requests/minute limit- Wait a minute between requests- Upgrade if needed for higher limits### Twitter Redirect URI Mismatch- Exact match required (including http vs https)- For localhost: `http://localhost:3000/api/auth/callback`- For Vercel: `https://YOUR_PROJECT.vercel.app/api/auth/callback`---## Keeping Credentials Safe✅ **DO:**- Store in `.env.local` (never commit)- Use environment variables in production- Rotate credentials regularly- Keep API keys secure❌ **DON'T:**- Share credentials via email- Commit `.env.local` to Git- Expose keys in client-side code- Use same credentials across projects---## Getting HelpIf you get stuck:1. Check the credential provider's documentation2. Verify all settings match this guide exactly3. Look for typos or extra spaces4. Test each credential individually5. Ask in provider's support forumProvider Support:- Twitter: https://developer.twitter.com/en/support- Google: https://support.google.com/googleapi- Supabase: https://supabase.com/docs- Vercel: https://vercel.com/support