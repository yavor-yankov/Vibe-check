# Vibe Check — Automation Guide

> Goal: zero manual work on routine marketing ops. Automate the repeatable, spend time on the irreplaceable (replies, feedback, new features).

---

## Automation Map

| What | Tool | Trigger | Manual effort left |
|---|---|---|---|
| Welcome email | Resend + Next.js | User signs up | None |
| Report-ready email | Resend + Next.js | Report saved | None |
| Quota warning email | Resend + Next.js | Usage hits 2/3 | None |
| Quota exceeded email | Resend + Next.js | Usage === limit | None |
| Pro welcome email | Resend + Stripe webhook | `subscription.created` | None |
| Re-engagement email | Resend Broadcast | Scheduled weekly | Set up once |
| Monthly quota reset email | Resend Broadcast | 1st of month | Set up once |
| Social posts (pre-launch week) | Buffer | Scheduled | Write copy once |
| Product Hunt listing | PH scheduler | Night before launch | Build listing once |
| Sitemap ping on deploy | GitHub Actions | Deployment | Set up once |
| Uptime alerts | UptimeRobot | Health check fails | Set up once |
| New Pro subscriber → Slack alert | Zapier / Make.com | Stripe webhook | Set up once |

---

## 1. Email Automations (Resend + Next.js)

See `EMAIL_SEQUENCES.md` for full copy. This section covers the trigger code.

### Install dependencies
```bash
pnpm add resend react-email @react-email/components
```

### Central helper: `src/lib/email.ts`
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM = {
  default: 'Yavor from Vibe Check <hello@vibecheck.app>',
  reports: 'Vibe Check <reports@vibecheck.app>',
};

export async function sendEmail(params: {
  to: string;
  subject: string;
  from?: string;
  react: React.ReactElement;
}) {
  try {
    await resend.emails.send({
      from: params.from ?? FROM.default,
      to: params.to,
      subject: params.subject,
      react: params.react,
    });
  } catch (err) {
    // Never throw — email failure must not block main user flow
    console.error('[email] failed to send', { to: params.to, err });
  }
}
```

### Trigger 1: Welcome email — auth callback
**File:** `src/app/api/auth/callback/route.ts`

Find the point after `supabase.auth.exchangeCodeForSession()` and user upsert succeeds:

```typescript
import { sendEmail, FROM } from '@/lib/email';
import { WelcomeEmail } from '@/emails/Welcome';

// After user upsert succeeds and only for NEW users:
const isNewUser = !existingUser; // check against your upsert logic
if (isNewUser) {
  await sendEmail({
    to: user.email!,
    subject: "You're in — here's how Vibe Check works",
    react: WelcomeEmail({ firstName: user.user_metadata?.full_name?.split(' ')[0] }),
  });
}
```

### Trigger 2: Report-ready email
**File:** wherever `reports` table insert happens (likely `src/app/api/analyze/route.ts`)

```typescript
import { sendEmail, FROM } from '@/lib/email';
import { ReportReadyEmail } from '@/emails/ReportReady';

// After report is inserted:
await sendEmail({
  to: userEmail,
  from: FROM.reports,
  subject: `Your Vibe Check report for "${ideaTitle}" is ready`,
  react: ReportReadyEmail({
    ideaTitle,
    score: report.overall_score,
    verdict: report.verdict,
    reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/report/${report.id}`,
  }),
});
```

### Trigger 3 & 4: Quota emails
**File:** `src/lib/quota.ts` or wherever `increment_usage` is called

```typescript
import { sendEmail } from '@/lib/email';
import { QuotaWarningEmail } from '@/emails/QuotaWarning';
import { QuotaExceededEmail } from '@/emails/QuotaExceeded';

const newUsage = currentUsage + 1;

if (newUsage === 2 && limit === 3) {
  await sendEmail({
    to: userEmail,
    subject: 'One check left this month',
    react: QuotaWarningEmail({ checksLeft: 1, resetDate }),
  });
}

if (newUsage >= limit) {
  await sendEmail({
    to: userEmail,
    subject: "You've hit your limit for this month",
    react: QuotaExceededEmail({ resetDate, upgradeUrl }),
  });
}
```

### Trigger 5: Pro welcome — Stripe webhook
**File:** `src/app/api/webhooks/stripe/route.ts`

```typescript
case 'customer.subscription.created': {
  const sub = event.data.object as Stripe.Subscription;
  const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: "You're Pro — here's what's different",
      react: ProWelcomeEmail(),
    });
  }
  break;
}
```

### Resend Broadcasts (scheduled, no code needed)

Set up in the Resend dashboard at [resend.com/broadcasts](https://resend.com/broadcasts):

| Broadcast | Audience | Schedule | Content |
|---|---|---|---|
| Monthly quota reset | Free users | 1st of month, 9am | "Your 3 checks just reset" |
| Re-engagement | Free users, last_check > 14d | Weekly, Monday | "Still building something?" |
| Lifetime deal urgency | All free users | Manual, when 10 left | "10 lifetime deals left" |

Sync audiences via Resend API on Stripe subscription events.

---

## 2. Social Media Scheduling (Buffer)

### Setup
1. Sign up at [buffer.com](https://buffer.com) (free: 3 channels, 10 scheduled posts)
2. Connect: Twitter/X, LinkedIn
3. Pre-schedule all Week 1 content before launch day

### What to schedule (before launch day)
| Day | Platform | Post |
|---|---|---|
| T-1 (Sunday) | Twitter | "Launching tomorrow. Here's what I've been building for 4 months." |
| T-0 (Mon 9am ET) | Twitter | Launch thread tweet 1 |
| T-0 (Mon 9am ET) | LinkedIn | Launch post |
| T+1 | Twitter | Day 1 numbers |
| T+4 | LinkedIn | "7 questions" value post |
| T+8 | Twitter | Blog post thread |

**Upgrade option:** [Hypefury](https://hypefury.com) ($19/mo) for native Twitter thread scheduling — better for threads than Buffer.

---

## 3. Product Hunt — Scheduled Launch

### Steps (do the night before launch)
1. Build your listing at `producthunt.com/posts/new`
2. Fill all fields: tagline, description, gallery (5 images), first comment text
3. Use "Schedule launch" — set to **12:01 AM Pacific Time** on your launch Tuesday
4. Night before: have your first comment text in a doc ready to paste the moment the listing is live (PH sometimes doesn't auto-post the first comment)
5. Set an alarm for 12:05 AM PT to verify it went live

### Hunter tip
Find a hunter with 500+ followers at [hunter.how](https://hunter.how). DM them on Twitter 2 weeks before launch. A well-known hunter boosts launch day visibility significantly.

---

## 4. GitHub Actions

### Sitemap ping on deploy (`marketing/github-actions/seo-ping.yml`)

Copy to `.github/workflows/seo-ping.yml`:

```yaml
name: SEO Ping on Production Deploy

on:
  deployment_status:

jobs:
  ping-search-engines:
    runs-on: ubuntu-latest
    if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'Production'
    steps:
      - name: Ping Google sitemap
        run: |
          curl -s "https://www.google.com/ping?sitemap=https://vibecheck.app/sitemap.xml"
          echo "Pinged Google"
      - name: Ping Bing sitemap
        run: |
          curl -s "https://www.bing.com/ping?sitemap=https://vibecheck.app/sitemap.xml"
          echo "Pinged Bing"
```

### Tweet on milestone (optional, `marketing/github-actions/tweet-milestone.yml`)

For "building in public" automated milestone announcements — trigger manually via workflow_dispatch:

```yaml
name: Post Launch Update Tweet

on:
  workflow_dispatch:
    inputs:
      message:
        description: 'Tweet content (max 280 chars)'
        required: true
        type: string

jobs:
  tweet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Post tweet
        uses: ethomson/send-tweet-action@v1
        with:
          status: ${{ inputs.message }}
          consumer-key: ${{ secrets.TWITTER_CONSUMER_API_KEY }}
          consumer-secret: ${{ secrets.TWITTER_CONSUMER_API_SECRET }}
          access-token: ${{ secrets.TWITTER_ACCESS_TOKEN }}
          access-token-secret: ${{ secrets.TWITTER_ACCESS_TOKEN_SECRET }}
```

**Required GitHub secrets:** `TWITTER_CONSUMER_API_KEY`, `TWITTER_CONSUMER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

Get these from the [Twitter Developer Portal](https://developer.twitter.com) — requires a free developer account.

---

## 5. Uptime Monitoring

### UptimeRobot (free: 50 monitors, 5-minute checks)

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create these monitors:

| Monitor | URL | Alert |
|---|---|---|
| Landing page | `https://vibecheck.app` | Email + Slack |
| Health endpoint | `https://vibecheck.app/api/health` | Email |
| Stripe webhook | `https://vibecheck.app/api/webhooks/stripe` | Email (POST check) |

3. Add `/api/health` to your app:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

---

## 6. Zapier / Make.com Flows

### Flow 1: New Pro subscriber → Slack notification
**Tool:** Zapier free (5 Zaps)
- Trigger: Stripe `customer.subscription.created` webhook
- Action: Slack/Discord message: "New Pro subscriber 🎉 [email] — $9 MRR added"

### Flow 2: New feedback form submission → Notion
**Tool:** Zapier free
- Trigger: Tally.so form submission (in-app feedback form)
- Action: Create row in Notion "User Feedback" database

### Flow 3: Weekly analytics email to yourself
**Tool:** Make.com (1,000 ops/month free)
- Trigger: Every Monday 8am
- Action: Query Plausible API → format report → send to your email

```
Plausible API endpoint: GET https://plausible.io/api/v1/stats/aggregate
Headers: Authorization: Bearer {PLAUSIBLE_API_KEY}
Params: site_id=vibecheck.app&period=7d&metrics=visitors,pageviews,bounce_rate,visit_duration
```

---

## 7. Automation Pre-Launch Checklist

### Must have before launch
- [ ] `RESEND_API_KEY` in production env vars (Vercel)
- [ ] Welcome email sends on signup (test with real email)
- [ ] Report-ready email sends after completing a check (test end-to-end)
- [ ] Pro welcome email sends after test Stripe payment
- [ ] UptimeRobot monitoring active on vibecheck.app
- [ ] Buffer: Week 1 posts scheduled
- [ ] Product Hunt listing built and scheduled

### Nice to have (do by end of launch week)
- [ ] Quota warning email (2/3 trigger)
- [ ] Quota exceeded email
- [ ] GitHub Action: SEO ping on deploy
- [ ] Zapier: New Pro → Slack alert

### Month 2
- [ ] Resend Broadcasts: re-engagement campaign configured
- [ ] Resend Broadcasts: monthly quota reset configured
- [ ] Make.com weekly analytics email
- [ ] Tweet workflow for milestone announcements

---

_Last updated: April 2026_
