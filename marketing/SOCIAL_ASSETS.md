# Vibe Check — Social Assets & 30-Day Content Calendar

---

## 1. Required Image Assets

### OG / Social Preview (`public/og-image.png`)
**Dimensions:** 1200 × 630px
**Used by:** Twitter link previews, LinkedIn, Facebook, Slack unfurls

Design brief:
- Background: dark gradient (`#0d0d0d` → `#1c1c2e`)
- Left half: logo + tagline
  - "Vibe Check" in bold (Inter or Geist, 72px)
  - Tagline: "The AI that interviews your startup idea" (24px, muted)
- Right half: UI mockup — the scored report card with a score dial and verdict badge
- Accent color: match your Tailwind primary (check `tailwind.config.ts`)

**Implementation in `src/app/layout.tsx`:**
```tsx
export const metadata: Metadata = {
  openGraph: {
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
};
```

---

### Dynamic Report OG Image (high-value viral mechanic)
**Route:** `GET /api/og?score=8.2&verdict=Promising&idea=AI+scheduler`
**Dimensions:** 1200 × 630px (auto via `@vercel/og`)

When shareable report links land (`/report/:id`), generate a per-report OG image. Every shared link becomes a social card.

**Minimal implementation (`src/app/api/og/route.tsx`):**
```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') ?? '?';
  const verdict = searchParams.get('verdict') ?? 'Unknown';
  const idea = searchParams.get('idea') ?? 'Startup idea';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0d0d0d 0%, #1c1c2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: '#f5f5f5',
        }}
      >
        <div style={{ fontSize: 28, color: '#a3a3a3', marginBottom: 16 }}>Vibe Check</div>
        <div style={{ fontSize: 48, fontWeight: 700, textAlign: 'center', maxWidth: 800 }}>
          {idea}
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, marginTop: 32 }}>{score}/10</div>
        <div style={{ fontSize: 32, color: '#22c55e', marginTop: 8 }}>{verdict}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

### Product Hunt Thumbnail (`public/ph-thumbnail.png`)
**Dimensions:** 240 × 240px
**Content:** Logo mark only — no text (PH displays name separately)

---

### Product Hunt Gallery (5 screenshots)
**Dimensions:** 1270 × 760px each
**Tool:** [Shots.so](https://shots.so) — free, browser mockup frames

| # | Screenshot | Key elements to show |
|---|---|---|
| 1 | IntroStage | Clean input field, "Start Interview" button |
| 2 | Interview (InterviewStage) | Chat bubbles, AI question visible |
| 3 | ScanningStage | Competitor cards with logos, "Scanning..." state |
| 4 | Report (full score) | 6-dimension scores, verdict badge |
| 5 | Devil's Advocate open | Red-team section expanded with brutal counterpoint |

---

### Twitter/X Header (`public/twitter-header.png`)
**Dimensions:** 1500 × 500px
**Content:** Dark background, logo + tagline centered, no clutter

### LinkedIn Banner (`public/linkedin-banner.png`)
**Dimensions:** 1584 × 396px
**Content:** Same design as Twitter header, adjusted to wider/shorter crop

---

## 2. Asset Creation Tools (free-first)

| Asset | Tool | Free? |
|---|---|---|
| Screenshots with mockup frames | [Shots.so](https://shots.so) | Yes |
| Social graphics (OG, headers) | [Canva](https://canva.com) | Yes |
| Demo video / walkthrough | [Loom](https://loom.com) | Yes (5 min limit) |
| GIF from demo video | [ezgif.com](https://ezgif.com) | Yes |
| Dynamic OG per report | `@vercel/og` (Next.js built-in) | Yes |
| Color palette | [Coolors.co](https://coolors.co) | Yes |

---

## 3. Brand Colors & Typography

> Verify these against your actual `tailwind.config.ts` — fill in real values.

| Token | Value | Usage |
|---|---|---|
| Background | `#0d0d0d` (dark) | Asset backgrounds |
| Surface | `#1c1c2e` | Cards, panels |
| Primary accent | TBD — check Tailwind config | CTAs, score highlights |
| Text primary | `#f5f5f5` | Headlines |
| Text muted | `#a3a3a3` | Body, secondary |
| Success / Strong | `#22c55e` | Promising verdict |
| Warning / Iterate | `#eab308` | Iterate verdict |
| Danger / Avoid | `#ef4444` | Avoid verdict |
| Font | Inter or Geist (check globals.css) | All assets |

---

## 4. 30-Day Content Calendar

### Legend
- **TW** = Twitter/X thread or tweet
- **LI** = LinkedIn post
- **IH** = Indie Hackers post
- **RD** = Reddit post
- **BL** = Blog post on vibecheck.app/blog
- **PH** = Product Hunt

---

### Week 1 — Launch

| Day | Platform | Type | Content |
|---|---|---|---|
| D0 — Launch | PH | Launch | Full listing, first comment ready |
| D0 | TW | Thread | Launch thread (4 tweets, see CHANNEL_COPY.md) |
| D0 | LI | Post | Launch post |
| D0 | IH | Post | Launch story |
| D0 | RD | Post | r/SideProject launch post |
| D+1 | TW | Update | Day 1 numbers |
| D+2 | TW | Value | "The question that kills most startup ideas" |
| D+3 | IH | Update | Early traction + first feedback |
| D+4 | LI | Value | "7 questions to ask before building" |
| D+5 | TW | Demo | Link to Loom walkthrough |
| D+6 | RD | Post | r/entrepreneur founder story |
| D+7 | TW | Recap | Week 1 numbers (honest) |

---

### Week 2 — Content

| Day | Platform | Type | Content |
|---|---|---|---|
| D+8 | BL | SEO | "How to validate a startup idea without spending money" |
| D+8 | TW | Share | Blog post thread |
| D+9 | LI | Share | Blog post with excerpt |
| D+10 | TW | Feature | "Idea of the Week" #1 |
| D+11 | RD | Value | r/startups — validation methodology post |
| D+12 | IH | Milestone | "First X paying users — what converted them" |
| D+13 | LI | Value | "3 types of founders who need idea validation" |
| D+14 | TW | Recap | 2-week stats |

---

### Week 3 — Distribution

| Day | Platform | Type | Content |
|---|---|---|---|
| D+15 | BL | SEO | "7 questions every founder forgets to ask before building" |
| D+15 | TW | Share | Blog post thread |
| D+16 | LI | Share | Blog post |
| D+17 | TW | Feature | "Idea of the Week" #2 |
| D+18 | Email | Outreach | Send 5 newsletter pitch emails |
| D+19 | IH | Value | "#1 thing users tell me after their first check" |
| D+20 | TW | Engage | Reply to a relevant viral tweet with insight |
| D+21 | TW | Recap | 3-week update |

---

### Week 4 — Retention + Virality

| Day | Platform | Type | Content |
|---|---|---|---|
| D+22 | BL | SEO | "Why most idea validators give founders false confidence" |
| D+23 | TW | Feature | "Idea of the Week" #3 |
| D+24 | LI | Case study | "How one founder pivoted based on their Vibe Check report" |
| D+25 | RD | Value | r/entrepreneur — "I analyzed 50 startup ideas, here's what I found" |
| D+26 | IH | Milestone | "$X MRR — what worked and what didn't" |
| D+27 | TW | Feature reveal | Ship shareable reports → announce |
| D+28 | All | Recap | 30-day retrospective |

---

## 5. Hashtags

### Twitter/X
`#buildinpublic #indiemaker #sideproject #startupideas #founders`

Secondary: `#saas #productlaunch #indihackers #nocode #AI`

### LinkedIn
`#startupfounder #entrepreneurship #startupvalidation #ProductHunt #sideproject`

### Reddit — no hashtags (use flair instead)

---

## 6. Engagement Rules

- Reply to every mention within 4 hours on launch day, 24h thereafter
- Never delete negative comments — engage honestly
- Like and reply to Product Hunt comments as soon as they come in (boosts algorithm)
- On Indie Hackers: comment on others' posts the week before launch (builds your profile)
- On Twitter: reply to tweets from @levelsio, @tdinh_me, @dvassallo, @marc_louvion with genuine insights (not spam — only when you have something real to add)

---

_Last updated: April 2026_
