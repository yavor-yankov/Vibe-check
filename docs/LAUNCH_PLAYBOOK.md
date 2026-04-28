# Vibe Check — Launch Playbook

> Step-by-step guide to releasing Vibe Check as a product. Covers pre-launch through Month 3.
> **Target launch date:** TBD (set 2 weeks from when you start pre-launch prep)
> **30-day goal:** 500 sign-ups, 20 Pro subscribers ($180 MRR), 10 Lifetime deals ($490)

---

## PHASE 0: PRE-LAUNCH (2 weeks before)

### Week 1: Infrastructure + Asset Prep

#### Day 1 — Technical Readiness
- [ ] Verify production deployment works at your domain
- [ ] Run `pnpm install && pnpm test && pnpm build` cleanly
- [ ] Set up Plausible Analytics ($9/mo) or enable Vercel Analytics (free)
- [ ] Confirm Sentry is receiving errors (set `NEXT_PUBLIC_SENTRY_DSN`)
- [ ] Test shareable report links generate correct OG cards when shared on Twitter/Slack

#### Day 2 — Email Infrastructure
- [ ] Verify Resend is working in production (`RESEND_API_KEY` set)
- [ ] Test magic link email arrives with branding
- [ ] Test report-ready email triggers after analysis
- [ ] Set up Resend audiences: "Free Users" and "Pro Users"

#### Day 3 — Product Hunt Preparation
- [ ] Create PH product page at producthunt.com/posts/new
- [ ] Tagline: "AI interviews your startup idea before you build it"
- [ ] Take 5 gallery screenshots (1270x760px) using Shots.so:
  1. IntroStage — clean idea input
  2. InterviewStage — AI chat in action
  3. ScanningStage — competitor cards loading
  4. Report — scores + verdict
  5. Devil's Advocate section expanded
- [ ] Find a hunter with 500+ followers at hunter.how — DM with demo link
- [ ] Schedule launch for 12:01 AM Pacific, Monday

#### Day 4 — Social Accounts
- [ ] Create/verify @vibecheckapp on Twitter/X
- [ ] Upload brand assets (header 1500x500, profile pic)
- [ ] Schedule 3 teaser posts over next 12 days via Buffer/Hypefury:
  - "Building something that argues with your startup ideas. Launching in 11 days."
  - "The hardest question founders never ask: 'Why hasn't a well-funded competitor already won this?' Building a tool that forces the answer."
  - "Launching Monday. 4 months building, 5 minutes to validate any idea. Details soon."
- [ ] Start engaging: reply to 5+ tweets/day from indie hackers (NOT plugging — building presence)

#### Day 5 — Community Seeding
- [ ] Post "I'm building X" on Indie Hackers (800+ words, narrative format)
- [ ] Post in r/SideProject asking for feedback on the approach
- [ ] Comment genuinely on 5-10 Indie Hackers posts (build profile credibility)

#### Day 6 — Beta User Recruitment
- [ ] DM 20 founders in your network offering early access
- [ ] DM 30 active indie hackers/Twitter founders who post about idea validation
- [ ] Template: "Hey [name], built an AI that interviews startup ideas instead of scoring a form. Would you try it and give honest feedback? Free access, just need real eyes on it."
- [ ] Goal: 50 people into the product this week

#### Day 7 — Directory Submissions
Submit to all (free listings take 1-2 weeks to appear):
- [ ] BetaList (free or $129 featured)
- [ ] Uneed.best
- [ ] Launching Next
- [ ] SaaS Hub
- [ ] AlternativeTo (alternative to ValidatorAI, IdeaProof)
- [ ] Toolify.ai / FuturePedia / There's An AI For That / TopAI.tools
- [ ] G2 (free listing)
- [ ] Capterra (free listing)
- [ ] Submit sitemap to Google Search Console + Bing Webmaster Tools

### Week 2: Audience Building + Final Push

#### Day 8 — Collect Testimonials
- [ ] Message every beta user who completed a check: "What did you think? One honest sentence I can quote?"
- [ ] Goal: 5-10 testimonials by launch day
- [ ] These go on PH listing, landing page, and launch tweets

#### Day 9 — Social Sharing Verification
- [ ] Verify OG image renders correctly when sharing on Twitter/Slack/LinkedIn
- [ ] Test: share a `/report/[slug]` link → see branded card with score + verdict

#### Day 10 — Newsletter Outreach
Send 5 cold pitches (offer free Pro access to each writer):
- [ ] The Bootstrapped Founder (Arvid Kahl)
- [ ] Ben's Bites (AI tools)
- [ ] TLDR Startups
- [ ] Indie Hackers Weekly
- [ ] Starter Story
- [ ] Follow up in 3 business days if no reply

#### Day 11 — Supporter Lineup
- [ ] DM 15-20 people and ask them to:
  - Be active on PH launch morning
  - Upvote (they need PH accounts)
  - Leave a genuine comment (not just "great product!" — real experience)
- [ ] Do NOT use upvote pods (PH detects and penalizes)

#### Day 12 — Email Sequences Live
- [ ] Activate all Resend sequences: welcome, report delivery, quota warning, quota exceeded, Pro welcome
- [ ] Test each with real end-to-end flow
- [ ] Set up UptimeRobot for landing page + API health

#### Day 13 — Final Prep
- [ ] Write Show HN post draft (see Section 4 below)
- [ ] Prepare launch day tweet thread (5 tweets in drafts)
- [ ] Prepare LinkedIn, r/SideProject, Indie Hackers posts in drafts
- [ ] Final end-to-end test: signup → interview → report → share link → verify OG card

#### Day 14-15 — Rest + HN Submission
- [ ] Sunday evening 6-8 PM PT: Submit Show HN post (gains traction overnight)
- [ ] Set alarm for 12:01 AM PT Monday (PH launch)

---

## PHASE 1: LAUNCH WEEK

### Product Hunt Launch Day (Monday)

| Time (PT) | Action |
|-----------|--------|
| 12:01 AM | PH goes live. Paste first comment immediately |
| 12:05 AM | DM PH link to your 15 supporters |
| 5:00 AM | Check ranking. If <10 upvotes, nudge remaining supporters |
| 6:00 AM | Post Twitter/X launch thread (5 tweets, pin first) |
| 7:00 AM | Post on Indie Hackers ("I just launched" — 1000+ word story) |
| 8:00 AM | Post on LinkedIn |
| 9:00 AM | Post on r/SideProject |
| 10:00 AM+ | Reply to EVERY PH comment within 1 hour |
| 3:00 PM | Midday tweet: "6 hours in: [X] sign-ups, #[X] on PH. Thank you." |
| 6:00 PM | Check HN post status. If dead, resubmit |
| 9:00 PM | Evening wrap tweet with Day 1 numbers |
| 10:00 PM | Post in Discord communities (MakerLog, WIP, Indie Makers) |

### Days 2-5: Sustain Momentum
- Reply to PH comments every 2 hours
- Post one update tweet/day with real numbers
- Day 2: Post to r/startups (value-first angle)
- Day 3: Reach out to 5 more newsletters
- Day 4: Post "3 days post-launch — what I learned" on IH
- Day 5: Post to r/EntrepreneurRideAlong (founder story angle)

### PH Success Criteria

| Result | Meaning | Next Action |
|--------|---------|-------------|
| Top 3 | PH newsletter feature (600K readers) | Celebrate, share everywhere |
| Top 5 | Great. Homepage visibility all day | Add PH badge to landing page |
| Top 10 | Solid debut | Focus energy on other channels |
| Below 10 | Normal. Not a failure | Don't mention ranking. Move on |

---

## PHASE 2: HACKER NEWS "SHOW HN"

### Post Template
```
Show HN: Vibe Check – An AI that interviews your startup idea (free tier)

vibecheck.app

I got tired of idea validators that just score a form. Real validation
requires pressure — someone asking the uncomfortable questions.

Vibe Check runs a 5–7 turn Socratic interview, scans the web live for
competitors, and returns a scored report with a devil's advocate pass.

Stack: Next.js, Supabase, Groq (Llama 3.3 70B), Tavily, Stripe.

Free tier (3 checks/month) and Pro ($9/month). Happy to answer technical
questions about the interview engine or streaming implementation.
```

### HN Engagement Rules
- Reply to EVERY comment within 10 minutes for the first 30 min
- Be technical — share architecture decisions, prompting techniques
- Handle "just a ChatGPT wrapper" with: "You could prompt ChatGPT, but you'd need to manually search competitors, build a scoring rubric, and run a devil's advocate pass. This productizes a 30-minute workflow into 5 minutes."
- Never get defensive with skeptics. Acknowledge limitations honestly
- Never edit your post after submission

---

## PHASE 3: REDDIT & COMMUNITY SEEDING (Weeks 2-4)

### Subreddit Schedule

| When | Subreddit | Angle |
|------|-----------|-------|
| Launch day | r/SideProject | "I just shipped X" |
| Day 2 | r/startups | Value-first — "The question that kills most ideas" |
| Day 4 | r/EntrepreneurRideAlong | Founder build story |
| Week 3 | r/entrepreneur | Educational insight post |
| Week 3 | r/SaaS | Transparent metrics breakdown |
| Ongoing | r/Startup_Ideas | Offer free checks in comments |

### Avoiding Spam Flags
- Never post to multiple subs on the same day
- Lead with value, not product
- Comment genuinely on 10+ threads in each sub BEFORE posting
- Use self-posts (text), not link submissions
- Offer to help: "Drop your idea below, I'll run a free check"

### Comment Template (for r/Startup_Ideas threads)
```
Interesting angle. A few questions to sharpen this:

1. Who specifically has this problem today? Not "people who..." — name the segment.
2. What are they doing instead? (Status quo = real competitor)
3. Why would they switch?

I built vibecheck.app that runs this kind of Socratic interview on ideas — happy to run yours free if you want the full breakdown.
```

---

## PHASE 4: TWITTER/X BUILD-IN-PUBLIC (Ongoing)

### Content Pillars (rotate weekly)

| Pillar | % | Examples |
|--------|---|---------|
| Build-in-public updates | 30% | Numbers, decisions, wins, bugs |
| Validation insights | 30% | Tips, frameworks, lessons from data |
| Product demos | 20% | "Idea of the Week", sample reports |
| Engagement | 20% | Replies, polls, questions |

### Weekly Content Schedule
- **Monday:** Metrics tweet (sign-ups, MRR, interesting data)
- **Wednesday:** Insight thread (startup validation wisdom)
- **Friday:** "Idea of the Week" — run a trending concept through Vibe Check, share results
- **Daily:** Reply to 5+ tweets from #buildinpublic founders

### High-Engagement Tactics
1. "Reply with your startup idea in one sentence. I'll pick 3 and post the Vibe Check results tomorrow." (generates massive replies)
2. Share anonymized report screenshots (visual score card is highly shareable)
3. Every milestone tweet ("100 users!") gets boosted by the community

---

## PHASE 5: EMAIL MARKETING (Ongoing)

### Sequence Summary

| Sequence | Trigger | Goal |
|----------|---------|------|
| Welcome (W1-W3) | Signup | Drive first check, collect feedback |
| Upgrade (U1-U3) | 2/3 quota, quota hit, +3 days | Convert to Pro |
| Re-engagement (RE1-RE2) | 14 days inactive, 1st of month | Bring back lapsed users |
| Win-back | Pro cancellation | Understand churn, offer return |

### Automation Setup
- Resend handles all transactional + broadcast
- Zapier syncs Stripe events → Resend audiences (auto-segment Pro vs Free)
- Monthly reset email triggers on 1st of each month

---

## PHASE 6: SEO & CONTENT (Month 2+)

### Blog Calendar (First 5 Posts)

| Week | Title | Target Keyword | Volume |
|------|-------|---------------|--------|
| 3 | "How to Validate a Startup Idea Without Spending Money" | how to validate startup idea | 3,200/mo |
| 4 | "7 Questions Every Founder Forgets to Ask Before Building" | startup idea questions | 600/mo |
| 5 | "Why Most Idea Validators Give Founders False Confidence" | startup idea validator | 2,400/mo |
| 6 | "Startup Idea Validation Checklist: 25 Questions" | validation checklist | long-tail |
| 8 | "I Analyzed 100 Startup Ideas — Here's What Separated Winners" | startup idea evaluation | 1,400/mo |

### Blog Production Process
1. Write 1,500-2,000 words targeting one primary keyword
2. Add internal links to homepage ("AI startup idea validator")
3. Add proper Next.js metadata + Article schema markup
4. Promote: Twitter thread, LinkedIn excerpt, relevant Reddit comments
5. Submit URL to Google Search Console

### Link Building
- **Tier 1 (self-submitted):** All directory listings + PH + IH
- **Tier 2 (earned):** Newsletter mentions, guest posts, podcast appearances
- **Tier 3 (content-driven):** Data posts with original insights attract natural links

---

## PHASE 7: PAID ACQUISITION (Month 3+, conditional)

### Prerequisites (ALL must be true)
- [ ] Free-to-Pro conversion > 4%
- [ ] 100+ organic sign-ups (proves messaging works)
- [ ] 30-day retention > 40%
- [ ] LTV calculated: ~$54 (6 months × $9/mo)
- [ ] Max CAC target: $15-18

### Channel Priority

| Channel | Est. CPC | Test Budget | Start When |
|---------|----------|-------------|------------|
| Twitter/X Ads | $0.50-2 | $100/week | Month 3 |
| Google Ads | $1-5 | $200/2 weeks | Month 3 |
| Reddit Ads | $1-3 | $150/2 weeks | Month 4 |

### Scaling Decision

| After $300 test | Action |
|-----------------|--------|
| Cost per signup < $3 | Scale 3x |
| Cost per signup $3-8 | Optimize copy/targeting |
| Cost per signup > $8 | Pause. Focus organic |

---

## METRICS & MILESTONES

### Key Funnel (measure from Day 1)

```
Visit → Sign-up (15%) → First check (70% in 48h) → Complete (85%)
  → Second check (40% in 7 days) → Quota hit → Pro upgrade (5% in 30 days)
```

### Timeline

| Milestone | Target | When |
|-----------|--------|------|
| 200 sign-ups | Week 1 |
| 5 Pro subscribers | Week 1 |
| 350 sign-ups | Week 2 |
| 10 Pro subscribers | Week 2 |
| 500 sign-ups, $180 MRR | Month 1 |
| 10 Lifetime deals ($490) | Month 1 |
| 1,000 sign-ups, $450 MRR | Month 2 |
| First blog post indexed | Month 2 |
| 2,000 sign-ups, $720 MRR | Month 3 |
| Paid ads test running | Month 3 |
| 30 Lifetime deals (nearing cap) | Month 3 |

### Weekly Review (Every Monday)
1. Plausible: visitors, sources, conversion rates
2. Stripe: new subscribers, MRR, churn
3. Resend: email opens, clicks
4. Google Search Console: impressions, clicks
5. Feedback: themes, patterns, requests
6. **Decide:** What ONE action moves the most important metric this week?

### When to Pivot

| Signal | Pivot |
|--------|-------|
| <100 signups after 2 weeks | A/B test headline. Try different communities. Do 5 user interviews |
| <2% conversion after 30 days | Interview churners. Add features. Consider lower price |
| 90% run 1 check, never return | Build "Next Steps" feature. Add actionable items to reports |
| PH + HN both flop | Focus on Reddit + Twitter + SEO for slow organic growth |
| Lifetime sells out in <1 week | Use "sold out" urgency to push Pro subscriptions |
| Pro churn > 25%/month | Consider per-report pricing or credit system |

---

## TOOLS (Total: $9-50/mo)

| Tool | Cost | Purpose |
|------|------|---------|
| Resend | $0-20/mo | Email (already integrated) |
| Plausible | $9/mo | Analytics |
| Buffer | $0 (free) | Social scheduling |
| UptimeRobot | $0 | Monitoring |
| Tally.so | $0 | Feedback surveys |
| Google Search Console | $0 | SEO |
| Zapier | $0 (free tier) | Stripe → Slack alerts |

---

## AUTOMATION OPPORTUNITIES

These can be set up once and run hands-off:

1. **Email sequences** — Resend handles automatically based on triggers
2. **Monthly quota reset email** — Resend scheduled broadcast on 1st of each month
3. **Uptime monitoring** — UptimeRobot alerts to Slack/email
4. **Social scheduling** — Buffer queues posts 1-2 weeks ahead
5. **Directory submissions** — One-time (already listed in Day 7)
6. **Sitemap ping** — GitHub Actions on every deploy (see `marketing/AUTOMATION_GUIDE.md`)
7. **Weekly metrics digest** — Make.com pulls Plausible + Stripe + GSC into one Slack message
8. **Milestone tweets** — GitHub Action triggers tweet at signup count thresholds

---

## QUICK-START CHECKLIST

If you want to launch in 2 weeks, do these in order:

- [ ] Day 1-2: Production deploy + email working
- [ ] Day 3: PH listing created + scheduled
- [ ] Day 4: Twitter account active + first posts
- [ ] Day 5-6: Beta users recruited (50 target)
- [ ] Day 7: Directories submitted
- [ ] Day 8-10: Testimonials + newsletter outreach
- [ ] Day 11-12: Supporters lined up + email sequences live
- [ ] Day 13: All launch posts drafted
- [ ] Day 14: Show HN submitted (Sunday evening)
- [ ] Day 15: LAUNCH (Monday 12:01 AM PT)
