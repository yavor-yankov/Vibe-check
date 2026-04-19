import Link from "next/link";
import {
  Sparkles,
  MessageSquare,
  Globe,
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  Check,
  ChevronDown,
  ArrowRight,
  Star,
} from "lucide-react";
import { PRICING_TIERS } from "@/lib/billing/plan";

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 px-6 text-center">
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-3xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-medium text-[color:var(--accent)] mb-6">
          <Star size={12} fill="currentColor" />
          Interview-style AI for founders &amp; builders
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Is your app idea{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            worth building?
          </span>
        </h1>

        <p className="mt-5 text-xl text-[color:var(--muted)] max-w-2xl mx-auto leading-relaxed">
          Vibe Check pressure-tests your app concept with a Socratic AI
          interview, scans the web for real competitors, and delivers a
          scored report with a devil&apos;s-advocate red-team pass — in
          under 5 minutes.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] text-white px-6 py-3 text-base font-semibold hover:brightness-110 transition shadow-lg shadow-[color:var(--accent)]/20"
          >
            Start free — no card needed
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-3 text-base font-medium hover:bg-[color:var(--background)] transition"
          >
            See pricing
          </Link>
        </div>

        <p className="mt-4 text-sm text-[color:var(--muted)]">
          3 free checks per month · No credit card · Cancel anytime
        </p>
      </div>

      {/* Mock report card preview */}
      <div className="mt-16 mx-auto max-w-2xl">
        <MockReportPreview />
      </div>
    </section>
  );
}

function MockReportPreview() {
  const scores = [
    { label: "Viability", value: 8 },
    { label: "Problem fit", value: 9 },
    { label: "Niche clarity", value: 7 },
    { label: "Differentiation", value: 6 },
  ];

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl shadow-black/10 overflow-hidden text-left">
      {/* Title bar */}
      <div className="px-5 py-3.5 border-b border-[color:var(--border)] flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[color:var(--bad)] opacity-80" />
        <div className="w-3 h-3 rounded-full bg-[color:var(--warn)] opacity-80" />
        <div className="w-3 h-3 rounded-full bg-[color:var(--good)] opacity-80" />
        <span className="ml-2 text-xs text-[color:var(--muted)] font-mono">
          vibe-check — report
        </span>
      </div>

      <div className="p-5 grid gap-4 sm:grid-cols-2">
        {/* Verdict */}
        <div className="sm:col-span-2 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-1">
              Verdict
            </div>
            <div className="text-lg font-bold text-[color:var(--good)]">
              🚀 Ship the MVP
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-1">
              Overall score
            </div>
            <div className="text-3xl font-bold">7.5<span className="text-base text-[color:var(--muted)]">/10</span></div>
          </div>
        </div>

        {/* Score bars */}
        {scores.map(({ label, value }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[color:var(--muted)]">{label}</span>
              <span className="font-semibold">{value}/10</span>
            </div>
            <div className="h-1.5 rounded-full bg-[color:var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[color:var(--accent)]"
                style={{ width: `${value * 10}%` }}
              />
            </div>
          </div>
        ))}

        {/* Insight chips */}
        <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
          {[
            "Market: $2B–$8B",
            "Build: 1–2 weeks",
            "4 competitors found",
            "Low regulatory risk",
          ].map((chip) => (
            <span
              key={chip}
              className="text-xs px-2.5 py-1 rounded-full border border-[color:var(--border)] text-[color:var(--muted)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Social proof strip ────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { value: "5 min", label: "Average session" },
    { value: "5 scores", label: "Viability dimensions" },
    { value: "3 sources", label: "Competitor scan queries" },
    { value: "Free", label: "To get started" },
  ];

  return (
    <section className="border-y border-[color:var(--border)] bg-[color:var(--card)] py-8 px-6">
      <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <div className="text-2xl font-bold text-[color:var(--foreground)]">
              {value}
            </div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: MessageSquare,
      step: "01",
      title: "Pitch your idea",
      description:
        "Drop your concept in a single sentence. The AI coach starts digging — one sharp question per turn, no fluff.",
    },
    {
      icon: Globe,
      step: "02",
      title: "We scan the web",
      description:
        "While you answer, Tavily searches for real competitors, similar products, and market signals. No made-up results.",
    },
    {
      icon: BarChart3,
      step: "03",
      title: "Get your scored report",
      description:
        "A full breakdown: viability scores, strengths, risks, tech stack, MVP scope, market size, and a devil's-advocate red-team pass.",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3">
            How it works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Pressure-test an idea in three steps
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto">
            No forms to fill. Just a conversation — the same questions a
            good YC partner would ask before writing a check.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6"
            >
              <div className="absolute top-5 right-5 text-5xl font-black text-[color:var(--border)] select-none leading-none">
                {step}
              </div>
              <div className="w-10 h-10 rounded-xl bg-[color:var(--accent)]/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-[color:var(--accent)]" />
              </div>
              <h3 className="text-base font-semibold mb-2">{title}</h3>
              <p className="text-sm text-[color:var(--muted)] leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: BarChart3,
      title: "5-dimension viability scores",
      description:
        "Viability, niche clarity, problem strength, differentiation, and an honest overall score — not inflated to be nice.",
    },
    {
      icon: Globe,
      title: "Real competitor research",
      description:
        "Three targeted search queries surface actual apps in your space. The analysis is grounded in what exists, not hallucinated.",
    },
    {
      icon: TrendingUp,
      title: "Expanded market insights",
      description:
        "Market size estimate, funding signals, failed-predecessor graveyard, build effort bucket, and regulatory flags — all in one pass.",
    },
    {
      icon: Shield,
      title: "Devil's advocate red-team",
      description:
        "A ruthless investor-persona tears apart your idea: silent killers, distribution risk, unit economics — the things founders miss.",
    },
    {
      icon: Zap,
      title: "Tech stack + MVP roadmap",
      description:
        "Tailored technology recommendations and a 4-6 step ordered roadmap of shippable milestones — not generic advice.",
    },
    {
      icon: MessageSquare,
      title: "Refine &amp; re-score",
      description:
        "Not happy with the analysis? Edit the pitch and re-run. History is saved so you can track how your idea evolves.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-[color:var(--card)] border-y border-[color:var(--border)]">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3">
            What you get
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything in one report
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto">
            Most tools give you a hype check. Vibe Check gives you a reality
            check.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] p-5 hover:border-[color:var(--accent)]/40 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center mb-3">
                <Icon size={18} className="text-[color:var(--accent)]" />
              </div>
              <h3
                className="text-sm font-semibold mb-1.5"
                dangerouslySetInnerHTML={{ __html: title }}
              />
              <p className="text-sm text-[color:var(--muted)] leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const tiers = [
    PRICING_TIERS.free,
    PRICING_TIERS.pro,
    PRICING_TIERS.lifetime,
  ] as const;

  return (
    <section className="py-24 px-6" id="pricing">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Pick a plan that fits the idea
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto">
            Start free. When you&apos;re burning through ideas faster than 3
            a month, Pro unlocks unlimited checks and better reasoning.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const highlight = tier.tier === "pro";
            return (
              <div
                key={tier.tier}
                className={`relative rounded-2xl border p-6 flex flex-col transition ${
                  highlight
                    ? "border-[color:var(--accent)] bg-[color:var(--card)] shadow-xl shadow-[color:var(--accent)]/10"
                    : "border-[color:var(--border)] bg-[color:var(--card)]"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-0.5 rounded-full bg-[color:var(--accent)] text-white font-medium whitespace-nowrap">
                    Most popular
                  </div>
                )}

                <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium">
                  {tier.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">
                    {tier.priceLabel}
                  </span>
                  {tier.tier === "pro" && (
                    <span className="text-sm text-[color:var(--muted)]">
                      /month
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {tier.blurb}
                </p>

                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        size={15}
                        className="text-[color:var(--accent)] mt-0.5 shrink-0"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link
                    href="/signin"
                    className={`block text-center rounded-xl py-2.5 text-sm font-semibold transition ${
                      highlight
                        ? "bg-[color:var(--accent)] text-white hover:brightness-110 shadow-lg shadow-[color:var(--accent)]/20"
                        : "border border-[color:var(--border)] hover:bg-[color:var(--background)]"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-[color:var(--muted)] text-center">
          Payments handled by Stripe. Cancel anytime from your billing
          portal. Lifetime tier limited to the first 100 subscribers.
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const faqs = [
    {
      q: "How many interview questions will I get?",
      a: "The AI coach asks 5–7 focused questions — one per turn — then wraps up when it has enough signal. You can also skip straight to the report at any time using the &ldquo;analyze now&rdquo; shortcut.",
    },
    {
      q: "Where do the competitor results come from?",
      a: "We use Tavily&apos;s search API to run three targeted queries against live web results. No cached databases, no hallucinated company names. If nothing relevant surfaces, the report says so honestly.",
    },
    {
      q: "Can I re-analyze the same idea after tweaking the pitch?",
      a: "Yes. From the report screen, hit &ldquo;Re-score&rdquo;, edit your pitch summary, and submit. The session stays the same in your history — you&apos;ll see the updated scores immediately.",
    },
    {
      q: "What is the devil&apos;s advocate pass?",
      a: "A separate AI persona — a skeptical early-stage investor — stress-tests your idea with concrete failure modes: distribution cost, unit economics, moat erosion, cold-start problems, and more. It only tells you the bad news.",
    },
    {
      q: "Is my idea data stored or used to train models?",
      a: "Your sessions are stored in Supabase (Postgres) under your account, protected by row-level security. We don&apos;t share your data with third parties or use it to train models.",
    },
    {
      q: "What models power Vibe Check?",
      a: "Free tier uses Gemini 2.5 Flash Lite. Pro and Lifetime subscribers get Gemini 2.5 Flash — better reasoning, same speed. Competitor search is powered by the Tavily API.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-[color:var(--card)] border-y border-[color:var(--border)]">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3">
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-sm font-medium list-none select-none hover:bg-[color:var(--card)] transition">
                <span dangerouslySetInnerHTML={{ __html: q }} />
                <ChevronDown
                  size={16}
                  className="shrink-0 text-[color:var(--muted)] transition-transform group-open:rotate-180"
                />
              </summary>
              <div
                className="px-5 pb-4 text-sm text-[color:var(--muted)] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: a }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="py-24 px-6 text-center">
      <div className="mx-auto max-w-2xl">
        <div
          className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6"
          style={{
            background:
              "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
          }}
        >
          <Sparkles size={28} className="text-white" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Stop guessing. Start building the right thing.
        </h2>
        <p className="mt-4 text-[color:var(--muted)] text-lg max-w-lg mx-auto">
          Three free vibe checks a month. No credit card. Cancel anytime.
          The hardest part is having the idea — we&apos;ll handle the
          reality check.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] text-white px-7 py-3.5 text-base font-semibold hover:brightness-110 transition shadow-lg shadow-[color:var(--accent)]/20"
          >
            Get started free
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
          >
            View full pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[color:var(--accent)] flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-semibold text-sm">Vibe Check</span>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-[color:var(--muted)]">
          <Link href="#pricing" className="hover:text-[color:var(--foreground)] transition">
            Pricing
          </Link>
          <Link href="/signin" className="hover:text-[color:var(--foreground)] transition">
            Sign in
          </Link>
        </nav>

        <Link
          href="/signin"
          className="rounded-lg bg-[color:var(--accent)] text-white px-4 py-1.5 text-sm font-medium hover:brightness-110 transition"
        >
          Start free
        </Link>
      </div>
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[color:var(--border)] py-8 px-6">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[color:var(--muted)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[color:var(--accent)] flex items-center justify-center">
            <Sparkles size={11} className="text-white" />
          </div>
          <span>Vibe Check</span>
          <span className="text-[color:var(--border)]">·</span>
          <span>Powered by Gemini &amp; Tavily</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="hover:text-[color:var(--foreground)] transition">
            Pricing
          </Link>
          <Link href="/signin" className="hover:text-[color:var(--foreground)] transition">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
