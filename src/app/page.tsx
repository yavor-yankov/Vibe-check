"use client";

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
import { useTranslation } from "@/lib/i18n/useTranslation";
import LanguagePicker from "@/components/LanguagePicker";

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { t } = useTranslation();

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
          {t("landing.hero.badge")}
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          {t("landing.hero.heading1")}
          <span
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("landing.hero.headingHighlight")}
          </span>
        </h1>

        <p className="mt-5 text-xl text-[color:var(--muted)] max-w-2xl mx-auto leading-relaxed">
          {t("landing.hero.description")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] text-white px-6 py-3 text-base font-semibold hover:brightness-110 transition shadow-lg shadow-[color:var(--accent)]/20"
          >
            {t("landing.hero.ctaPrimary")}
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-3 text-base font-medium hover:bg-[color:var(--background)] transition"
          >
            {t("landing.hero.ctaSecondary")}
          </Link>
        </div>

        <p className="mt-4 text-sm text-[color:var(--muted)]">
          {t("landing.hero.subtext")}
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
  const { t } = useTranslation();

  const scores = [
    { label: t("landing.hero.mock.viability"), value: 8 },
    { label: t("landing.hero.mock.problemFit"), value: 9 },
    { label: t("landing.hero.mock.nicheClarity"), value: 7 },
    { label: t("landing.hero.mock.differentiation"), value: 6 },
  ];

  const chips = [
    t("landing.hero.mock.chip1"),
    t("landing.hero.mock.chip2"),
    t("landing.hero.mock.chip3"),
    t("landing.hero.mock.chip4"),
  ];

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl shadow-black/10 overflow-hidden text-left">
      {/* Title bar */}
      <div className="px-5 py-3.5 border-b border-[color:var(--border)] flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[color:var(--bad)] opacity-80" />
        <div className="w-3 h-3 rounded-full bg-[color:var(--warn)] opacity-80" />
        <div className="w-3 h-3 rounded-full bg-[color:var(--good)] opacity-80" />
        <span className="ml-2 text-xs text-[color:var(--muted)] font-mono">
          {t("landing.hero.mock.titleBar")}
        </span>
      </div>

      <div className="p-5 grid gap-4 sm:grid-cols-2">
        {/* Verdict */}
        <div className="sm:col-span-2 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-1">
              {t("landing.hero.mock.verdictLabel")}
            </div>
            <div className="text-lg font-bold text-[color:var(--good)]">
              {t("landing.hero.mock.verdictValue")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-1">
              {t("landing.hero.mock.overallScoreLabel")}
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
          {chips.map((chip) => (
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
  const { t } = useTranslation();

  const stats = [
    { value: t("landing.stats.value1"), label: t("landing.stats.label1") },
    { value: t("landing.stats.value2"), label: t("landing.stats.label2") },
    { value: t("landing.stats.value3"), label: t("landing.stats.label3") },
    { value: t("landing.stats.value4"), label: t("landing.stats.label4") },
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
  const { t } = useTranslation();

  const steps = [
    {
      icon: MessageSquare,
      step: "01",
      title: t("landing.howItWorks.step1Title"),
      description: t("landing.howItWorks.step1Description"),
    },
    {
      icon: Globe,
      step: "02",
      title: t("landing.howItWorks.step2Title"),
      description: t("landing.howItWorks.step2Description"),
    },
    {
      icon: BarChart3,
      step: "03",
      title: t("landing.howItWorks.step3Title"),
      description: t("landing.howItWorks.step3Description"),
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3">
            {t("landing.howItWorks.sectionLabel")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("landing.howItWorks.heading")}
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto">
            {t("landing.howItWorks.description")}
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
  const { t } = useTranslation();

  const features = [
    { icon: BarChart3, titleKey: "landing.features.feature1Title" as const, descKey: "landing.features.feature1Description" as const },
    { icon: Globe, titleKey: "landing.features.feature2Title" as const, descKey: "landing.features.feature2Description" as const },
    { icon: TrendingUp, titleKey: "landing.features.feature3Title" as const, descKey: "landing.features.feature3Description" as const },
    { icon: Shield, titleKey: "landing.features.feature4Title" as const, descKey: "landing.features.feature4Description" as const },
    { icon: Zap, titleKey: "landing.features.feature5Title" as const, descKey: "landing.features.feature5Description" as const },
    { icon: MessageSquare, titleKey: "landing.features.feature6Title" as const, descKey: "landing.features.feature6Description" as const },
  ];

  return (
    <section className="py-24 px-6 bg-[color:var(--card)] border-y border-[color:var(--border)]">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3">
            {t("landing.features.sectionLabel")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("landing.features.heading")}
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto">
            {t("landing.features.description")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] p-5 hover:border-[color:var(--accent)]/40 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center mb-3">
                <Icon size={18} className="text-[color:var(--accent)]" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-[color:var(--muted)] leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
  const { t } = useTranslation();

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
            {t("landing.pricing.sectionLabel")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("landing.pricing.heading")}
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto">
            {t("landing.pricing.description")}
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
                    {t("landing.pricing.mostPopular")}
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
                      {t("landing.pricing.perMonth")}
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
          {t("landing.pricing.footer")}
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const { t } = useTranslation();

  const faqs = [
    { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
    { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
    { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
    { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
    { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
    { q: t("landing.faq.q6"), a: t("landing.faq.a6") },
  ];

  return (
    <section className="py-24 px-6 bg-[color:var(--card)] border-y border-[color:var(--border)]">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3">
            {t("landing.faq.sectionLabel")}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("landing.faq.heading")}
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-sm font-medium list-none select-none hover:bg-[color:var(--card)] transition">
                <span>{q}</span>
                <ChevronDown
                  size={16}
                  className="shrink-0 text-[color:var(--muted)] transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="px-5 pb-4 text-sm text-[color:var(--muted)] leading-relaxed">
                {a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  const { t } = useTranslation();

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
          {t("landing.cta.heading")}
        </h2>
        <p className="mt-4 text-[color:var(--muted)] text-lg max-w-lg mx-auto">
          {t("landing.cta.description")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] text-white px-7 py-3.5 text-base font-semibold hover:brightness-110 transition shadow-lg shadow-[color:var(--accent)]/20"
          >
            {t("landing.cta.primaryButton")}
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
          >
            {t("landing.cta.secondaryLink")}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[color:var(--accent)] flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-semibold text-sm">{t("landing.nav.brand")}</span>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-[color:var(--muted)]">
          <Link href="#pricing" className="hover:text-[color:var(--foreground)] transition">
            {t("landing.nav.pricing")}
          </Link>
          <Link href="/signin" className="hover:text-[color:var(--foreground)] transition">
            {t("landing.nav.signIn")}
          </Link>
          <LanguagePicker />
        </nav>

        <Link
          href="/signin"
          className="rounded-lg bg-[color:var(--accent)] text-white px-4 py-1.5 text-sm font-medium hover:brightness-110 transition"
        >
          {t("landing.nav.startFree")}
        </Link>
      </div>
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[color:var(--border)] py-8 px-6">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[color:var(--muted)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[color:var(--accent)] flex items-center justify-center">
            <Sparkles size={11} className="text-white" />
          </div>
          <span>{t("landing.footer.brand")}</span>
          <span className="text-[color:var(--border)]">·</span>
          <span>{t("landing.footer.poweredBy")}</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="hover:text-[color:var(--foreground)] transition">
            {t("landing.footer.pricing")}
          </Link>
          <Link href="/signin" className="hover:text-[color:var(--foreground)] transition">
            {t("landing.footer.signIn")}
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
        <PricingSection />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
