# Vibe Check — SEO Strategy

> Goal: rank for "startup idea validator" and related terms within 90 days of launch.
> Philosophy: write content that is genuinely useful to founders, then optimize it — not the other way around.

---

## 1. Target Keywords

### Primary (high intent, moderate competition)

| Keyword | Monthly Volume (est.) | Difficulty | Target page |
|---|---|---|---|
| startup idea validator | 2,400 | Medium | `/` (landing page) |
| validate startup idea | 1,900 | Medium | `/` |
| AI startup idea validator | 800 | Low | `/` |
| startup idea checker | 600 | Low | `/` |
| startup idea validation tool | 400 | Low | `/` |
| how to validate a startup idea | 3,200 | High | Blog post #1 |

### Secondary (informational, drives blog content)

| Keyword | Volume (est.) | Target |
|---|---|---|
| how to test a startup idea | 2,100 | Blog post #2 |
| startup idea evaluation | 1,400 | Blog post #3 |
| is my startup idea good | 900 | Blog post |
| startup idea validation framework | 600 | Blog post |
| founder market fit | 500 | Blog post |
| lean startup validation | 1,800 | Blog post |
| problem solution fit | 1,200 | Blog post |

### Long-tail (easy wins, very specific intent)

- "startup idea validation checklist" → create and offer as free download
- "how to know if your startup idea is good" → blog post
- "startup idea interview questions" → highly aligned with product feature
- "devil's advocate startup idea" → we literally have this feature
- "competitor analysis startup idea" → blog post
- "startup idea scoring rubric" → blog post

---

## 2. Landing Page SEO

### Metadata for `src/app/page.tsx`

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vibe Check — AI Startup Idea Validator',
  description: 'Validate your startup idea in 5 minutes. AI-powered Socratic interview, live competitor scan, scored report, and devil\'s advocate red-team. Free to start.',
  keywords: ['startup idea validator', 'validate startup idea', 'AI startup validation', 'idea checker', 'startup idea tool'],
  openGraph: {
    title: 'Vibe Check — AI Startup Idea Validator',
    description: 'The AI that interviews your startup idea before you build it.',
    url: 'https://vibecheck.app',
    siteName: 'Vibe Check',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibecheckapp',
    title: 'Vibe Check — AI Startup Idea Validator',
    description: 'The AI that interviews your startup idea before you build it.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://vibecheck.app' },
};
```

### On-page content structure
- **H1:** "The AI that interviews your startup idea before you build it"
- **H2 #1:** "Validate your startup idea in 5 minutes"
- **H2 #2:** "How Vibe Check works" (interview → scan → report)
- **H2 #3:** "What makes it different from other validators"
- **H2 #4:** "Free to start, $9/month for unlimited"
- **Body copy:** Use keywords naturally. Include "startup idea validator", "validate startup idea", "competitor scan" in first 200 words.
- **Alt text on all images:** Descriptive, keyword-inclusive ("AI startup idea validation report screenshot")

### Schema Markup (`src/app/layout.tsx`)

```tsx
const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Vibe Check",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "AI-powered startup idea validator with Socratic interview, live competitor scan, and scored report with devil's advocate mode.",
  "url": "https://vibecheck.app",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "USD",
      "description": "3 idea validations per month"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "9",
      "priceCurrency": "USD",
      "billingPeriod": "P1M",
      "description": "Unlimited validations with faster AI model"
    }
  ],
  "creator": {
    "@type": "Person",
    "name": "Yavor Yankov"
  }
};
```

---

## 3. Blog Architecture

### Setup: `src/app/blog/`

Use Next.js static generation with MDX or a headless CMS (Contentlayer or next-mdx-remote).

File structure:
```
src/app/blog/
  page.tsx               ← blog index
  [slug]/
    page.tsx             ← individual post
content/blog/
  how-to-validate-startup-idea.mdx
  7-questions-before-building.mdx
  ...
```

Ensure blog posts have:
- Static `generateMetadata` per post (title, description, OG)
- `datePublished` and `dateModified` in schema
- `Article` schema markup
- Internal links back to the landing page with anchor text "AI startup idea validator"

---

## 4. Blog Posts — Content Plan

### Post 1 (Week 1)
**Title:** How to Validate a Startup Idea Without Spending Money
**Slug:** `/blog/how-to-validate-a-startup-idea`
**Keyword:** "how to validate a startup idea" (3,200/mo)
**Length:** 1,800 words
**Outline:**
1. Why most founders skip validation (and what it costs them)
2. The 5 things you actually need to validate
   - Is the problem real?
   - Is it painful enough to pay for?
   - Who specifically has it?
   - What are the alternatives?
   - Why would they choose you?
3. Free methods: customer interviews, landing pages, forums, competitor analysis
4. How AI accelerates each step
5. CTA: "Run a free AI interview on your idea →"

---

### Post 2 (Week 2)
**Title:** 7 Questions Every Founder Forgets to Ask Before Building
**Slug:** `/blog/startup-idea-questions-before-building`
**Keyword:** "startup idea interview questions"
**Length:** 1,500 words
**Outline:**
1. Who specifically loses sleep over this problem tonight?
2. How are they solving it right now without you?
3. Why can't the market leader add this as a feature?
4. What's the single reason this fails you're afraid to say?
5. Who are your first 10 customers — by name?
6. What does 90-day success look like in numbers?
7. What would have to be true for this to be a $10M business?

---

### Post 3 (Week 3)
**Title:** Why Most Idea Validators Give Founders False Confidence
**Slug:** `/blog/startup-idea-validators-false-confidence`
**Keyword:** "startup idea validator" (competitive — worth targeting in content)
**Length:** 1,200 words
**Outline:**
1. The form-fill problem: garbage in, generic score out
2. What real validation requires (challenge, not confirmation)
3. The devil's advocate principle
4. Comparison: form validators vs conversational AI interview

---

### Post 4 (Week 4)
**Title:** Startup Idea Validation Checklist: 25 Questions Before You Build
**Slug:** `/blog/startup-idea-validation-checklist`
**Keyword:** "startup idea validation checklist"
**Length:** 800 words + downloadable PDF
**Strategy:** Offer checklist as PDF download in exchange for email signup (Resend audience builder)

---

### Post 5 (Month 2)
**Title:** I Analyzed 100 Startup Ideas — Here's What Separated the Promising Ones
**Slug:** `/blog/what-separates-good-startup-ideas`
**Keyword:** "startup idea evaluation"
**Strategy:** Aggregate real anonymized data from your reports. Data-driven content drives shares and backlinks.

---

## 5. Technical SEO

### `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/
Disallow: /auth/

Sitemap: https://vibecheck.app/sitemap.xml
```

### Sitemap (`src/app/sitemap.ts`)
```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://vibecheck.app', changeFrequency: 'weekly', priority: 1.0 },
    { url: 'https://vibecheck.app/blog', changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://vibecheck.app/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://vibecheck.app/terms', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://vibecheck.app/privacy', changeFrequency: 'yearly', priority: 0.3 },
    // Add blog posts dynamically here
  ];
}
```

### Core Web Vitals targets
- **LCP < 2.5s** — watch hero images; use `next/image` with `priority` on above-fold images
- **CLS < 0.1** — reserve height for streaming AI responses to avoid layout shift
- **FID < 100ms** — already good with Next.js RSC architecture

---

## 6. Backlink Strategy

### Tier 1 — Submit yourself (this week)
| Site | Action |
|---|---|
| AlternativeTo | Add as alternative to ValidatorAI, IdeaProof, IdeaScan |
| SaaSHub | Submit product |
| G2 | Create free listing |
| Capterra | Create free listing |
| Toolify.ai | Submit AI tool |
| FuturePedia | Submit AI tool |
| There's An AI For That | Submit (high traffic) |
| TopAI.tools | Submit |

### Tier 2 — Earned
- **Indie Hackers posts** (DA ~70): your launch post, milestone posts, value posts
- **Product Hunt listing** (DA ~80): high authority backlink
- **Hacker News Show HN** (DA ~90): no-follow but huge traffic signal

### Tier 3 — Outreach (Month 2+)
- Guest posts on startup / indie hacker blogs
- Newsletter archives (each newsletter that covers you = a backlink)
- Podcast appearances (search "indie hacker podcast" on Spotify)

### Anchor text strategy
| Anchor text | Target page |
|---|---|
| "AI startup idea validator" | Homepage |
| "validate your startup idea" | Homepage or Blog #1 |
| "startup idea validation tool" | Homepage |
| "Vibe Check" (branded) | Homepage |
| "startup idea interview" | Blog #1 |

---

## 7. Monitoring (Free Tier)

| Tool | Purpose | Setup |
|---|---|---|
| Google Search Console | Impression/click tracking, sitemap submission | Submit sitemap on launch |
| Plausible Analytics | Privacy-friendly traffic analytics | Add `<Script>` tag |
| Ahrefs Webmaster Tools | Free backlink + keyword monitoring | Verify site ownership |

### Weekly SEO checklist
- [ ] Google Search Console: new keywords, impressions trend
- [ ] Plausible: organic traffic share, top pages, bounce rate
- [ ] Ahrefs: new backlinks gained this week

---

_Last updated: April 2026_
