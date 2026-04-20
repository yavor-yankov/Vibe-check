"use client";

import { ArrowRight, ChevronDown, ChevronUp, Lightbulb, User } from "lucide-react";
import { useState } from "react";
import type { FounderProfile } from "@/lib/types";

const EXAMPLES = [
  "A local-first journaling app that nudges you with AI when you skip days",
  "A marketplace for freelance dog trainers with video-based booking",
  "An app that scores the readability of my Slack messages before I send them",
];

interface IntroStageProps {
  onStart: (seed: string, founderProfile?: FounderProfile) => void;
}

const DOMAIN_OPTIONS = [
  { value: "none", label: "None — exploring a new space" },
  { value: "some", label: "Some — I know the basics" },
  { value: "deep", label: "Deep — I've worked in this area" },
] as const;

const TECHNICAL_OPTIONS = [
  { value: "non-technical", label: "Non-technical" },
  { value: "can-code", label: "Can code / learning" },
  { value: "senior-engineer", label: "Senior engineer" },
] as const;

const RUNWAY_OPTIONS = [
  { value: "side-project", label: "Side project (nights & weekends)" },
  { value: "3-months", label: "~3 months of runway" },
  { value: "6-months-plus", label: "6+ months or funded" },
] as const;

const TIME_OPTIONS = [
  { value: "nights-weekends", label: "Nights & weekends" },
  { value: "part-time", label: "Part-time" },
  { value: "full-time", label: "Full-time" },
] as const;

const EXPERIENCE_OPTIONS = [
  { value: "first-time", label: "First-time founder" },
  { value: "one-prior", label: "1 prior attempt" },
  { value: "serial", label: "Serial founder" },
] as const;

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
      <div className="text-sm font-medium w-36 shrink-0">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              value === opt.value
                ? "bg-[color:var(--accent)] text-white border-[color:var(--accent)]"
                : "border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function IntroStage({ onStart }: IntroStageProps) {
  const [seed, setSeed] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<FounderProfile>({
    domainExpertise: "none",
    technicalAbility: "can-code",
    runway: "side-project",
    timeCommitment: "nights-weekends",
    priorExperience: "first-time",
  });

  const handleStart = () => {
    if (!seed.trim()) return;
    onStart(seed.trim(), showProfile ? profile : undefined);
  };

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
            handleStart();
          }
        }}
      />

      {/* ── Founder Readiness (optional, collapsible) ── */}
      <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProfile((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[color:var(--background)] transition"
        >
          <User size={15} className="text-[color:var(--accent)]" />
          <span className="text-sm font-medium flex-1">
            Tell me about yourself
          </span>
          <span className="text-xs text-[color:var(--muted)]">Optional — personalizes the report</span>
          {showProfile ? (
            <ChevronUp size={14} className="text-[color:var(--muted)]" />
          ) : (
            <ChevronDown size={14} className="text-[color:var(--muted)]" />
          )}
        </button>

        {showProfile && (
          <div className="px-4 pb-4 space-y-3 border-t border-[color:var(--border)] pt-3">
            <SelectRow
              label="Domain expertise"
              value={profile.domainExpertise}
              options={DOMAIN_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, domainExpertise: v as FounderProfile["domainExpertise"] }))}
            />
            <SelectRow
              label="Technical ability"
              value={profile.technicalAbility}
              options={TECHNICAL_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, technicalAbility: v as FounderProfile["technicalAbility"] }))}
            />
            <SelectRow
              label="Runway"
              value={profile.runway}
              options={RUNWAY_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, runway: v as FounderProfile["runway"] }))}
            />
            <SelectRow
              label="Time commitment"
              value={profile.timeCommitment}
              options={TIME_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, timeCommitment: v as FounderProfile["timeCommitment"] }))}
            />
            <SelectRow
              label="Experience"
              value={profile.priorExperience}
              options={EXPERIENCE_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, priorExperience: v as FounderProfile["priorExperience"] }))}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-[color:var(--muted)]">
          Ctrl + Enter to start
        </div>
        <button
          onClick={handleStart}
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
