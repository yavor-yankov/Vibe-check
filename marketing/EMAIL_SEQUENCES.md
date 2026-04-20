# Vibe Check — Email Sequences

> All sent via **Resend** (already integrated).
> Tone: founder-to-founder, direct, short. No corporate fluff.
> Store React Email templates in `src/emails/`.

---

## Sequence 1: Welcome / Onboarding

### Email W1 — Immediate on signup
**Trigger:** User row created in `users` table (auth callback)
**Subject:** `You're in — here's how Vibe Check works`

```
Hey [First name or "there"],

You're in. Here's what to do first:

Go to your dashboard and describe your startup idea in one sentence.
The AI will take it from there.

→ [DASHBOARD LINK]

The interview is 5–7 questions. The whole thing takes about 5 minutes.
One tip: be specific. "B2B SaaS for HR teams" gets better results than "productivity app."

You've got 3 free checks this month. Use them on ideas you're actually considering.

— [Your name]
P.S. Hit reply if anything breaks or feels off. I read every email.
```

---

### Email W2 — Day 1, if no check completed
**Trigger:** User signup > 24h, checks_used === 0
**Subject:** `Still warming up?`

```
Hey,

You signed up yesterday but haven't run your first check yet.

You don't need the idea fully formed — start rough. The interview helps you sharpen it.

→ [DASHBOARD LINK]

Takes 5 minutes.
```

---

### Email W3 — Day 3, after first check completed
**Trigger:** checks_used === 1, signup > 3 days
**Subject:** `Was the devil's advocate section useful?`

```
Hey,

You ran your first Vibe Check — nice.

Quick question: did the Devil's Advocate section surface anything you hadn't considered?

That's the part I put the most work into. If it felt generic or missed the point, hit reply and tell me. I iterate based on real feedback.

— [Your name]
```

---

## Sequence 2: Free → Pro Upgrade

### Email U1 — When checks_used reaches 2
**Trigger:** quota check increments usage to 2 (of 3 free)
**Subject:** `One check left this month`

```
You've used 2 of your 3 free checks this month.

If you're in active validation mode, Pro is $9/month — unlimited checks, faster model (Gemini 2.5 Flash), better reports.

→ Upgrade to Pro: [UPGRADE LINK]

If 3/month is enough, you've got one left until [RESET DATE].
```

---

### Email U2 — When quota is hit
**Trigger:** quota exceeded (usage === limit)
**Subject:** `You've hit your limit for this month`

```
You've used all 3 free checks for [MONTH].

Your quota resets on [DATE].

Or upgrade to Pro ($9/mo) for unlimited checks right now.

→ [UPGRADE LINK]
```

---

### Email U3 — 3 days after quota hit, no upgrade
**Trigger:** quota_hit_at > 3 days ago, still on free tier
**Subject:** `A power user told me something interesting`

```
A Pro user messaged me last week:

"I ran 9 checks refining the same idea. By check 6 it was a completely different product — and much better."

That's the workflow I designed Vibe Check for: fast iteration until the idea is solid.

Hard to do on 3 checks/month.

Pro is $9/month. Or $49 lifetime (capped at 100 users — [X] left).

→ [UPGRADE LINK]
```

---

## Sequence 3: Report Delivery

### Email R1 — Immediate after report generated
**Trigger:** Report row inserted in `reports` table
**Subject:** `Your Vibe Check report is ready — [IDEA TITLE]`

```
Your Vibe Check report for "[IDEA TITLE]" is ready.

Score: [SCORE]/10
Verdict: [VERDICT]

→ View full report: [REPORT LINK]

Three things worth doing with it:
1. Hit "Devil's Advocate" if you haven't — it's the most useful button in the app.
2. Use "Refine & Re-score" after you've sat with the risks for a bit.
3. Share the report link with a co-founder or advisor and get their reaction.

— [Your name]
```

---

## Sequence 4: Pro Onboarding

### Email P1 — Immediately on Pro upgrade
**Trigger:** Stripe `customer.subscription.created` webhook
**Subject:** `You're Pro — here's what's different`

```
You're now on Vibe Check Pro. Thank you — genuinely.

What changed:
→ Unlimited checks (no monthly cap)
→ Gemini 2.5 Flash (smarter, more nuanced interview)
→ Deeper competitor scan on every report

No limits. Go validate everything.

→ [DASHBOARD LINK]

If you have ideas for what Pro should include that it doesn't, hit reply. I'm building features actively and take suggestions seriously.

— [Your name]
```

---

### Email P2 — Day 7 on Pro
**Trigger:** 7 days post upgrade
**Subject:** `How many ideas have you validated?`

```
It's been a week on Pro. Curious — how many checks have you run?

The founders who get the most out of it use it to:
• Test multiple framings of the same core idea
• Stress-test a pivot before committing to it
• Prepare for investor conversations (the devil's advocate mirrors what VCs ask)

If you've been using it: awesome. If not — anything blocking you? Hit reply.

— [Your name]
```

---

## Sequence 5: Re-engagement

### Email RE1 — 14 days since last check
**Trigger:** last_check_at < now() - 14 days (free and Pro users)
**Subject:** `Still building something?`

```
You haven't run a Vibe Check in 2 weeks.

Either you're heads-down building (nice) — or the idea cooled off.

If it's the second: sometimes a fresh check after time away surfaces things you couldn't see before. The AI doesn't get attached.

You've got [X] checks left this month → [DASHBOARD LINK]
```

---

### Email RE2 — Monthly quota reset (free users only)
**Trigger:** 1st of each month, all free users
**Subject:** `Your 3 free checks just reset`

```
Quick note: your monthly quota reset.

You've got 3 fresh checks available.

Got an idea that's been sitting in a doc somewhere? Now's a good time to put it through the interview.

→ [DASHBOARD LINK]
```

---

## Sequence 6: Lifetime Deal Urgency

### Email LT1 — When 10 lifetime spots remain
**Trigger:** Manual send from Resend broadcast, to all free users
**Subject:** `10 Lifetime deals left`

```
Quick heads-up: there are 10 Lifetime deal spots left on Vibe Check.

It's $49 once, then unlimited checks forever. I capped it at 100 total — after that, it's gone permanently.

[X] are already claimed.

→ Get lifetime access: [LIFETIME LINK]

After it's gone, Pro is $9/month.
```

---

## Resend Implementation Guide

### Install React Email
```bash
pnpm add react-email @react-email/components
```

### Template file structure
```
src/
  emails/
    Welcome.tsx
    ReportReady.tsx
    QuotaWarning.tsx
    QuotaExceeded.tsx
    ProWelcome.tsx
    ReEngagement.tsx
    LifetimeDealUrgency.tsx
  lib/
    email.ts   ← central send helper
```

### Central email helper (`src/lib/email.ts`)
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_DEFAULT = 'Yavor from Vibe Check <hello@vibecheck.app>';
export const FROM_REPORTS = 'Vibe Check <reports@vibecheck.app>';

export async function sendEmail({
  to,
  subject,
  from = FROM_DEFAULT,
  react,
}: {
  to: string;
  subject: string;
  from?: string;
  react: React.ReactElement;
}) {
  try {
    await resend.emails.send({ from, to, subject, react });
  } catch (err) {
    // Don't throw — email failure should never block the main flow
    console.error('[email] send failed', { to, subject, err });
  }
}
```

### Trigger locations in the app
```
auth callback   → Welcome email
analyze API     → ReportReady email
quota.ts        → QuotaWarning (at 2/3), QuotaExceeded (at limit)
stripe webhook  → ProWelcome on customer.subscription.created
Resend broadcast → ReEngagement, LifetimeDeal (scheduled)
```

### Resend Audiences setup
1. Create audience: **"Free Users"** (all signed-up users on free tier)
2. Create audience: **"Pro Users"** (active Pro + Lifetime subscribers)
3. Sync via Resend API on tier changes (subscription.created / subscription.deleted webhooks)

### Recommended Resend plan
- Free tier: 3,000 emails/month → enough for first few hundred users
- Scale tier ($20/mo): 50,000 emails/month

---

_Last updated: April 2026_
