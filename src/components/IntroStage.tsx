"use client";

import { ArrowRight, ChevronDown, ChevronUp, Lightbulb, User } from "lucide-react";
import { useState } from "react";
import type { FounderProfile } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

const EXAMPLE_KEYS = [
  "intro.example1",
  "intro.example2",
  "intro.example3",
] as const;

interface IntroStageProps {
  onStart: (seed: string, founderProfile?: FounderProfile) => void;
}

const DOMAIN_OPTION_KEYS = [
  { value: "none", key: "intro.domainNone" },
  { value: "some", key: "intro.domainSome" },
  { value: "deep", key: "intro.domainDeep" },
] as const;

const TECHNICAL_OPTION_KEYS = [
  { value: "non-technical", key: "intro.technicalNonTechnical" },
  { value: "can-code", key: "intro.technicalCanCode" },
  { value: "senior-engineer", key: "intro.technicalSeniorEngineer" },
] as const;

const RUNWAY_OPTION_KEYS = [
  { value: "side-project", key: "intro.runwaySideProject" },
  { value: "3-months", key: "intro.runway3Months" },
  { value: "6-months-plus", key: "intro.runway6MonthsPlus" },
] as const;

const TIME_OPTION_KEYS = [
  { value: "nights-weekends", key: "intro.timeNightsWeekends" },
  { value: "part-time", key: "intro.timePartTime" },
  { value: "full-time", key: "intro.timeFullTime" },
] as const;

const EXPERIENCE_OPTION_KEYS = [
  { value: "first-time", key: "intro.experienceFirstTime" },
  { value: "one-prior", key: "intro.experienceOnePrior" },
  { value: "serial", key: "intro.experienceSerial" },
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
  const { t } = useTranslation();
  const [seed, setSeed] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<FounderProfile>({
    domainExpertise: "none",
    technicalAbility: "can-code",
    runway: "side-project",
    timeCommitment: "nights-weekends",
    priorExperience: "first-time",
  });

  const DOMAIN_OPTIONS = DOMAIN_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const TECHNICAL_OPTIONS = TECHNICAL_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const RUNWAY_OPTIONS = RUNWAY_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const TIME_OPTIONS = TIME_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const EXPERIENCE_OPTIONS = EXPERIENCE_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
  const EXAMPLES = EXAMPLE_KEYS.map((k) => t(k));

  const handleStart = () => {
    if (!seed.trim()) return;
    onStart(seed.trim(), showProfile ? profile : undefined);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 fade-in-up">
      <div className="flex items-center gap-2 text-[color:var(--accent)] text-sm font-medium mb-3">
        <Lightbulb size={16} />
        {t("intro.stepLabel")}
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mb-4">
        {t("intro.heading")}
      </h1>
      <p className="text-[color:var(--muted)] text-lg mb-8">
        {t("intro.description")}
      </p>

      <textarea
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        placeholder={t("intro.placeholder")}
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
            {t("intro.profileToggle")}
          </span>
          <span className="text-xs text-[color:var(--muted)]">{t("intro.profileHint")}</span>
          {showProfile ? (
            <ChevronUp size={14} className="text-[color:var(--muted)]" />
          ) : (
            <ChevronDown size={14} className="text-[color:var(--muted)]" />
          )}
        </button>

        {showProfile && (
          <div className="px-4 pb-4 space-y-3 border-t border-[color:var(--border)] pt-3">
            <SelectRow
              label={t("intro.domainExpertiseLabel")}
              value={profile.domainExpertise}
              options={DOMAIN_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, domainExpertise: v as FounderProfile["domainExpertise"] }))}
            />
            <SelectRow
              label={t("intro.technicalAbilityLabel")}
              value={profile.technicalAbility}
              options={TECHNICAL_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, technicalAbility: v as FounderProfile["technicalAbility"] }))}
            />
            <SelectRow
              label={t("intro.runwayLabel")}
              value={profile.runway}
              options={RUNWAY_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, runway: v as FounderProfile["runway"] }))}
            />
            <SelectRow
              label={t("intro.timeCommitmentLabel")}
              value={profile.timeCommitment}
              options={TIME_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, timeCommitment: v as FounderProfile["timeCommitment"] }))}
            />
            <SelectRow
              label={t("intro.experienceLabel")}
              value={profile.priorExperience}
              options={EXPERIENCE_OPTIONS}
              onChange={(v) => setProfile((p) => ({ ...p, priorExperience: v as FounderProfile["priorExperience"] }))}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-[color:var(--muted)]">
          {t("intro.shortcut")}
        </div>
        <button
          onClick={handleStart}
          disabled={!seed.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] text-white px-5 py-2.5 font-medium hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("intro.startButton")}
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-10">
        <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-3">
          {t("intro.examplesHeading")}
        </div>
        <div className="space-y-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
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
