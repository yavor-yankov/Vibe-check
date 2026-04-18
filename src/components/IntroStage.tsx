"use client";

import { ArrowRight, Lightbulb } from "lucide-react";
import { useState } from "react";

const EXAMPLES = [
  "A local-first journaling app that nudges you with AI when you skip days",
  "A marketplace for freelance dog trainers with video-based booking",
  "An app that scores the readability of my Slack messages before I send them",
];

interface IntroStageProps {
  onStart: (seed: string) => void;
}

export default function IntroStage({ onStart }: IntroStageProps) {
  const [seed, setSeed] = useState("");

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 fade-in-up">
      <div className="flex items-center gap-2 text-[color:var(--accent)] text-sm font-medium mb-3">
        <Lightbulb size={16} />
        Step 1 of 3 — Describe your idea
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mb-4">
        What&apos;s the app you&apos;re thinking about building?
      </h1>
      <p className="text-[color:var(--muted)] text-lg mb-8">
        One or two sentences is enough. I&apos;ll ask follow-up questions like a
        picky product partner, then scan the web for competitors and score the
        whole thing.
      </p>

      <textarea
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        placeholder="e.g. An app that checks if my app idea already exists and scores its viability…"
        className="w-full min-h-[140px] rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 text-base leading-relaxed resize-y focus:outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && seed.trim()) {
            onStart(seed.trim());
          }
        }}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-[color:var(--muted)]">
          ⌘/Ctrl + Enter to start
        </div>
        <button
          onClick={() => seed.trim() && onStart(seed.trim())}
          disabled={!seed.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] text-white px-5 py-2.5 font-medium hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start interview
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-10">
        <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-3">
          Or try one of these
        </div>
        <div className="space-y-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setSeed(ex)}
              className="w-full text-left rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/5 transition"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
