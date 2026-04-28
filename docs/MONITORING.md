# Production Monitoring Runbook

## Observability Stack

| Layer | Tool | What It Captures |
|-------|------|-----------------|
| Error tracking | Sentry | Unhandled exceptions, API errors, client crashes |
| Logs | Vercel Log Drains (or stdout) | Structured NDJSON from `src/lib/logger.ts` |
| Analytics | Vercel Analytics (recommended) | Web Vitals, page views, bounce rate |
| Uptime | Vercel / external ping | Endpoint availability |

## Key Metrics to Monitor

| Metric | Where to Find | Alert Threshold |
|--------|--------------|-----------------|
| API error rate | Sentry > Issues | > 5% of requests in 5 min window |
| Groq 429 rate | Logger: `module=ai, status=429` | > 20% of AI calls |
| Tavily success rate | Logger: `module=search` | < 80% success |
| API p95 latency | Vercel Functions > Metrics | > 10s |
| Webhook delivery | Stripe Dashboard > Webhooks | Any failed delivery |
| Auth errors | Sentry: filter `401` responses | Spike > 10 in 5 min |
| Quota exhaustion | Logger: `code=QUOTA_EXCEEDED` | Informational |

## How to Enable Vercel Analytics

1. Go to your Vercel project > Analytics tab
2. Click "Enable" (free for hobby, included in Pro)
3. Web Vitals, pageviews, and function metrics are auto-collected

## Log Search Patterns

The structured logger outputs NDJSON. Common filters:

```bash
# Find all Groq rate-limit errors
cat logs.ndjson | jq 'select(.module == "ai" and .status == 429)'

# Find all quota exceeded events
cat logs.ndjson | jq 'select(.code == "QUOTA_EXCEEDED")'

# Find all webhook failures
cat logs.ndjson | jq 'select(.module == "webhooks" and .level >= 40)'

# Find slow requests (>5s)
cat logs.ndjson | jq 'select(.durationMs > 5000)'
```

## Alert Response Procedures

### High Error Rate (> 5%)

1. Check Sentry for the most common error class
2. If Groq-related: check [status.groq.com](https://status.groq.com) for outages
3. If Supabase-related: check [status.supabase.com](https://status.supabase.com)
4. If code regression: identify the commit via Sentry release tracking, revert

### Groq 429 Spike

1. Check Groq console for current rate limit usage
2. If persistent: temporarily set `AI_MODEL=llama-3.1-8b-instant` (lower limits, higher availability)
3. Consider adding a server-side queue with longer backoff
4. Long-term: request rate limit increase from Groq

### Webhook Failures

1. Check Stripe Dashboard > Developers > Webhooks > recent events
2. If signature verification failing: ensure `STRIPE_WEBHOOK_SECRET` matches endpoint
3. If timeout: check if webhook handler is slow (look for DB/network issues)
4. Stripe auto-retries for 72 hours — events are not lost

### High Latency (p95 > 10s)

1. Check if it's the AI call (Groq) or the search (Tavily) that's slow
2. Groq slow: check model queue depth, consider fallback model
3. Tavily slow: check if cache hit rate dropped (TTL expired for popular queries)
4. Vercel timeout: consider upgrading to Pro plan (25s limit vs 10s hobby)

## Setting Up External Monitoring (Optional)

For uptime monitoring beyond Vercel:

1. **BetterUptime** (free tier): Ping `https://your-app.com/api/billing/usage` every 5 min
2. **UptimeRobot** (free tier): Monitor landing page + API health endpoint
3. Create a simple `/api/health` endpoint that returns 200 (verify DB connectivity)
