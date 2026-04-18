# PR #11 Test Plan — Escape Hatch, Refine & Re-score, Devil's Advocate

PR: https://github.com/yavor-yankov/Vibe-check/pull/11

## What changed
Three user-facing features:
1. **Escape hatch** — after ≥2 user turns in the interview, a secondary "I'm done — analyze now" link appears that skips remaining questions and jumps to analysis without requiring the model to emit `READY_FOR_ANALYSIS:`.
2. **Refine & re-score** — on the report screen, a "Refine & re-score" button opens an inline textarea where you edit the pitch and re-run competitor search + scoring in-place (same session id in sidebar).
3. **Devil's advocate** — collapsible red-team section at the bottom of the report. First click fires `/api/redteam`; subsequent clicks only toggle (cached).

## Primary flow (one continuous recording)

Seed idea: **"A CLI tool that audits your dotfiles for security issues"**

### Test 1 — Escape hatch appears and triggers analysis
Code path: `src/components/InterviewStage.tsx:154-167`, gated by `canEscape = !readySummary && !isStreaming && userTurnCount >= 2`.

1. Click "Start vibe check". Type the seed idea. Click "Start".
2. Answer the 1st interview question with a short reply (e.g. "developers on macOS/linux who rice their configs"). Send.
3. Answer the 2nd question with another short reply (e.g. "manual review is tedious and people miss stuff"). Send.
4. **Assertion A (visible):** After the 2nd assistant reply streams in, a text-link button reading **"I'm done — analyze now"** with a small wand icon appears above the composer, right-aligned.
   - **Pass:** Button is visible and clickable.
   - **Fail:** Button is missing → escape hatch broken.
5. Click "I'm done — analyze now".
6. **Assertion B (state transition):** The UI transitions to the Scanning stage (spinner + "Scanning the market…" text).
   - **Pass:** Scanning stage shows within 1s; no wait for `READY_FOR_ANALYSIS:` sentinel.
   - **Fail:** Stays on interview page → callback not wired, or `onDone` not called.

### Test 2 — Report renders after analysis
7. Wait ~5–15s for /api/search + /api/analyze to return.
8. **Assertion C:** Report page renders with: a verdict label (Green-light / Iterate / Kill), 4 numeric scores (Viability / Problem / Niche / Differentiation), a non-empty Competitors list, Tech stack, and Roadmap.
   - **Pass:** All sections populated with real content.
   - **Fail:** Empty arrays or error banner → analyze broke.
9. Note the **Overall score** (e.g. "6.0") and the first 2 competitor names. These are the before-refine baseline.

### Test 3 — Refine & re-score updates in place
Code path: `src/components/ReportStage.tsx:125-134` (button), `src/app/page.tsx:refineAnalysis` (handler). Expected behavior: same session id in sidebar (no duplicate row), new Overall score, possibly new competitors/risks.

10. Click **"Refine & re-score"** (top-right, next to "New check").
11. **Assertion D:** An inline accent-bordered panel appears with heading "Tweak the pitch and re-run", a populated textarea, a Cancel button, and a "Re-score" button.
    - **Pass:** Panel visible.
    - **Fail:** Nothing happens → wiring broken.
12. In the textarea, add a differentiator clause. Append: ` — with a shareable "config score" card that gets posted to r/unixporn to drive viral signup`.
13. Click **"Re-score"**.
14. **Assertion E:** Scanning stage appears again, then a report appears.
    - **Pass:** Report updates.
    - **Fail:** Stays on report with stale data → `onRefine` not wired.
15. **Assertion F (the key adversarial check):** The sidebar still shows **one** session with the original creation time, NOT two. The Overall score has changed (different number) OR the verdict label / summary text visibly differs from the pre-refine report.
    - **Pass:** Single session in sidebar + observably different analysis output.
    - **Fail:** Two sidebar rows OR identical numbers across the board → refine behaved like "new check" or didn't re-run.

### Test 4 — Devil's advocate loads and displays structured output
Code path: `src/components/ReportStage.tsx:358+`, `src/app/page.tsx:runRedTeam`, `src/app/api/redteam/route.ts`.

16. Scroll to the bottom. Click the collapsed **"Devil's advocate"** header (red flame icon).
17. **Assertion G (loading):** Section expands and shows "Running the red-team pass…".
    - **Pass:** Loading text visible briefly.
    - **Fail:** No expansion or instant error → handler/endpoint broken.
18. Wait ~5s for the LLM.
19. **Assertion H (content):** Expanded section contains:
    - A **Verdict** block with one punchy sentence.
    - A **Reasons not to build** list with ≥3 bullets each starting with `×`.
    - A **Silent killers** list with ≥3 bullets each starting with `⚠`.
    - **Pass:** All three blocks populated with concrete, non-empty strings.
    - **Fail:** Any block missing, empty array, or generic platitude → endpoint/prompt broken.
20. **Assertion I (not a copy of the main risks):** The Silent killers list contains at least one item that does NOT appear verbatim in the top "Risks & gotchas" section of the report.
    - **Pass:** Red-team adds distinct content.
    - **Fail:** Red-team is just echoing the constructive risks → prompt isn't red-teaming.
21. Click the header again to **collapse**. Click again to **re-expand**.
22. **Assertion J (caching):** On re-expand there is NO "Running the red-team pass…" text — content appears immediately.
    - **Pass:** No re-fetch. 
    - **Fail:** Spinner reappears → `redTeamReport` cache check broken.

## Out of scope for this recording
- Race condition from Devin Review (flagged on b1e6cec) — red-team fetch + refine click in a specific sequence. I'll mention in the PR report but not attempt to reproduce (requires deterministic timing).
- Session switching mid-fetch stale closure test — covered by unit-level reasoning, hard to reproduce reliably on camera.

## Evidence
- Single screen recording of steps 1–22.
- `test-report.md` with annotated screenshots of each assertion.
- One PR comment summarizing results.
