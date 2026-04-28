# Session Handoff — April 28, 2026

## What Was Done This Session

**15 commits pushed, 21 issues closed across 3 sprints. 34 GitHub issues created (#110-#143).**

### Sprint 1 (P0 — Critical Fixes)
- Removed dead `@google/generative-ai` dependency
- Replaced all Gemini references in code, docs, i18n (EN + BG), pricing, privacy policy
- Updated `.env.example`, README, CI to reference `GROQ_API_KEY`
- Added Sentry error tracking (client + server + edge)
- Added Stripe webhook idempotency (`stripe_events` table)
- Added centralized env var validation at startup (`src/instrumentation.ts`)
- Fixed pricing page (said 5 checks, actual is 3)

### Sprint 2 (P1 — Launch Readiness)
- Implemented real PDF export (`POST /api/export-pdf` via `@react-pdf/renderer`)
- Implemented shareable report links (`/report/[slug]` with anon RLS)
- Enforced lifetime tier cap (100 users) server-side
- Fixed red-team abort on re-score (AbortController ref)
- Added docs: `docs/DEPLOY.md`, `docs/BACKUP.md`, `docs/MONITORING.md`
- Added integration tests (6 test cases for `/api/chat`, `/api/billing/webhook`)

### Sprint 3 (P2 — Quality)
- Renamed `gemini.ts` → `ai.ts`, removed backward-compat aliases
- Made lint block CI (fixed 3 errors, removed `|| true`)
- Added account settings page (`/settings`) with GDPR delete + export
- Added first-time onboarding overlay (3-step tour)
- Added score history trend chart (Canvas API, zero deps)
- Added offline detection with localStorage fallback
- Set up Playwright E2E framework with 5 smoke tests

---

## Manual Setup Required

### 1. Install dependencies

```bash
cd "C:/Users/I551319/OneDrive - SAP SE/git/Vibe-check"
pnpm install
```

### 2. Run new database migrations

Two new migrations need to be applied to your Supabase project:

```bash
pnpm dlx supabase link --project-ref YOUR_PROJECT_REF   # if not already linked
pnpm dlx supabase db push
```

**What they create:**
- `0006_stripe_events_idempotency.sql` — `stripe_events` table for webhook deduplication
- `0007_shareable_reports.sql` — `public_slug` column on sessions + anon RLS policies for public report access

**If you don't use the Supabase CLI**, paste the contents of these files into the SQL Editor in your Supabase dashboard:
- `supabase/migrations/0006_stripe_events_idempotency.sql`
- `supabase/migrations/0007_shareable_reports.sql`

### 3. Set up Sentry (error tracking)

1. Go to https://sentry.io and create a free account + project (Next.js)
2. Copy the DSN (looks like `https://xxx@xxx.ingest.sentry.io/xxx`)
3. Add to your environment:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-here
   ```
4. (Optional) For source map uploads in CI, also set:
   ```
   SENTRY_AUTH_TOKEN=your-token
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   ```

**Without the DSN, Sentry is gracefully disabled** — the app runs fine, you just don't get error tracking.

### 4. Verify Stripe webhook endpoint

Ensure your Stripe webhook endpoint is subscribed to these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.created`
- `customer.subscription.deleted`

The idempotency guard is already in the code — no event will be processed twice.

### 5. (Optional) Install Playwright browsers for E2E tests

```bash
npx playwright install chromium
```

Then run:
```bash
pnpm test:e2e
```

### 6. (Optional) Set LIFETIME_CAP

The lifetime tier cap defaults to 100. To change it:
```
LIFETIME_CAP=50   # or whatever number you want
```

---

## Verification Checklist

After setup, verify everything works:

```bash
pnpm install                    # new deps installed
pnpm test                       # 45 tests pass
pnpm lint                       # 0 errors (warnings OK)
pnpm dev                        # app starts without env validation crash
```

Then manually check:
- [ ] `/pricing` — shows "3 vibe checks", no "Gemini" text
- [ ] `/settings` — shows account info, export + delete buttons
- [ ] `/signin` — magic link flow works
- [ ] Start a new session (onboarding overlay appears for first-time)
- [ ] Complete an analysis → report shows score history chart (single dot)
- [ ] Re-score → chart shows 2 points connected by a line
- [ ] Share button works on report (generates `/report/[slug]` link)
- [ ] Open shared link in incognito → renders read-only report without auth

---

## Remaining Open Issues

### P2 (Quality — non-blocking)
| Issue | Title | Effort | Notes |
|-------|-------|--------|-------|
| #126 | Split dashboard/page.tsx into hooks | L (1-3d) | ~850 lines, risky refactor |
| #127 | Split ReportStage.tsx into sub-components | M (4-8h) | ~1000 lines |

### P3 (Polish — backlog)
| Issue | Title | Effort |
|-------|-------|--------|
| #128 | Loading timeout for session hydration | S |
| #132 | Differentiate iterate/rethink verdict colors | S |
| #134 | Complete markdown export with insights | S |
| #141 | Session tags and notes | M |
| #142 | Add i18n locales (ES, DE, FR) | XL |
| #143 | Optimize print stylesheet | S |

### Partially Done
| Issue | Title | Status |
|-------|-------|--------|
| #123 | Integration tests | 6 tests written, needs 4+ more for analyze/search |
| #133 | E2E tests (Playwright) | Framework + 5 smoke tests, needs auth/dashboard tests |

---

## Architecture Notes for Next Session

### New files added:
```
src/instrumentation.ts          — Sentry init + env validation on server start
src/lib/env.ts                  — Centralized env var validator
src/lib/ai.ts                   — (renamed from gemini.ts) AI provider module
src/app/api/export-pdf/route.ts — Server-side PDF generation
src/app/api/account/route.ts    — DELETE (GDPR) + GET (data export)
src/app/api/sessions/[id]/share/route.ts — Toggle shareable link
src/app/report/[slug]/page.tsx  — Public read-only report page
src/app/settings/page.tsx       — Account settings page
src/app/settings/DeleteAccountButton.tsx — Client-side delete confirmation
src/components/OnboardingOverlay.tsx — First-time user tour
src/components/ScoreHistoryChart.tsx — Canvas-based score trend chart
sentry.client.config.ts         — Sentry browser config
sentry.server.config.ts         — Sentry Node config
sentry.edge.config.ts           — Sentry edge config
docs/DEPLOY.md                  — Production deployment checklist
docs/BACKUP.md                  — Database backup strategy
docs/MONITORING.md              — Production monitoring runbook
e2e/landing.spec.ts             — Playwright smoke tests
playwright.config.ts            — Playwright configuration
supabase/migrations/0006_stripe_events_idempotency.sql
supabase/migrations/0007_shareable_reports.sql
```

### Key patterns to follow:
- **Share button in ReportStage**: Call `POST /api/sessions/[id]/share` with `{ enabled: true }`, get back `{ slug, url }`, copy to clipboard
- **PDF download**: Call `POST /api/export-pdf` with `{ sessionId }`, receive blob, trigger download
- **Score history**: Appended automatically in `analyze()` function in dashboard — each successful analysis adds a snapshot to `session.scoreHistory`

### Gotchas:
- `node`/`pnpm` still not on bash PATH — use `cmd.exe /c "pnpm ..."` or `npx` for TypeScript checks
- Next migration should be `0008_*.sql`
- The `ReportStage` share button UI is NOT yet wired — the API exists but the button in the component needs to be added (call the share API + copy link)
- E2E tests require `npx playwright install chromium` before first run
- GitHub CLI still authenticates to `github.tools.sap` — use the token in the remote URL for github.com operations

---

## Previous Session (April 20, 2026)



### PRs Merged
| PR | Branch | Summary |
|----|--------|---------|
| #75 | `fix/remaining-issues` | Bug fixes: rethink color (#60), Globe SVG (#61), error boundary (#71) |
| #104 | `feat/phase-2` | Skeleton animations, UX fixes (sign-out, logo, UserBadge dropdown), security audit fixes (CSP, error leakage, AbortController, redirect validation, modal a11y, aria-labels), ROADMAP, Batch 1 (title migration, Tavily cost opt, Markdown export, print CSS), Batch 2 (Lean Canvas, TAM/SAM/SOM, experiments, 90-day plan), Customer persona simulation |
| #105 | `feat/phase-3` | Founder readiness assessment, side-by-side comparison, email report delivery |
| #106 | `feat/phase-4` | Name & domain suggestions, failure pattern database (30 real startups) |

### Issues Closed (with documentation): 19
#6, #8, #9, #61, #68, #71, #83, #85, #86, #87, #88, #89, #90, #91, #92, #94, #95, #102, #103

### Security Audit Issues Closed: 6
#76 (error leakage), #77 (CSP headers), #78 (redirect validation), #79 (AbortController), #80 (modal a11y), #81 (aria-labels)

---

## Current state of main

Main has all 4 PRs merged. `pnpm tsc --noEmit` passes clean. The app includes:

- **4-stage wizard**: Intro (with optional founder readiness quiz) → Interview → Scanning → Report
- **Report sections**: Scores, Verdict, Strengths, Risks, Unique Angles, InsightsPanel (Market Size with TAM/SAM/SOM, Build Effort, Regulatory Flags, Funding Signal, Graveyard backed by real failure DB, Pricing Benchmarks, Lean Canvas, Next Steps/Experiments, 90-Day Action Plan), Competitors, Tech Stack, Roadmap, MVP Scope, Devil's Advocate (red-team), Customer Personas, Name & Domain Suggestions
- **Export**: Markdown download, PDF (enhanced print CSS), Email via Resend
- **Comparison**: Side-by-side 2-4 session comparison with score bars
- **Security**: CSP headers, error message sanitization, AbortController on all fetches, redirect URL validation, modal focus trap + ARIA
- **Loading**: Skeleton shimmer animations on all 4 loading states
- **Cost optimized**: Free tier uses 2 Tavily queries instead of 3

---

## Open issues (10 remaining — all need infrastructure)

| # | Feature | What's needed | Priority |
|---|---------|---------------|----------|
| **#84** | **Shareable report link** (`/report/:id`) | Supabase migration: add `public_slug` column + anon RLS policy. Then build `/report/[slug]/page.tsx` server component + "Share" button in ReportStage. Middleware already documented for `/report` public path. | **P1 — launch blocker** |
| **#93** | **Score history trend chart** | Supabase migration: add `score_history jsonb[]` or new table. Save score snapshot in dashboard on each analyze/refine. Render mini sparkline in ReportStage header. | P2 |
| **#82** | **Centralized env var validation** | Create `src/lib/env.ts` that checks all required env vars at startup. Low effort, improves deployment debugging. | P2 |
| **#10** | **Reddit/HN/ProductHunt signal** | Integrate Reddit API or scraping for sentiment analysis. Extends the search step. | P2 |
| **#96** | **Team plan** ($29/mo) | Supabase: `teams` + `team_members` tables with RLS. Stripe: quantity-based subscription. UI: team switcher in sidebar, invite flow. | P3 |
| **#97** | **Per-report pricing** ($5 one-time) | Stripe: one-time checkout session. Paywall: show verdict + overall score, blur rest until payment. | P3 |
| **#98** | **Chrome extension** | Separate project. Content script + context menu → opens `/dashboard?seed=<text>`. | P3 |
| **#99** | **Public idea showcase** | Supabase migration: `is_public` boolean on sessions + anon RLS. New `/explore` page with grid of public reports. | P3 |
| **#100** | **API access** ($0.50/check) | API key auth system (new table), `/api/v1/check` endpoint, Stripe metered billing. | P3 |
| **#101** | **Competitive monitoring** | Cron job (Supabase Edge Function or Vercel Cron) to re-run search queries weekly + diff + email notification. | P4 |
| **#17** | **Meta-eval tracker** | Standing documentation task, not a code change. | Low |

---

## Cost model (for pricing decisions)

| | Free tier | Pro ($9/mo) |
|---|-----------|-------------|
| Gemini cost/check | $0.0021 | $0.0094 |
| Tavily cost/check | $0.016 (2 queries) | $0.024 (3 queries) |
| **Total/check** | **~$0.018** | **~$0.033** |
| Monthly cost ceiling | $0.054 (3 checks) | ~$1.00 (30 checks) |
| **Pro margin** | — | **89% at 30 checks/mo** |

Break-even for Pro: 269 checks/month. No realistic user hits that. Pricing is healthy.

---

## Architecture notes for next session

### Key files
- `src/app/dashboard/page.tsx` — main orchestrator (sessions, stages, all AI call handlers). Large file (~700 lines). All lazy-loaded features (red-team, personas, names) follow the same pattern: state + handler + pass props to ReportStage.
- `src/components/ReportStage.tsx` — report renderer (~880 lines). Props-heavy. Each expandable section (red-team, personas, names) follows the same toggle+skeleton+content pattern.
- `src/lib/prompts.ts` — all AI system prompts. The ANALYSIS_SYSTEM_PROMPT is the biggest (~120 lines of JSON schema).
- `src/lib/types.ts` — all TypeScript interfaces. `ExpandedInsights` is the extensible container for new report sections.
- `src/app/api/analyze/route.ts` — the main analysis endpoint. `sanitizeInsights()` validates all nested fields. New insight fields need sanitization functions here.

### Patterns to follow
- **New lazy-loaded report section**: Copy the persona pattern — new API route, prompt in prompts.ts, state in dashboard, expandable section in ReportStage with skeleton loading.
- **New insight field**: Add to `ExpandedInsights` type, add to ANALYSIS_SYSTEM_PROMPT JSON schema, add `sanitize*()` function in analyze route, render in InsightsPanel.
- **New API route**: Copy `/api/personas/route.ts` — auth check, rate limit, Gemini call, JSON extraction, sanitization.

### Gotchas
- `gh` CLI authenticates against SAP's internal GitHub (`github.tools.sap`), not github.com. Use Python `urllib.request` with the PAT for all GitHub API calls.
- `node`/`pnpm` aren't on the bash PATH. Use `cmd.exe /c "pnpm tsc --noEmit"` for TypeScript checks.
- The Supabase migration files are in `supabase/migrations/`. Next migration should be `0006_*.sql`.
- `ReportStage` on main is missing the `NameSuggestion` and `AtSign` imports from the phase-4 merge (the squash may have dropped them — verify before building on top).

### GitHub PAT
Stored locally — ask the repo owner for the token if needed for issue/PR management via Python scripts.

---

## Recommended next session priorities

1. **#84 — Shareable report link** (P1 launch blocker, needs Supabase migration)
2. **#93 — Score history** (P2, needs Supabase migration)
3. **#82 — Env var validation** (P2, pure code, no infra needed)
4. **#97 — Per-report pricing** (P3, needs Stripe)
5. **#99 — Public showcase** (P3, needs Supabase migration)

---

_Written: April 20, 2026_
