"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Map,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import type { AnalysisReport, Competitor } from "@/lib/types";

interface ReportStageProps {
  report: AnalysisReport;
  competitors: Competitor[];
  ideaSummary: string;
  onRestart: () => void;
}

const VERDICT_STYLES: Record<
  AnalysisReport["verdict"],
  { bg: string; text: string; label: string }
> = {
  build_it: {
    bg: "bg-[color:var(--good)]",
    text: "text-white",
    label: "Build it",
  },
  iterate: {
    bg: "bg-[color:var(--warn)]",
    text: "text-white",
    label: "Iterate",
  },
  rethink: {
    bg: "bg-[color:var(--warn)]",
    text: "text-white",
    label: "Rethink",
  },
  skip: { bg: "bg-[color:var(--bad)]", text: "text-white", label: "Skip" },
};

function scoreColor(n: number): string {
  if (n >= 7.5) return "var(--good)";
  if (n >= 5) return "var(--warn)";
  return "var(--bad)";
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(10, value)) * 10;
  const color = scoreColor(value);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-20 h-20 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(${color} ${pct}%, var(--border) ${pct}%)`,
        }}
      >
        <div className="w-16 h-16 rounded-full bg-[color:var(--card)] grid place-items-center">
          <span className="text-xl font-semibold">{value.toFixed(1)}</span>
        </div>
      </div>
      <div className="text-xs text-[color:var(--muted)] font-medium uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export default function ReportStage({
  report,
  competitors,
  ideaSummary,
  onRestart,
}: ReportStageProps) {
  const verdict = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES.iterate;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 fade-in-up space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-[color:var(--accent)] font-medium mb-2">
            Vibe check report
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {report.verdictLabel}
          </h1>
          <p className="text-[color:var(--muted)] max-w-2xl">{report.summary}</p>
        </div>
        <button
          onClick={onRestart}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[color:var(--card)] transition"
        >
          <RotateCcw size={14} />
          New check
        </button>
      </div>

      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${verdict.bg} ${verdict.text}`}
      >
        <Sparkles size={14} />
        Verdict: {verdict.label}
      </div>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-[color:var(--accent)]" />
          <h2 className="text-lg font-semibold">Scores</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ScoreRing value={report.scores.overall} label="Overall" />
          <ScoreRing value={report.scores.viability} label="Viability" />
          <ScoreRing value={report.scores.problem} label="Problem" />
          <ScoreRing value={report.scores.niche} label="Niche" />
          <ScoreRing
            value={report.scores.differentiation}
            label="Differentiation"
          />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-[color:var(--good)]" />
            <h2 className="text-lg font-semibold">Strengths</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[color:var(--good)] mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-[color:var(--warn)]" />
            <h2 className="text-lg font-semibold">Risks</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {report.risks.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[color:var(--warn)] mt-0.5">!</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {report.uniqueAngles?.length > 0 && (
        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-[color:var(--accent)]" />
            <h2 className="text-lg font-semibold">Unique angles to pursue</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {report.uniqueAngles.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[color:var(--accent)] mt-0.5">→</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-[color:var(--accent)]" />
          <h2 className="text-lg font-semibold">
            Existing apps found on the web{" "}
            <span className="text-[color:var(--muted)] font-normal text-sm">
              ({competitors.length})
            </span>
          </h2>
        </div>
        {competitors.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            No direct competitors surfaced. That could mean a real white space —
            or that the category is hard to search for.
          </p>
        ) : (
          <ul className="space-y-3">
            {competitors.map((c) => (
              <li
                key={c.url}
                className="rounded-lg border border-[color:var(--border)] p-3 hover:border-[color:var(--accent)] transition"
              >
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium hover:text-[color:var(--accent)]"
                >
                  <span className="truncate">{c.title}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
                <div className="text-xs text-[color:var(--muted)] mt-1 line-clamp-2">
                  {c.snippet}
                </div>
                <div className="text-xs text-[color:var(--muted)] mt-1 truncate">
                  {c.url}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={18} className="text-[color:var(--accent)]" />
          <h2 className="text-lg font-semibold">Suggested tech stack</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <StackRow label="Frontend" items={report.techStack.frontend} />
          <StackRow label="Backend" items={report.techStack.backend} />
          <StackRow label="Database" items={report.techStack.database} />
          {report.techStack.ai_ml && report.techStack.ai_ml.length > 0 && (
            <StackRow label="AI / ML" items={report.techStack.ai_ml} />
          )}
          <StackRow label="Infra" items={report.techStack.infra} />
          <StackRow
            label="Key libraries"
            items={report.techStack.keyLibraries}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Map size={18} className="text-[color:var(--accent)]" />
          <h2 className="text-lg font-semibold">Build roadmap</h2>
        </div>
        <ol className="space-y-3">
          {report.roadmap.map((step, i) => (
            <li key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] text-sm font-semibold grid place-items-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  {step.title}
                  <span className="text-xs text-[color:var(--muted)] font-normal">
                    · {step.estimate}
                  </span>
                </div>
                <div className="text-sm text-[color:var(--muted)]">
                  {step.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h2 className="text-lg font-semibold mb-3">MVP scope</h2>
        <p className="text-xs text-[color:var(--muted)] mb-3">
          Build only these for v1. Add nothing else until real users ask for it.
        </p>
        <ul className="space-y-2 text-sm">
          {report.mvpScope.map((m, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[color:var(--accent)] mt-0.5">□</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center text-xs text-[color:var(--muted)] pt-4">
        Based on your idea: &ldquo;{ideaSummary}&rdquo;
      </div>
    </div>
  );
}

function StackRow({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-md bg-[color:var(--background)] border border-[color:var(--border)] px-2 py-0.5 text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Globe({ size, className }: { size: number; className?: string }) {
  // tiny inline to avoid extra import weight — reuse lucide actually
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 0 20" />
      <path d="M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  );
}
