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
import { useEffect, useRef, useState } from "react";

// ─── useInView hook ──────────────────────────────────────────────────────────

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Once visible, stop observing
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px", ...options }
    );

    // Observe the container and all children with animate-on-scroll
    const animatedChildren = el.querySelectorAll(".animate-on-scroll");
    animatedChildren.forEach((child) => observer.observe(child));
    if (el.classList.contains("animate-on-scroll")) {
      observer.observe(el);
    }

    // Safety fallback — if elements are already in view or observer
    // fails to fire, make everything visible after a short delay
    const fallback = setTimeout(() => {
      animatedChildren.forEach((child) => child.classList.add("is-visible"));
      if (el.classList.contains("animate-on-scroll")) {
        el.classList.add("is-visible");
      }
    }, 3000);

    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, [options]);

  return ref;
}

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            // Parse numeric part
            const numericMatch = value.match(/^([\d.]+)/);
            if (numericMatch) {
              const target = parseFloat(numericMatch[1]);
              const isFloat = numericMatch[1].includes(".");
              const prefix = "";
              const rest = value.slice(numericMatch[1].length);
              const duration = 1200;
              const startTime = performance.now();

              function animate(now: number) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = eased * target;

                if (isFloat) {
                  setDisplayed(prefix + current.toFixed(1) + rest);
                } else {
                  setDisplayed(prefix + Math.round(current) + rest);
                }

                if (progress < 1) {
                  requestAnimationFrame(animate);
                } else {
                  setDisplayed(value);
                }
              }

              requestAnimationFrame(animate);
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span
      ref={ref}
      style={{ animation: "counterReveal 0.6s ease-out backwards" }}
    >
      {displayed}
      {suffix}
    </span>
  );
}

// ─── Floating particles ──────────────────────────────────────────────────────

function FloatingParticles() {
  const particles = [
    { size: 5, left: "5%",  delay: "0s",   duration: "16s", opacity: 0.5,  color: "var(--accent)" },
    { size: 3, left: "12%", delay: "2s",   duration: "20s", opacity: 0.35, color: "var(--accent)" },
    { size: 6, left: "22%", delay: "1s",   duration: "14s", opacity: 0.45, color: "#fb923c" },
    { size: 4, left: "30%", delay: "4s",   duration: "18s", opacity: 0.3,  color: "var(--accent)" },
    { size: 7, left: "40%", delay: "0.5s", duration: "15s", opacity: 0.4,  color: "#fdba74" },
    { size: 3, left: "48%", delay: "3s",   duration: "22s", opacity: 0.35, color: "var(--accent)" },
    { size: 5, left: "55%", delay: "5s",   duration: "17s", opacity: 0.45, color: "#fb923c" },
    { size: 4, left: "63%", delay: "1.5s", duration: "19s", opacity: 0.3,  color: "var(--accent)" },
    { size: 6, left: "72%", delay: "2.5s", duration: "16s", opacity: 0.5,  color: "#fdba74" },
    { size: 3, left: "80%", delay: "4.5s", duration: "21s", opacity: 0.35, color: "var(--accent)" },
    { size: 5, left: "87%", delay: "0.8s", duration: "15s", opacity: 0.4,  color: "#fb923c" },
    { size: 4, left: "93%", delay: "6s",   duration: "18s", opacity: 0.3,  color: "var(--accent)" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: "-10px",
            backgroundColor: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `particleDrift ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Floating orbs ───────────────────────────────────────────────────────────

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Large warm orb top-right */}
      <div
        className="absolute"
        style={{
          width: 300,
          height: 300,
          top: "-60px",
          right: "-80px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
          animation: "orbitSlow 30s linear infinite",
          filter: "blur(40px)",
        }}
      />
      {/* Medium cool orb bottom-left */}
      <div
        className="absolute"
        style={{
          width: 220,
          height: 220,
          bottom: "60px",
          left: "-60px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)",
          animation: "orbitSlow 40s linear 5s infinite reverse",
          filter: "blur(50px)",
        }}
      />
      {/* Small accent orb center */}
      <div
        className="absolute"
        style={{
          width: 120,
          height: 120,
          top: "40%",
          left: "60%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(251,146,60,0.07) 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite",
          filter: "blur(30px)",
        }}
      />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-28 pb-24 px-6 text-center">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 hero-grid-pattern -z-10" aria-hidden />

      {/* Ambient glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Floating elements */}
      <FloatingOrbs />
      <FloatingParticles />

      <div className="relative mx-auto max-w-3xl">
        {/* Badge — stagger 0 */}
        <div
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-medium text-[color:var(--accent)] mb-6"
          style={{ animation: "heroFadeInUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s backwards" }}
        >
          <Star size={12} fill="currentColor" />
          {t("landing.hero.badge")}
        </div>

        {/* Heading — stagger 1 */}
        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight leading-tight"
          style={{ animation: "heroFadeInUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s backwards" }}
        >
          {t("landing.hero.heading1")}
          <span
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #fb923c 25%, #fdba74 50%, #f97316 75%, #fb923c 100%)",
              backgroundSize: "300% 300%",
              animation: "gradientShift 5s ease infinite",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("landing.hero.headingHighlight")}
          </span>
        </h1>

        {/* Description — stagger 2 */}
        <p
          className="mt-5 text-xl text-[color:var(--muted)] max-w-2xl mx-auto leading-relaxed"
          style={{ animation: "heroFadeInUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s backwards" }}
        >
          {t("landing.hero.description")}
        </p>

        {/* CTA buttons — stagger 3 */}
        <div
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ animation: "heroFadeInUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s backwards" }}
        >
          <Link
            href="/signin"
            className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] text-white px-6 py-3 text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-lg shadow-[color:var(--accent)]/20 hover:shadow-xl hover:shadow-[color:var(--accent)]/30 hover:-translate-y-0.5"
          >
            {t("landing.hero.ctaPrimary")}
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-3 text-base font-medium hover:bg-[color:var(--background)] hover:border-[color:var(--accent)]/30 transition-all duration-300"
          >
            {t("landing.hero.ctaSecondary")}
          </Link>
        </div>

        {/* Subtext — stagger 4 */}
        <p
          className="mt-4 text-sm text-[color:var(--muted)]"
          style={{ animation: "heroFadeInUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s backwards" }}
        >
          {t("landing.hero.subtext")}
        </p>
      </div>

      {/* Mock report card preview — 3D tilt entrance */}
      <div
        className="mt-16 mx-auto max-w-2xl"
        style={{ animation: "tiltIn 1s cubic-bezier(0.16,1,0.3,1) 0.9s backwards" }}
      >
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
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl shadow-black/10 overflow-hidden text-left hover:shadow-3xl transition-shadow duration-500">
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
                className="h-full rounded-full bg-[color:var(--accent)] transition-all duration-1000"
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
              className="text-xs px-2.5 py-1 rounded-full border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--accent)]/30 transition-colors duration-300"
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
  const sectionRef = useInView();

  const stats = [
    { value: t("landing.stats.value1"), label: t("landing.stats.label1") },
    { value: t("landing.stats.value2"), label: t("landing.stats.label2") },
    { value: t("landing.stats.value3"), label: t("landing.stats.label3") },
    { value: t("landing.stats.value4"), label: t("landing.stats.label4") },
  ];

  return (
    <section className="border-y border-[color:var(--border)] bg-[color:var(--card)] py-8 px-6">
      <div ref={sectionRef} className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map(({ value, label }, i) => (
          <div
            key={label}
            className={`animate-on-scroll stagger-${i + 1}`}
          >
            <div className="text-2xl font-bold text-[color:var(--foreground)]">
              <AnimatedCounter value={value} />
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
  const sectionRef = useInView();

  const steps = [
    {
      icon: MessageSquare,
      step: "01",
      title: t("landing.howItWorks.step1Title"),
      description: t("landing.howItWorks.step1Description"),
      direction: "from-left",
    },
    {
      icon: Globe,
      step: "02",
      title: t("landing.howItWorks.step2Title"),
      description: t("landing.howItWorks.step2Description"),
      direction: "",
    },
    {
      icon: BarChart3,
      step: "03",
      title: t("landing.howItWorks.step3Title"),
      description: t("landing.howItWorks.step3Description"),
      direction: "from-right",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div ref={sectionRef} className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3 animate-on-scroll">
            {t("landing.howItWorks.sectionLabel")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-on-scroll stagger-1">
            {t("landing.howItWorks.heading")}
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto animate-on-scroll stagger-2">
            {t("landing.howItWorks.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, step, title, description, direction }, i) => (
            <div
              key={step}
              className={`relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 animate-on-scroll ${direction} stagger-${i + 1} hover:border-[color:var(--accent)]/30 transition-colors duration-300`}
            >
              <div
                className="absolute top-5 right-5 text-5xl font-black select-none leading-none"
                style={{
                  color: "var(--border)",
                  animation: "pulseGlow 3s ease-in-out infinite",
                  animationDelay: `${i * 0.5}s`,
                }}
              >
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
  const sectionRef = useInView();

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
      <div ref={sectionRef} className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3 animate-on-scroll">
            {t("landing.features.sectionLabel")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-on-scroll stagger-1">
            {t("landing.features.heading")}
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto animate-on-scroll stagger-2">
            {t("landing.features.description")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, titleKey, descKey }, i) => (
            <div
              key={titleKey}
              className={`rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] p-5 feature-card-hover animate-on-scroll stagger-${Math.min(i + 1, 5)}`}
            >
              <div className="w-9 h-9 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center mb-3 feature-icon">
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
  const sectionRef = useInView();

  const tiers = [
    PRICING_TIERS.free,
    PRICING_TIERS.pro,
    PRICING_TIERS.lifetime,
  ] as const;

  return (
    <section className="py-24 px-6" id="pricing">
      <div ref={sectionRef} className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3 animate-on-scroll">
            {t("landing.pricing.sectionLabel")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-on-scroll stagger-1">
            {t("landing.pricing.heading")}
          </h2>
          <p className="mt-4 text-[color:var(--muted)] max-w-xl mx-auto animate-on-scroll stagger-2">
            {t("landing.pricing.description")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier, i) => {
            const highlight = tier.tier === "pro";
            return (
              <div
                key={tier.tier}
                className={`relative rounded-2xl border p-6 flex flex-col animate-on-scroll from-scale stagger-${i + 1} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  highlight
                    ? "animated-gradient-border bg-[color:var(--card)] shadow-xl shadow-[color:var(--accent)]/10"
                    : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--accent)]/30"
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
                    className={`block text-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
                      highlight
                        ? "bg-[color:var(--accent)] text-white hover:brightness-110 shadow-lg shadow-[color:var(--accent)]/20 hover:shadow-xl hover:shadow-[color:var(--accent)]/30"
                        : "border border-[color:var(--border)] hover:bg-[color:var(--background)] hover:border-[color:var(--accent)]/30"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-[color:var(--muted)] text-center animate-on-scroll stagger-4">
          {t("landing.pricing.footer")}
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const { t } = useTranslation();
  const sectionRef = useInView();

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
      <div ref={sectionRef} className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-widest text-[color:var(--accent)] font-semibold mb-3 animate-on-scroll">
            {t("landing.faq.sectionLabel")}
          </div>
          <h2 className="text-3xl font-bold tracking-tight animate-on-scroll stagger-1">
            {t("landing.faq.heading")}
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <details
              key={i}
              className={`group rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] overflow-hidden animate-on-scroll stagger-${Math.min(i + 1, 5)} hover:border-[color:var(--accent)]/20 transition-colors duration-300`}
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-sm font-medium list-none select-none hover:bg-[color:var(--card)] transition">
                <span>{q}</span>
                <ChevronDown
                  size={16}
                  className="shrink-0 text-[color:var(--muted)] transition-transform duration-300 group-open:rotate-180"
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
  const sectionRef = useInView();

  return (
    <section className="relative py-24 px-6 text-center overflow-hidden">
      {/* Animated radial gradient pulse background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)",
          animation: "radialPulse 6s ease-in-out infinite",
        }}
      />

      <div ref={sectionRef} className="relative mx-auto max-w-2xl">
        <div
          className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 animate-on-scroll"
          style={{
            background:
              "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
          }}
        >
          <Sparkles
            size={28}
            className="text-white"
            style={{ animation: "rotateSlow 12s linear infinite" }}
          />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-on-scroll stagger-1">
          {t("landing.cta.heading")}
        </h2>
        <p className="mt-4 text-[color:var(--muted)] text-lg max-w-lg mx-auto animate-on-scroll stagger-2">
          {t("landing.cta.description")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-on-scroll stagger-3">
          <Link
            href="/signin"
            className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] text-white px-7 py-3.5 text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-lg shadow-[color:var(--accent)]/20 hover:shadow-xl hover:shadow-[color:var(--accent)]/30 hover:-translate-y-0.5"
          >
            {t("landing.cta.primaryButton")}
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors duration-300"
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
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[color:var(--accent)] flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-semibold text-sm">{t("landing.nav.brand")}</span>
        </div>

        {/* Center: Navigation links */}
        <nav className="hidden sm:flex items-center justify-center flex-1">
          <Link
            href="#pricing"
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors duration-200"
          >
            {t("landing.nav.pricing")}
          </Link>
        </nav>

        {/* Right: CTA button + language picker */}
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="rounded-lg bg-[color:var(--accent)] text-white px-4 py-1.5 text-sm font-medium hover:brightness-110 transition-all duration-200 hover:shadow-md hover:shadow-[color:var(--accent)]/20"
          >
            {t("landing.nav.startFree")}
          </Link>
          <LanguagePicker subtle />
        </div>
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
          <Link href="/pricing" className="hover:text-[color:var(--foreground)] transition-colors duration-200">
            {t("landing.footer.pricing")}
          </Link>
          <Link href="/signin" className="hover:text-[color:var(--foreground)] transition-colors duration-200">
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
