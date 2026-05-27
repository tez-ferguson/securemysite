# VibeSec Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.11+
- Accounts at: Clerk, Supabase, Stripe, Modal

## 1. Clone and install

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in each value:

### Clerk
1. Create app at https://clerk.com
2. Enable GitHub OAuth in Social Connections
3. Copy publishable key and secret key

### Supabase
1. Create project at https://supabase.com
2. Run `supabase/migrations/001_initial.sql` in the SQL editor
3. Go to Settings → API to get your URL and keys
4. Add your Clerk JWT secret to Supabase: Settings → Auth → JWT Secret (use Clerk's JWT public key)

### Stripe
1. Create account at https://stripe.com
2. Create two products:
   - "Report Unlock" — $29 one-time payment
   - "Agent Fix" — $149 one-time payment
3. Copy the price IDs for each
4. Set up webhook endpoint: `https://your-domain.com/api/payments/webhook`
   - Events to listen for: `checkout.session.completed`

### Modal
1. Install Modal: `pip install modal`
2. Authenticate: `modal setup`
3. Create secrets in Modal dashboard:
   - `anthropic-key`: Set `ANTHROPIC_API_KEY`
   - `app-callback-secret`: Set `APP_CALLBACK_SECRET`
4. Deploy scanner: `modal deploy scanner/app.py`
5. Copy the function URL to `MODAL_FUNCTION_URL` in your env

### GitHub App
1. Go to GitHub Settings → Developer Settings → GitHub Apps → New GitHub App
2. Set permissions: Contents (Read), Metadata (Read)
3. Generate and download private key
4. Copy App ID and paste private key (as single line with \n) into env

## 3. Deploy to Vercel

```bash
npx vercel
```

Set all environment variables in Vercel dashboard.

## 4. Add NEXT_PUBLIC_APP_URL

Set this to your Vercel deployment URL (e.g., `https://vibesec.vercel.app`).
