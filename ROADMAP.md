# Vibe Check — Roadmap

This document tracks the production-readiness and feature backlog for Vibe Check.
Issues are tracked on GitHub; this file gives the high-level phasing.

---

## Cost Model (April 2026)

| Component | FREE tier/check | PRO tier/check | Notes |
|-----------|----------------|----------------|-------|
| Gemini API | $0.0021 | $0.0094 | flash-lite vs flash |
| Tavily search (3 queries) | $0.024 | $0.024 | 7-day cache reduces by ~50% |
| Upstash / Supabase / Resend | ~$0 | ~$0 | Negligible at current scale |
| **Total** | **~$0.026** | **~$0.033** | |

| Tier | Revenue | Max cost/month | Margin |
|------|---------|---------------|--------|
| Free (3 checks/mo) | $0 | $0.08 | Acquisition cost — acceptable |
| Pro ($9/mo, unlimited) | $9.00 | $1.00 (at 30 checks) | **$8.00 gross profit (89%)** |
| Lifetime ($49 one-time) | $49 | Break-even at ~1,470 total checks | Profitable if avg user does < 50/month for ~30 months |

**Verdict: pricing is healthy.** Pro tier breaks even at 269 checks/month — no realistic user hits that. Tavily is 72-92% of cost; the Supabase cache is the biggest cost saver.

**Action items:**
- ~~Migrate title generation from `gemini-2.0-flash-lite` (deprecated June 1, 2026) to `gemini-2.5-flash-lite`~~ **DONE — migrated entirely to Groq (Llama 3.3 70B)**
- Consider reducing Tavily from 3 to 2 queries for free tier to save $0.008/check
- Monitor Groq rate limits — free tier has per-model RPM/TPM limits

---

## P0 — Done (security hardening + correctness)

| # | Issue | Status | Branch / PR |
|---|-------|--------|-------------|
| 1 | Fix magic link redirects to wrong Supabase project | ✅ Done | [#38](../../pull/38) |
| 2 | `server-only` guards on all server modules; fix Stripe portal & callback URLs | ✅ Done | [#39](../../pull/39) |
| 3 | Landing page at `/` + move wizard to `/dashboard` | ✅ Done | [#28](../../pull/28) |
| 4 | Zod input validation on all AI API routes | ✅ Done | [#40](../../pull/40) |
| 5 | Per-user rate limiting on AI routes (Upstash, graceful degradation) | ✅ Done | [#41](../../pull/41) |
| 6 | Terms of Service page (`/terms`) | ✅ Done | [#42](../../pull/42) |
| 7 | Privacy Policy page (`/privacy`) | ✅ Done | [#42](../../pull/42) |
| 8 | ScanningStage stuck-state fix (error UI + 90s fetch timeout + retry button) | ✅ Done | [#42](../../pull/42) |
| 9 | GitHub Actions CI pipeline | ✅ Done | [#42](../../pull/42) |
| 10 | Security headers (CSP, HSTS, X-Frame-Options) | ✅ Done | [#75](../../pull/75) |
| 11 | API error message leakage fix | ✅ Done | [#75](../../pull/75) |
| 12 | AbortController on all fetch calls | ✅ Done | [#75](../../pull/75) |
| 13 | Redirect URL validation (Stripe) | ✅ Done | [#75](../../pull/75) |
| 14 | Modal accessibility (focus trap, ARIA) | ✅ Done | [#75](../../pull/75) |
| 15 | Skeleton shimmer loading animations | ✅ Done | [#75](../../pull/75) |
| 16 | Error boundary (`error.tsx`) | ✅ Done | [#75](../../pull/75) |
| 17 | Rethink verdict color + inline Globe SVG cleanup | ✅ Done | [#75](../../pull/75) |

---

## P1 — Launch Blockers (must ship before public launch)

### Export & sharing
- [ ] **Real PDF export** — generate a styled PDF server-side (or use `@react-pdf/renderer`) instead of `window.print()`. Every competitor has this. (#68)
- [ ] **Shareable report link** (`/report/:id`) — read-only public URL so founders can send results to co-founders and advisors. No auth required to view.
- [ ] **Markdown export** — one-click download of the report as `.md` for pasting into Notion/docs.

### Cost optimization
- [x] ~~**Migrate title gen model**~~ — Done. Entire backend migrated to Groq (Llama 3.3 70B). No Gemini dependency.
- [ ] **Free tier: 2 Tavily queries** — reduce from 3 to 2 search queries on free tier to cut Tavily cost by 33%.

### Observability
- [ ] **Error tracking** — integrate Sentry on client + server.
- [ ] **Centralized env var validation** — check all required env vars at startup, not lazily at first use. (#82)

---

## P2 — Competitive Edge (features that differentiate from ValidatorAI, IdeaProof, IdeaScore)

### Actionable output (biggest gap vs competitors)
- [ ] **Lean Canvas generation** — auto-generate a one-page Lean Canvas (Problem, Solution, Key Metrics, Unfair Advantage, Channels, Customer Segments, Cost Structure, Revenue Streams, Value Proposition) from interview data. Exponentially does this free — we should too. LOW effort since all data exists in the interview.
- [ ] **TAM/SAM/SOM market sizing** — add real market size estimates with reasoning to the report. Currently in `insights.marketSize` but AI-hallucinated. Enhance with web-sourced data points. Table stakes for every competitor.
- [ ] **Next steps / experiment design** — after the report, suggest 3 concrete testable experiments (e.g., "Run a landing page smoke test on [segment] via [channel], measure signup rate over 7 days"). Exponentially's strongest feature.
- [ ] **90-day action plan** — generate a week-by-week plan: weeks 1-2 validate, weeks 3-6 build MVP, weeks 7-12 launch and iterate. IdeaScan charges $15 for this alone.

### Retention drivers
- [ ] **Side-by-side idea comparison** — pick 2-3 sessions and see scores/verdicts/strengths compared in a table. IdeaScore's Pro+ ($59/mo) feature — we can offer it on Pro ($9/mo). (#9)
- [ ] **Score history & trend chart** — show how an idea's scores change across refine-and-re-score iterations. Visualize improvement over time.
- [ ] **Email report delivery** — send the full report as a formatted email after analysis completes. Resend is already integrated. Low effort.
- [ ] **Session tags & notes** — let users tag ideas (e.g., "fintech", "AI", "B2B") and add personal notes. Powers the Idea Library.

### Trust & uniqueness
- [ ] **Failure pattern database** — curate 100+ real startup failures (from Autopsy.io, CB Insights, Indie Hackers post-mortems) and semantic-match against the user's idea. "3 companies tried something similar and failed because X." IdeaScan's differentiator — we can do it better with conversational context.
- [ ] **Customer persona simulation** — after the report, generate 3-5 fictional user personas and simulate their reaction to the idea. "Sarah, 28, PM at a mid-stage startup: 'I'd try this if it had Slack integration, but I wouldn't pay more than $10/month.'" SignalLab's core feature.
- [ ] **Founder readiness assessment** — 5-question quiz (domain expertise, technical ability, runway, time commitment, prior attempts) that personalizes the report. ValidatorAI has this.

---

## P3 — Growth & Monetization

### Pricing & plans
- [ ] **Team plan** ($29/month) — shared workspace, 3 seats, centralized billing, team idea library. FounderFlow charges $79/mo for this.
- [ ] **Per-report pricing option** — one-time $5 per deep report (no subscription). EvaluateMyIdea ($8-20), IdeaScan ($15), Venturio ($10) all offer this. Lowers barrier for casual users.
- [ ] **Credit system** — alternative to unlimited. Buy 10 credits for $15, never expire. IdeaProof's model. Good for seasonal founders.

### Distribution & growth
- [ ] **Name & domain suggestions** — generate 5 brand name ideas with `.com` availability check via Domainr API. IdeaScore's feature. Low cost per check. (#6)
- [ ] **Public idea showcase** — opt-in gallery of anonymized/approved vibe checks. Drives SEO + social proof. "See what others are building."
- [ ] **Referral program** — "Give 3 free checks, get 3 free checks" viral loop.
- [ ] **Webhook / Zapier integration** — already built. Market it as a feature for power users who automate their ideation flow.
- [ ] **A/B testing interview prompts** — test different interview styles and track completion rates to optimize engagement.

### Platform expansion
- [ ] **Chrome extension** — highlight text on any page (Product Hunt, Hacker News, Reddit) → "Vibe check this idea" → opens pre-filled session.
- [ ] **Slack bot** — `/vibecheck [idea]` → returns verdict + score inline. Premium feature.
- [ ] **API access** — let developers programmatically run vibe checks. $0.50/check. Opens up integrations with accelerators, VC tools.

---

## P4 — Far-Stretch Differentiators

- [ ] **Live market data feed** — integrate Crunchbase/PitchBook API for real funding data instead of AI-generated estimates. Expensive but high-trust.
- [ ] **Multi-language support** — IdeaProof supports 18+ languages. Focus on top 5: English, Spanish, Portuguese, French, German.
- [ ] **White-label for accelerators** — custom-branded instance for YC, Techstars, university incubators. Enterprise pricing.
- [ ] **Competitive intelligence monitoring** — after initial check, weekly email: "2 new competitors found for your idea." Crayon-lite for indie founders.
- [ ] **Pitch deck generator** — from the report, auto-generate a 10-slide pitch deck (Problem, Solution, Market, Competition, Business Model, Team, Traction, Ask). Foundor.ai territory.
- [ ] **Financial projections** — 3-year P&L, unit economics, break-even analysis. FounderFlow and IdeaProof's premium feature.

---

## Tech Debt

- [ ] `pnpm audit` — resolve any high-severity dependency vulnerabilities
- [ ] ~~Replace 6-serial-query `upsertSessionFull` with single RPC~~ ✅ Done (migration 0005)
- [ ] Add `test` script with smoke tests for billing/quota logic
- [ ] Fix free tier quota inconsistency (landing page says 3, verify billing config matches)
- [ ] Add structured logging (Pino) to replace remaining `console.error` calls

---

_Last updated: April 2026_
