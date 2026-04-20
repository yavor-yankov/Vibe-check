"use client";

import { Globe, Search, Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface ScanningStageProps {
  ideaSummary: string;
  /** Set when the parent's analyze() call failed while still in scanning stage. */
  error?: string | null;
  /** Called when the user clicks "Try again" — parent should re-trigger analyze. */
  onRetry?: () => void;
}

const STEPS = [
  { icon: Search, label: "Generating search queries…" },
  { icon: Globe, label: "Scanning the web for similar apps…" },
  { icon: Sparkles, label: "Scoring viability and drafting your build plan…" },
];

export default function ScanningStage({
  ideaSummary,
  error,
  onRetry,
}: ScanningStageProps) {
  const [active, setActive] = useState(0);

  // Advance the step indicator every 2.5 s — pause when there's an error.
  useEffect(() => {
    if (error) return;
    const id = setInterval(() => {
      setActive((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 2500);
    return () => clearInterval(id);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 fade-in-up">
      <div className="text-xs text-[color:var(--accent)] font-medium mb-3">
        Step 3 of 3 — Analyzing
      </div>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">
        Vibe-checking your idea…
      </h1>

      {/* Shimmer bar representing the idea being processed */}
      <div className="skeleton h-4 w-2/3 mb-2" />
      <div className="skeleton h-3 w-1/2 mb-8 opacity-60" />

      {error ? (
        // Error state — replace spinner with a friendly message + retry button.
        <div className="rounded-xl border border-[color:var(--bad)]/30 bg-[color:var(--bad)]/5 px-6 py-5">
          <p className="text-sm font-medium text-[color:var(--bad)] mb-1">
            Something went wrong during the analysis.
          </p>
          <p className="text-sm text-[color:var(--muted)] mb-4">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] text-white px-4 py-2 text-sm font-medium hover:brightness-110 transition"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < active;
            const current = i === active;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-500 ${
                  current
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5"
                    : done
                      ? "border-[color:var(--border)] bg-[color:var(--card)] opacity-70"
                      : "border-[color:var(--border)] bg-[color:var(--card)] opacity-40"
                }`}
              >
                {/* Icon with spinner ring on the active step */}
                <div className="relative shrink-0 w-8 h-8">
                  {current && (
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[color:var(--accent)] animate-spin" />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      current
                        ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                        : done
                          ? "bg-[color:var(--good)] text-white"
                          : "bg-[color:var(--border)] text-[color:var(--muted)]"
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                </div>

                <div className="flex-1 text-sm font-medium">{s.label}</div>

                {current && (
                  <div className="flex items-center gap-1">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                  </div>
                )}

                {done && (
                  <div className="w-4 h-4 rounded-full bg-[color:var(--good)] flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Skeleton preview of what's being built below the steps */}
          <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 space-y-3 opacity-50">
            <div className="skeleton h-3 w-24" />
            <div className="flex gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-circle w-14 h-14" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 opacity-40">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 space-y-2">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-2.5 w-full" style={{ animationDelay: "0.1s" }} />
              <div className="skeleton h-2.5 w-4/5" style={{ animationDelay: "0.2s" }} />
              <div className="skeleton h-2.5 w-3/4" style={{ animationDelay: "0.3s" }} />
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 space-y-2">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-2.5 w-full" style={{ animationDelay: "0.15s" }} />
              <div className="skeleton h-2.5 w-3/5" style={{ animationDelay: "0.25s" }} />
              <div className="skeleton h-2.5 w-4/5" style={{ animationDelay: "0.35s" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
