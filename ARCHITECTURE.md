# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (App Router)                             │  │
│  │  - Landing page                                            │  │
│  │  - OAuth callback handler                                  │  │
│  │  - Dashboard (manual & autonomous modes)                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────┬──────────────────────────────────────────────────────────┬─┘
       │                                                          │
       │ HTTP/REST                                               │
       │                                                          │
┌──────▼──────────────────────────────────────────────────────────▼──┐
│                     Vercel Edge (Next.js API Routes)               │
├────────────────────────────────────────────────────────────────────┤
│  API Routes:                                                       │
│  ├─ /api/auth/login         → Initiate OAuth PKCE flow            │
│  ├─ /api/auth/callback      → Handle OAuth callback, save tokens   │
│  ├─ /api/user/profile       → Get/update user settings             │
│  ├─ /api/agent/post         → Generate & post manual tweet         │
│  └─ /api/cron/agent-loop    → Autonomous agent (cron triggered)    │
│                                                                     │
│  Cron Jobs:                                                        │
│  └─ Every 6 hours (configurable) → Run agent-loop                 │
├────────────────────────────────────────────────────────────────────┤
│  Middleware:                                                       │
│  └─ Extract userId from cookie & pass to API routes               │
└──────┬──────────────────────┬──────────────────────┬───────────────┘
       │                      │                      │
       │                      │                      │
       │ HTTPS               │ HTTPS                │ HTTPS
       │                      │                      │
┌──────▼────────┐  ┌──────────▼──────────┐  ┌───────▼────────┐
│  Twitter API  │  │  Google Gemini API  │  │  Supabase      │
│  v2           │  │                     │  │  PostgreSQL    │
├───────────────┤  ├─────────────────────┤  ├────────────────┤
│- OAuth 2.0    │  │- Generate tweets    │  │- users table   │
│- Post tweets  │  │- Analyze headlines  │  │- tweets table  │
│- Get profile  │  │- LLM synthesis      │  │- Auth tokens   │
└───────────────┘  └─────────────────────┘  └────────────────┘
       ▲                      ▲
       │                      │
       │ OAuth tokens         │ API key (server-side only)
       │                      │
       └──────────────────────┴── Environment variables (Vercel secrets)
```

## Data Flow

### Manual Mode (User-Triggered Tweet)

```
1. User inputs context → Dashboard textarea
2. POST /api/agent/post with {context}
3. Middleware: Extract userId from cookie
4. Load user from Supabase (get access_token)
5. Check if token is expired → refresh if needed
6. Send context to Gemini API
7. Get generated tweet from Gemini
8. POST to Twitter API with access_token
9. Log tweet to Supabase tweets table
10. Return tweet to frontend
```

### Autonomous Mode (Cron-Triggered)

```
1. Vercel invokes /api/cron/agent-loop every 6 hours
2. Verify CRON_SECRET header
3. Fetch top 5 headlines from RSS feeds:
   - ArXiv CS.AI
   - MIT News
   - DeepLearning.AI
   - Algorithm Bridge
   - Ars Technica
4. Send headlines to Gemini API
5. Get best headline index + synthesized tweet
6. Fetch all users where auto_mode = true
7. For each user:
   - Get access_token from Supabase
   - Refresh if expired
   - POST tweet to Twitter API
   - Log tweet to tweets table
8. Return results (success count, failed count)
```

### OAuth Flow (Initial Login)

```
1. User clicks "Login with Twitter"
2. Generate PKCE code_verifier & code_challenge
3. Redirect to Twitter authorize URL
4. User authorizes, Twitter redirects to /api/auth/callback?code=xxx&state=yyy
5. Exchange code + code_verifier for access_token + refresh_token
6. Fetch user profile from Twitter API
7. Create or update user in Supabase:
   - twitter_id (unique)
   - username
   - access_token
   - refresh_token
   - expires_at
8. Set userId cookie (HTTP-only)
9. Redirect to /dashboard
```

## Database Schema

### users table
```sql
id                UUID PRIMARY KEY
twitter_id        TEXT UNIQUE (from Twitter API)
email             TEXT
username          TEXT UNIQUE
access_token      TEXT (encrypted recommended)
refresh_token     TEXT (encrypted recommended)
expires_at        BIGINT (Unix timestamp)
auto_mode         BOOLEAN (default: false)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### tweets table
```sql
id                UUID PRIMARY KEY
user_id           UUID (FK → users.id)
tweet_id          TEXT UNIQUE (from Twitter API)
content           TEXT (the actual tweet)
is_auto           BOOLEAN (manual vs autonomous)
created_at        TIMESTAMP
```

## Security Architecture

### Token Management
- OAuth 2.0 PKCE instead of implicit flow
- Refresh tokens stored securely in Supabase
- `ensureValidAccessToken` checks expiry before every API call
- Automatic token rotation on expiry

### Authentication
- HTTP-only cookies store userId
- Middleware extracts userId and passes via headers
- API routes verify userId before operations
- Row-level security on Supabase (optional)

### Secrets Management
- CRON_SECRET protects cron endpoint
- API keys only used server-side (never in client JS)
- Vercel environment variables for production secrets

## Performance Considerations

### Caching
- RSS feeds fetched on each cron run (no caching yet)
- Could implement Redis cache on paid Vercel tier

### Database Queries
- Single query per user during autonomous posting
- Indexes on twitter_id, auto_mode, created_at
- N+1 safe (parallel Promise.allSettled)

### API Rate Limits
- Twitter API: Essential tier (450 requests/15min)
- Gemini API: 15 requests/minute (free tier)
- Supabase: Generous free tier
- Design: ≤ 2 API calls per autonomous cycle (RSS + tweet)

## Scalability

### Current Limits (Free Tier)
- RPM: ~30 tweets/day max (15 Gemini calls/min, 2 calls per tweet)
- Users: Unlimited (Supabase free tier)
- Storage: 500MB (sufficient for ~50k tweets)

### To Scale Beyond Free Tier
- Move to paid Gemini tier (higher RPM)
- Upgrade Supabase plan (more storage)
- Implement Redis caching (Vercel Pro)
- Batch Gemini calls per cron run

## Deployment Topology

### Local Development
```
npm run dev
→ localhost:3000
→ Supabase Free Project
→ .env.local credentials
```

### Production (Vercel)
```
Domain: YOUR_PROJECT.vercel.app
├─ Web server (Next.js Edge Runtime)
├─ Cron trigger (Vercel Crons)
├─ Environment variables (Vercel Secrets)
└─ External APIs (Twitter, Gemini, Supabase)
```

## Error Handling

### API Route Errors
- Catch errors, log to console
- Return JSON with error field
- Frontend displays error message

### Token Expiry
- `ensureValidAccessToken` refreshes automatically
- If refresh fails, user must re-authenticate

### Twitter API Errors
- Handled in `postTweet` function
- Circuit breaker pattern: fail gracefully
- Log to console for debugging

### Gemini Errors
- Check API key on startup
- Catch generation errors in routes
- Fallback: use original headline if synthesis fails

## Monitoring

### Logging Strategy
- Console logs for debugging
- Error stack traces to console
- Could integrate: Sentry, LogRocket

### Key Metrics to Monitor
- Cron success/failure rate
- Tweet posting success rate
- API latency
- Database query performance

## Future Enhancements

1. **Analytics Dashboard** - Tweet performance, engagement metrics
2. **Custom Prompts** - Per-user LLM prompt customization
3. **Multiple Accounts** - One user, multiple Twitter accounts
4. **Hashtag Strategy** - Dynamic hashtag generation
5. **Media Attachments** - Support for images/videos
6. **Webhook Notifications** - Discord/Slack alerts on posts
7. **A/B Testing** - Test different tweet variations
8. **Follow Sync** - Auto-follow relevant accounts
