# Production Deployment Checklist

## Pre-Deploy Requirements

### Environment Variables

Set all of these in your hosting provider (Vercel, etc.):

| Variable | Source | Notes |
|----------|--------|-------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Production key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API | Production project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | **Secret** — server only |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) | **Live key** (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Developers > Webhooks | After creating endpoint |
| `STRIPE_PRICE_PRO` | Stripe Dashboard > Products | Live price ID for $9/mo |
| `STRIPE_PRICE_LIFETIME` | Stripe Dashboard > Products | Live price ID for $49 one-time |
| `NEXT_PUBLIC_APP_URL` | Your domain | `https://your-app.com` (no trailing slash) |
| `TAVILY_API_KEY` | [app.tavily.com](https://app.tavily.com) | Production key |
| `UPSTASH_REDIS_REST_URL` | [console.upstash.com](https://console.upstash.com) | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console | Redis auth token |
| `RESEND_API_KEY` | [resend.com](https://resend.com) | For branded emails |
| `EMAIL_FROM` | Your verified domain | e.g., `Vibe Check <noreply@vibecheck.app>` |
| `NEXT_PUBLIC_SENTRY_DSN` | [sentry.io](https://sentry.io) | Error tracking DSN |
| `LIFETIME_CAP` | (optional) | Default: 100 |

### Stripe: Test to Live Switchover

1. **Create live products** in Stripe Dashboard > Products:
   - "Vibe Check Pro" — $9/month recurring
   - "Vibe Check Lifetime" — $49 one-time payment
2. Copy the **live price IDs** (`price_...`) to env vars
3. Switch from `sk_test_...` to `sk_live_...` secret key
4. **Register webhook endpoint**:
   - URL: `https://your-app.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.created`, `customer.subscription.deleted`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
5. **Test**: Make a real $1 purchase (create a $1 test product) to verify the full flow

### Supabase Production Setup

1. Create a **new Supabase project** (don't reuse dev)
2. Run all migrations:
   ```bash
   pnpm dlx supabase link --project-ref YOUR_PROJECT_REF
   pnpm dlx supabase db push
   ```
3. Add allowed redirect URL in Authentication > URL Configuration:
   ```
   https://your-app.com/auth/callback
   ```
4. Set Site URL to `https://your-app.com`

### DNS & Domain

1. Point your domain to Vercel (or hosting provider)
2. SSL/TLS certificate is auto-provisioned
3. Verify HSTS header is active after first request

## Deploy Steps

1. Merge all changes to `main`
2. Vercel auto-deploys from main (or trigger manual deploy)
3. Verify build succeeds in Vercel dashboard
4. Check Sentry for build errors

## Post-Deploy Verification (< 5 minutes)

Run through these manually:

- [ ] Landing page loads at production URL
- [ ] Sign in via magic link works (check email delivery)
- [ ] Dashboard loads after sign-in
- [ ] Create new session, enter idea, complete interview
- [ ] Competitor scan completes (Tavily working)
- [ ] Analysis generates report (Groq working)
- [ ] Pricing page shows correct plans and prices
- [ ] "Upgrade to Pro" checkout flow reaches Stripe
- [ ] Webhook test: verify subscription events arrive (Stripe CLI or dashboard)
- [ ] Rate limiting active: hit an endpoint 21 times rapidly → expect 429
- [ ] Error tracking: throw a test error → verify it appears in Sentry

## Rollback Procedure

If something is broken after deploy:

1. **Vercel**: Go to Deployments > click previous successful deployment > "Promote to Production"
2. **Database migration issue**: Restore from Supabase backup (see `docs/BACKUP.md`)
3. **Stripe issue**: Revert webhook endpoint to previous URL; user payments are safe (Stripe retries)

## Gotchas

- Stripe webhook events are **not replayed** after endpoint changes. If you change the URL, create a new endpoint (don't edit the old one)
- Supabase auth cookies are project-specific. Users authenticated on dev won't be authenticated on prod
- First deploy with `instrumentation.ts` will validate env vars — build will fail if required vars are missing
- Magic links expire after 1 hour. If email delivery is slow, users may see expired links
- Vercel's serverless functions have a 10s timeout on hobby plan (25s on Pro). Analysis calls may timeout — consider Vercel Pro if needed
