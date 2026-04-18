# Testing Vibe Check end-to-end

App is a Next.js 15 + React 19 SPA with a 3-stage wizard: intro → streaming interview → scanning → scored report. All data lives in localStorage; there is no backend other than the Next.js route handlers.

## Running locally

```bash
pnpm install
PORT=3001 pnpm dev  # port 3000 is usually taken in the Devin VM
```

Requires two env vars:
- `GEMINI_API_KEY` — free from https://aistudio.google.com/apikey
- `TAVILY_API_KEY` — free (1000 searches/mo) from https://app.tavily.com/home

Model used: `gemini-2.5-flash` (see `src/lib/gemini.ts`).

## Repo checks

No CI is configured. Verify changes locally:

```bash
pnpm lint        # next lint, strict
pnpm build       # production build, must pass before opening a PR
```

Devin Review runs on every PR — expect informational findings on async/closure patterns in `src/app/page.tsx`.

## Seed idea for deterministic-ish tests

"A CLI tool that audits your dotfiles for security issues" — produces a rich report with a clear niche, real Tavily competitors (Coder, dotbins, Lynis, ssh-audit, etc.), and interesting red-team responses.

## Feature-specific quirks

### Escape hatch (`InterviewStage.tsx`)
Link appears only after ≥2 **user** turns AND the last assistant message does NOT already contain a `READY_FOR_ANALYSIS:` sentinel AND no message is currently streaming. If it's missing, check all three conditions.

### Refine & re-score (`page.tsx:refineAnalysis`)
Reuses the same session id — sidebar must still show **one** row after re-score. Re-running also invalidates the cached red-team (`redTeamReport: null`) so Devil's advocate will re-fetch the next time it's opened.

### Devil's advocate (`page.tsx:runRedTeam`, `/api/redteam`)
First click fires `/api/redteam`; the response is cached on the session. Subsequent clicks only toggle the collapse. If the section keeps showing "Running the red-team pass…" on re-expand, the cache merge is broken.

### Known race condition (flagged by Devin Review, not fixed as of b1e6cec)
If the user clicks "Devil's advocate" and then clicks "Re-score" before the red-team fetch returns, the stale red-team response can land on top of the new analysis. The session-id guard doesn't distinguish "generation" of the report. Fix options: bump a generation counter on every analyze/refine, or use AbortController on the in-flight red-team. Don't try to reproduce this on a happy-path recording — it's timing-dependent.

## Recording test runs

Maximize the browser first — half-tiled windows look bad in the final video:

```bash
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```

Then `computer(action="record_start")` → drive the flow → annotate each assertion with `computer(action="record_annotate")` using `type="setup"|"test_start"|"assertion"`. A full three-feature run (escape hatch → refine → red-team) takes ~5 minutes including LLM waits.

## Post-test etiquette

- Post ONE PR comment summarizing results with screenshots inline via `<details>` tags + attach the recording.
- Always call out to rotate the Gemini key if it was ever pasted in chat — this has happened twice already.
