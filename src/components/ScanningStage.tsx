"use client";

import { Globe, Search, Sparkles } from "lucide-react";

interface ScanningStageProps {
  ideaSummary: string;
  // 0 = generating queries, 1 = scanning web, 2 = analyzing. Driven by the
  // parent so the indicator stays in sync with the actual network requests
  // instead of running on a dumb 2.5 s timer that drifts from reality.
  step?: number;
}

const STEPS = [
  { icon: Search, label: "Generating search queries…" },
  { icon: Globe, label: "Scanning the web for similar apps…" },
  { icon: Sparkles, label: "Scoring viability and drafting your build plan…" },
];

export default function ScanningStage({
  ideaSummary,
  step = 0,
}: ScanningStageProps) {
  const active = Math.min(step, STEPS.length - 1);

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
    </div>
  );
}
