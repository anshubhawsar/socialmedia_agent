# Social Media Manager

Production-ready social media automation platform built with Next.js, TypeScript, and OAuth 2.0. The application generates post suggestions with AI, supports one-click publishing workflows, and includes optional autonomous posting from curated feeds.

## Live Application

- Production: https://social-media-manager-two-gilt.vercel.app

## Core Features

- OAuth 2.0 PKCE authentication for X (Twitter)
- AI-assisted post generation with multiple variations
- Manual review and publish flow
- Optional autonomous mode with RSS-based content discovery
- Pro subscription flow with Razorpay integration
- Optional Supabase-backed persistence

## Tech Stack

- Frontend: Next.js 16, React, TypeScript
- Styling: Tailwind CSS
- AI: Groq (Llama model family)
- Auth and posting: X API v2 + OAuth 2.0
- Payments: Razorpay
- Deployment: Vercel

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/anshubhawsar/socialmedia_agent.git
cd socialmedia_agent
npm install
```

### 2. Create environment file

```bash
cp .env.example .env.local
```

Configure the required values in `.env.local`:

```env
# AI provider
GROQ_API_KEY=your_groq_api_key

# X OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/callback

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret

# Optional: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run start`: Start production server

## Project Structure

```text
src/
  app/
    api/            # API routes
    dashboard/      # Dashboard UI
    page.tsx        # Landing page
  components/       # Reusable UI components
  lib/              # Business logic and integrations
sql/
  schema.sql        # Optional Supabase schema
scripts/            # Utility and setup scripts
```

## Deployment

### Vercel

```bash
vercel
vercel --prod
```

After deployment, update your X OAuth callback URL:

```text
https://your-app.vercel.app/api/auth/callback
```

## Security Notes

- Never commit API keys or secrets to source control.
- Use Vercel environment variables for production secrets.
- Rotate credentials immediately if accidental exposure occurs.

## License

MIT License.

## Author

Developed by Anshu Bhawsar.
