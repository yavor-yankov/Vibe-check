"use client";

import { useState, useEffect } from "react";
import { X, MessageSquare, Search, BarChart3, Sparkles } from "lucide-react";

const ONBOARDING_KEY = "vibe-check-onboarding-seen";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <MessageSquare className="w-6 h-6 text-[color:var(--accent)]" />,
    title: "Share your idea",
    description:
      "Describe your startup concept. Our AI coach will ask 5-7 questions to understand your vision, target users, and differentiation.",
  },
  {
    icon: <Search className="w-6 h-6 text-[color:var(--accent)]" />,
    title: "Competitor scan",
    description:
      "We search the web for similar products and analyze how crowded the space is. Takes about 30 seconds.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-[color:var(--accent)]" />,
    title: "Scored report",
    description:
      "Get a detailed analysis with scores for viability, niche clarity, problem fit, and differentiation. Plus a devil's advocate pass.",
  },
];

/**
 * First-time user onboarding overlay. Shows a 3-step tour explaining
 * what Vibe Check does and what to expect. Skippable, persisted in
 * localStorage so it only shows once.
 */
export default function OnboardingOverlay({
  hasNoSessions,
}: {
  hasNoSessions: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Only show if user has no sessions AND hasn't dismissed before.
    if (!hasNoSessions) return;
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        // eslint-disable-next-line
        setVisible(true);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [hasNoSessions]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, String(Date.now()));
    } catch {
      /* best effort */
    }
  };

  if (!visible) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-[color:var(--card)] border border-[color:var(--border)] shadow-xl p-6">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[color:var(--border)] transition-colors"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4 text-[color:var(--muted)]" />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? "w-6 bg-[color:var(--accent)]"
                  : "w-1.5 bg-[color:var(--border)]"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--accent)]/10 mb-4">
            {step.icon}
          </div>
          <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
          <p className="text-sm text-[color:var(--muted)] leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[color:var(--border)] text-sm font-medium hover:bg-[color:var(--border)] transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => {
              if (isLast) {
                dismiss();
              } else {
                setCurrentStep((s) => s + 1);
              }
            }}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[color:var(--accent)] text-white text-sm font-medium hover:brightness-110 transition-all"
          >
            {isLast ? (
              <span className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Get started
              </span>
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
