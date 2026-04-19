# Vibe Check — Roadmap

This document tracks the production-readiness and feature backlog for Vibe Check.
Issues are tracked on GitHub; this file gives the high-level phasing.

---

## P0 — Must Ship (security hardening + correctness)

| # | Issue | Status | Branch / PR |
|---|-------|--------|-------------|
| 1 | Fix magic link redirects to wrong Supabase project | ✅ Done | [#38](../../pull/38) |
| 2 | `server-only` guards on all server modules; fix Stripe portal & callback URLs | ✅ Done | [#39](../../pull/39) |
| 3 | Landing page at `/` + move wizard to `/dashboard` | ✅ Done | [#28](../../pull/28) |
| 4 | Zod input validation on all AI API routes | ✅ Done | [#40](../../pull/40) |
| 5 | Per-user rate limiting on AI routes (Upstash, graceful degradation) | ✅ Done | [#41](../../pull/41) |
| 6 | Terms of Service page (`/terms`) | ✅ Done | this branch |
| 7 | Privacy Policy page (`/privacy`) | ✅ Done | this branch |
| 8 | ScanningStage stuck-state fix (error UI + 90s fetch timeout + retry button) | ✅ Done | this branch |
| 9 | GitHub Actions CI pipeline | ✅ Done | this branch |

---

## P1 — Next Sprint (observability + UX polish)

- **Error tracking**: integrate Sentry (or equivalent) on both client and server
- **Structured logging**: replace `console.error` with a structured logger (Pino / Winston) shipped to a log drain
- **OpenGraph / SEO**: add `og:image`, `twitter:card`, and `robots.txt`; submit `sitemap.xml` to Google Search Console
- **Mobile dashboard**: slide-in sidebar drawer on `< 768 px` (#37)
- **Session titles**: auto-generate a short title from the idea summary after the first AI turn
- **Export to PDF**: allow users to download their full report as a formatted PDF
- **Refine UX**: show a diff between the original and refined report so users can see what changed
- **Quota indicator**: live badge in the sidebar showing remaining checks this month

---

## P2 — Backlog (growth + monetisation)

- **Team plan**: shared workspace with multiple users and centralized billing
- **Idea Library**: browse/search past vibe checks with tag filtering
- **Webhook / Zapier integration**: POST the report JSON to a user-supplied URL on completion
- **A/B testing**: test different interview prompt styles and track completion rates
- **Partner program**: referral tracking and affiliate commissions
- **White-label**: allow agencies to deploy a custom-branded instance

---

## Tech Debt

- `pnpm audit` — resolve any high-severity dependency vulnerabilities before launch
- Replace `@/lib/db/sessions.ts`'s 6-serial-query `upsertSessionFull` with a single RPC call to reduce Supabase round-trips
- Add a `test` script to `package.json` with at minimum smoke tests for the billing and quota logic

---

_Last updated: April 2026_
