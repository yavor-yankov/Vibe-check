"use client";

import { Globe, RefreshCw, Search, Sparkles } from "lucide-react";
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
      <p className="text-[color:var(--muted)] mb-8 italic">
        &ldquo;{ideaSummary}&rdquo;
      </p>

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
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
                  current
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5"
                    : done
                      ? "border-[color:var(--border)] bg-[color:var(--card)] opacity-70"
                      : "border-[color:var(--border)] bg-[color:var(--card)] opacity-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    current
                      ? "bg-[color:var(--accent)] text-white"
                      : done
                        ? "bg-[color:var(--good)] text-white"
                        : "bg-[color:var(--border)]"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 text-sm">{s.label}</div>
                {current && (
                  <div className="flex items-center gap-1">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
