# Meta Test — Vibe Check the Vibe Check app

User asked to feed the app its own description and see how it scores itself. This isn't a correctness test of PR #11 — it's a product demo / dogfooding pass.

## Seed idea (typed into the app)
"A web app that runs a Socratic interview about your app idea, then scans the web for existing competitors and produces a scored report (viability / niche / problem / differentiation) with a verdict, tech stack, MVP scope, and a devil's-advocate red-team pass."

## Flow
1. Clear the previous session via "New vibe check".
2. Paste the seed idea, click Start.
3. Answer the 4 interview questions genuinely (target user, current pain, differentiation, monetization/MVP).
4. Click "Analyze idea" when the READY_FOR_ANALYSIS sentinel fires (or use the escape hatch if the model meanders).
5. Capture the final report: verdict, overall score, 4 scores, competitors, tech stack, roadmap, MVP scope.
6. Expand "Devil's advocate" and capture Verdict + Reasons + Silent killers.

## What I'll send back
- Screen recording of the whole run
- A concise summary of what Vibe Check thinks of Vibe Check: verdict label, 4 scores, top 3 strengths, top 3 risks, and the red-team verdict/killers
- Any surprising or funny moments from the self-critique
