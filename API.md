# API Reference

## Authentication Endpoints

### POST /api/auth/login
Initiates the OAuth 2.0 PKCE flow with Twitter.

**Request:**
- Method: GET (redirects to Twitter)

**Response:**
- Redirects to Twitter authorization URL
- Sets cookies: `code_verifier`, `oauth_state`

**Example:**
```bash
curl -L http://localhost:3000/api/auth/login
```

---

### GET /api/auth/callback
Twitter OAuth callback handler. Called by Twitter after user authorizes.

**Query Parameters:**
- `code` (string): Authorization code from Twitter
- `state` (string): State parameter for CSRF protection

**Response:**
```json
{
  "redirect": "/dashboard"
}
```

**Cookies Set:**
- `userId`: HTTP-only cookie with user UUID (1 year expiry)

**Side Effects:**
- Creates or updates user in Supabase
- Stores/refreshes Twitter tokens

---

## User Endpoints

### GET /api/user/profile
Get authenticated user's profile.

**Headers:**
- `Cookie`: Must contain `userId` (set by auth callback)

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "example_user",
  "auto_mode": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing userId
- `404`: User not found
- `500`: Server error

**Example:**
```bash
curl -b "userId=<user-uuid>" http://localhost:3000/api/user/profile
```

---

### PATCH /api/user/profile
Update user settings.

**Headers:**
- `Cookie`: Must contain `userId`
- `Content-Type`: application/json

**Request Body:**
```json
{
  "auto_mode": true
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing userId
- `500`: Server error

**Example:**
```bash
curl -X PATCH \
  -b "userId=<user-uuid>" \
  -H "Content-Type: application/json" \
  -d '{"auto_mode": true}' \
  http://localhost:3000/api/user/profile
```

---

## Agent Endpoints

### POST /api/agent/post
Generate tweet from context and post to Twitter.

**Headers:**
- `Cookie`: Must contain `userId`
- `Content-Type`: application/json

**Request Body:**
```json
{
  "context": "A major breakthrough in transformer architecture was announced"
}
```

**Response:**
```json
{
  "success": true,
  "tweet": "Researchers unveil a revolutionary transformer architecture improving inference speed by 40%...",
  "tweetId": "1234567890123456789"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing context or userId
- `404`: User not found
- `500`: API error (Gemini, Twitter, etc.)

**Behavior:**
1. Validates context is present
2. Loads user and refreshes tokens if needed
3. Calls Gemini API to generate tweet
4. Posts to Twitter API
5. Logs tweet to Supabase
6. Returns generated tweet and ID

**Example:**
```bash
curl -X POST \
  -b "userId=<user-uuid>" \
  -H "Content-Type: application/json" \
  -d '{"context": "New AI model beats benchmarks"}' \
  http://localhost:3000/api/agent/post
```

---

## Cron Endpoints

### POST /api/cron/agent-loop
Autonomous news agent. Fetches RSS feeds, synthesizes headlines, and posts to all enabled users.

**Headers:**
- `Authorization: Bearer <CRON_SECRET>`

**Query Parameters:**
- None

**Response:**
```json
{
  "success": true,
  "message": "Posted to 3 users, 0 failed",
  "selectedHeadline": "Researchers develop efficient transformer model",
  "tweet": "New efficient transformer model reduces memory usage by 30%..."
}
```

**Status Codes:**
- `200`: Success (even with some failures)
- `401`: Invalid or missing CRON_SECRET
- `500`: Critical error

**Behavior:**
1. Verifies CRON_SECRET
2. Fetches top 5 headlines from RSS feeds
3. Calls Gemini to select and synthesize top headline
4. Lists users with auto_mode = true
5. For each user:
   - Refreshes tokens if expired
   - Posts tweet
   - Logs to database
6. Returns aggregated results

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/agent-loop
```

**Cron Configuration (vercel.json):**
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

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "error": "Description of what went wrong"
}
```

**Common Error Messages:**
- `"Missing userId"` - User not authenticated
- `"User not found"` - User ID exists but no user record
- `"Failed to post tweet"` - Twitter API error
- `"Unauthorized"` - Invalid CRON_SECRET

---

## Rate Limits

| Endpoint | Limit | Source |
|----------|-------|--------|
| /api/auth/login | Unlimited | Server |
| /api/auth/callback | Unlimited | Twitter |
| /api/user/profile | No limit | Server |
| /api/agent/post | 15/min | Gemini API |
| /api/cron/agent-loop | 1 per schedule | Vercel Cron |

---

## Examples

### Complete Manual Tweet Flow

```bash
# 1. Login (redirect in browser)
open http://localhost:3000/api/auth/login

# 2. After user authorizes, get profile
curl -b "userId=<user-uuid>" \
  http://localhost:3000/api/user/profile

# 3. Post a tweet
curl -X POST \
  -b "userId=<user-uuid>" \
  -H "Content-Type: application/json" \
  -d '{"context": "AI researchers achieve new accuracy milestone"}' \
  http://localhost:3000/api/agent/post
```

### Autonomous Mode Setup

```bash
# 1. Get current user
curl -b "userId=<user-uuid>" \
  http://localhost:3000/api/user/profile

# 2. Enable autonomous mode
curl -X PATCH \
  -b "userId=<user-uuid>" \
  -H "Content-Type: application/json" \
  -d '{"auto_mode": true}' \
  http://localhost:3000/api/user/profile

# 3. Test cron endpoint
curl -X POST \
  -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/agent-loop
```

---

## Debugging

### Enable Verbose Logging

Add to `/api/*/route.ts` files:

```typescript
console.log('Request:', {
  userId,
  method: request.method,
  headers: Object.fromEntries(request.headers),
  body,
});
```

### Check Supabase Logs

View recent activity in Supabase dashboard:
- SQL Editor → View recent queries
- Auth tab → Authentication events
- Database → Table activity

### Monitor Twitter API Calls

Check Twitter API usage in [developer.twitter.com](https://developer.twitter.com):
- Check quota limits
- View recent API calls
- Review error logs

---

## SDK/Library Integration

### TypeScript Types

All responses use types from `src/types/index.ts`:

```typescript
import { User, Tweet, TweetRequest } from '@/types';

// POST /api/agent/post
const request: TweetRequest = { context: '...' };
const response = { success: true, tweet: '...', tweetId: '...' };
```

### Fetch Wrapper

For client-side calls:

```typescript
async function apiCall<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

// Usage
const tweet = await apiCall('/api/agent/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context: '...' }),
});
```
