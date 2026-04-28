"use client";

import {
  AlertTriangle,
  ArrowUp,
  AtSign,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Layers,
  Mail,
  Map,
  Pencil,
  RotateCcw,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisReport, Competitor, NameSuggestion, Persona, RedTeamReport } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import InsightsPanel from "./InsightsPanel";

interface ReportStageProps {
  sessionId: string;
  report: AnalysisReport;
  competitors: Competitor[];
  ideaSummary: string;
  redTeamReport?: RedTeamReport | null;
  isRedTeamLoading?: boolean;
  redTeamError?: string | null;
  personas?: Persona[] | null;
  isPersonasLoading?: boolean;
  personasError?: string | null;
  nameSuggestions?: NameSuggestion[] | null;
  isNamesLoading?: boolean;
  namesError?: string | null;
  onRestart: () => void;
  onRefine: (newSummary: string) => void;
  onRedTeam: () => void;
  onPersonas: () => void;
  onNames: () => void;
}

const VERDICT_STYLES: Record<
  AnalysisReport["verdict"],
  { bg: string; text: string; labelKey: string }
> = {
  build_it: {
    bg: "bg-[color:var(--good)]",
    text: "text-white",
    labelKey: "report.verdictBuildIt",
  },
  iterate: {
    bg: "bg-[color:var(--warn)]",
    text: "text-white",
    labelKey: "report.verdictIterate",
  },
  rethink: {
    bg: "bg-[color:var(--bad)]",
    text: "text-white",
    labelKey: "report.verdictRethink",
  },
  skip: { bg: "bg-[color:var(--bad)]", text: "text-white", labelKey: "report.verdictSkip" },
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

// ---------------------------------------------------------------------------
// Word-level diff utility (no external dependency)
// ---------------------------------------------------------------------------

type DiffChunk =
  | { type: "equal"; text: string }
  | { type: "add"; text: string }
  | { type: "remove"; text: string };

/**
 * Myers-inspired O(n) word diff. Splits on whitespace so we compare words
 * rather than characters — produces a more readable result for prose edits.
 */
function wordDiff(original: string, revised: string): DiffChunk[] {
  const a = original.split(/(\s+)/);
  const b = revised.split(/(\s+)/);

  // LCS-based diff via dynamic programming
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const chunks: DiffChunk[] = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) {
      chunks.push({ type: "equal", text: a[i] });
      i++;
      j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      chunks.push({ type: "add", text: b[j] });
      j++;
    } else {
      chunks.push({ type: "remove", text: a[i] });
      i++;
    }
  }

  // Merge consecutive same-type chunks for cleaner rendering.
  const merged: DiffChunk[] = [];
  for (const chunk of chunks) {
    const last = merged[merged.length - 1];
    if (last && last.type === chunk.type) {
      last.text += chunk.text;
    } else {
      merged.push({ ...chunk });
    }
  }
  return merged;
}

/**
 * Renders a word-level diff between `original` and `revised`.
 * - Green background + underline → additions
 * - Red background + strikethrough → deletions
 * - Plain text → unchanged
 *
 * Hidden when the two strings are identical (nothing to show).
 */
function WordDiff({
  original,
  revised,
  diffLabel,
}: {
  original: string;
  revised: string;
  diffLabel: string;
}) {
  if (!original || !revised || original.trim() === revised.trim()) return null;

  const chunks = wordDiff(original.trim(), revised.trim());
  const hasChanges = chunks.some((c) => c.type !== "equal");
  if (!hasChanges) return null;

  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2.5 text-sm leading-relaxed">
      <div className="text-xs text-[color:var(--muted)] mb-2 font-medium uppercase tracking-wider">
        {diffLabel}
      </div>
      <p className="text-[color:var(--foreground)] whitespace-pre-wrap break-words">
        {chunks.map((chunk, i) => {
          if (chunk.type === "equal") {
            return <span key={i}>{chunk.text}</span>;
          }
          if (chunk.type === "add") {
            return (
              <span
                key={i}
                className="bg-green-500/15 text-green-700 dark:text-green-400 underline decoration-green-500/60 rounded-sm"
              >
                {chunk.text}
              </span>
            );
          }
          // remove
          return (
            <span
              key={i}
              className="bg-red-500/15 text-red-700 dark:text-red-400 line-through decoration-red-500/60 rounded-sm"
            >
              {chunk.text}
            </span>
          );
        })}
      </p>
    </div>
  );
}

export default function ReportStage({
  sessionId,
  report,
  competitors,
  ideaSummary,
  redTeamReport,
  isRedTeamLoading,
  redTeamError,
  personas,
  isPersonasLoading,
  personasError,
  nameSuggestions,
  isNamesLoading,
  namesError,
  onRestart,
  onRefine,
  onRedTeam,
  onPersonas,
  onNames,
}: ReportStageProps) {
  const { t } = useTranslation();
  const verdictStyle = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES.iterate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verdictLabel = t(verdictStyle.labelKey as any);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineDraft, setRefineDraft] = useState(ideaSummary);
  const [redTeamOpen, setRedTeamOpen] = useState(false);
  const [personasOpen, setPersonasOpen] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Track scroll position to show/hide the scroll-to-top button.
  // The scroll container is the report's parent in the dashboard layout;
  // we find it once via the ref callback and attach a passive listener.
  const reportTopRef = useRef<HTMLDivElement>(null);

  const findScrollParent = useCallback((node: HTMLElement | null): HTMLElement | null => {
    let el = node?.parentElement;
    while (el) {
      const { overflow, overflowY } = getComputedStyle(el);
      if (/(auto|scroll)/.test(overflow + overflowY)) return el;
      el = el.parentElement;
    }
    return null;
  }, []);

  useEffect(() => {
    const container = findScrollParent(reportTopRef.current);
    if (!container) return;
    scrollContainerRef.current = container;
    function handleScroll() {
      setShowScrollTop((container!.scrollTop ?? 0) > 400);
    }
    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [findScrollParent]);

  function scrollToTop() {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleExportPdf() {
    const original = document.title;
    document.title = `Vibe Check — ${report.verdictLabel}`;
    window.print();
    document.title = original;
  }

  function handleExportMarkdown() {
    const lines: string[] = [];
    lines.push(`# Vibe Check Report: ${report.verdictLabel}\n`);
    lines.push(`> ${report.summary}\n`);
    lines.push(`**Verdict:** ${verdictLabel}\n`);

    lines.push(`## Scores\n`);
    lines.push(`| Dimension | Score |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Overall | ${report.scores.overall}/10 |`);
    lines.push(`| Viability | ${report.scores.viability}/10 |`);
    lines.push(`| Problem | ${report.scores.problem}/10 |`);
    lines.push(`| Niche | ${report.scores.niche}/10 |`);
    lines.push(`| Differentiation | ${report.scores.differentiation}/10 |\n`);

    if (report.strengths.length > 0) {
      lines.push(`## Strengths\n`);
      report.strengths.forEach((s) => lines.push(`- ${s}`));
      lines.push("");
    }
    if (report.risks.length > 0) {
      lines.push(`## Risks\n`);
      report.risks.forEach((r) => lines.push(`- ${r}`));
      lines.push("");
    }
    if (report.uniqueAngles?.length > 0) {
      lines.push(`## Unique Angles\n`);
      report.uniqueAngles.forEach((a) => lines.push(`- ${a}`));
      lines.push("");
    }

    if (competitors.length > 0) {
      lines.push(`## Competitors Found\n`);
      competitors.forEach((c) => {
        lines.push(`- **${c.title}** — [${c.url}](${c.url})`);
        if (c.snippet) lines.push(`  ${c.snippet.slice(0, 200)}`);
      });
      lines.push("");
    }

    lines.push(`## Tech Stack\n`);
    const ts = report.techStack;
    if (ts.frontend?.length) lines.push(`- **Frontend:** ${ts.frontend.join(", ")}`);
    if (ts.backend?.length) lines.push(`- **Backend:** ${ts.backend.join(", ")}`);
    if (ts.database?.length) lines.push(`- **Database:** ${ts.database.join(", ")}`);
    if (ts.ai_ml?.length) lines.push(`- **AI/ML:** ${ts.ai_ml.join(", ")}`);
    if (ts.infra?.length) lines.push(`- **Infra:** ${ts.infra.join(", ")}`);
    if (ts.keyLibraries?.length) lines.push(`- **Libraries:** ${ts.keyLibraries.join(", ")}`);
    lines.push("");

    if (report.roadmap?.length > 0) {
      lines.push(`## Build Roadmap\n`);
      report.roadmap.forEach((step, i) => {
        lines.push(`${i + 1}. **${step.title}** (${step.estimate})`);
        lines.push(`   ${step.detail}`);
      });
      lines.push("");
    }

    if (report.mvpScope?.length > 0) {
      lines.push(`## MVP Scope\n`);
      report.mvpScope.forEach((f) => lines.push(`- [ ] ${f}`));
      lines.push("");
    }

    if (redTeamReport) {
      lines.push(`## Devil's Advocate\n`);
      lines.push(`**Verdict:** ${redTeamReport.verdict}\n`);
      if (redTeamReport.reasons?.length) {
        lines.push(`### Reasons Not to Build\n`);
        redTeamReport.reasons.forEach((r) => lines.push(`- ${r}`));
        lines.push("");
      }
      if (redTeamReport.silentKillers?.length) {
        lines.push(`### Silent Killers\n`);
        redTeamReport.silentKillers.forEach((s) => lines.push(`- ${s}`));
        lines.push("");
      }
    }

    lines.push(`---\n*Generated by [Vibe Check](https://vibecheck.app)*`);

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibe-check-${report.verdict}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleEmailReport() {
    setEmailStatus("sending");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/email`, { method: "POST" });
      if (!res.ok) throw new Error();
      setEmailStatus("sent");
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch {
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  }

  function submitRefine() {
    const trimmed = refineDraft.trim();
    if (!trimmed || trimmed === ideaSummary.trim()) return;
    setRefineOpen(false);
    onRefine(trimmed);
  }

  function handleRedTeamClick() {
    // Only fire when we're about to *open* the panel with no cached/in-flight
    // result. Closing (redTeamOpen === true) must never re-fire, and after an
    // error the user should be able to retry by re-opening the panel.
    if (!redTeamReport && !isRedTeamLoading && !redTeamOpen) {
      onRedTeam();
    }
    setRedTeamOpen((v) => !v);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 fade-in-up space-y-8 pb-24">
      <div ref={reportTopRef} className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-[color:var(--accent)] font-medium mb-2">
            {t("report.header")}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {report.verdictLabel}
          </h1>
          <p className="text-[color:var(--muted)] max-w-2xl">{report.summary}</p>
        </div>
      </div>

      {refineOpen && (
        <section className="rounded-xl border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/5 p-5 space-y-3">
          <div className="text-sm font-medium">{t("report.refineHeading")}</div>
          <div className="text-xs text-[color:var(--muted)]">
            {t("report.refineDescription")}
          </div>
          <textarea
            value={refineDraft}
            onChange={(e) => setRefineDraft(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20"
          />
          {/* Live diff preview — shows what changed vs. the original pitch */}
          <WordDiff original={ideaSummary} revised={refineDraft} diffLabel={t("report.diffPreviewLabel")} />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setRefineOpen(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
            >
              {t("report.refineCancel")}
            </button>
            <button
              onClick={submitRefine}
              disabled={
                !refineDraft.trim() ||
                refineDraft.trim() === ideaSummary.trim()
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] text-white px-4 py-1.5 text-sm font-medium hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={14} />
              {t("report.refineSubmit")}
            </button>
          </div>
        </section>
      )}

      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${verdictStyle.bg} ${verdictStyle.text}`}
      >
        <Sparkles size={14} />
        {t("report.verdictPrefix", { verdict: verdictLabel })}
      </div>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-[color:var(--accent)]" />
          <h2 className="text-lg font-semibold">{t("report.scoresHeading")}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ScoreRing value={report.scores.overall} label={t("report.scoreOverall")} />
          <ScoreRing value={report.scores.viability} label={t("report.scoreViability")} />
          <ScoreRing value={report.scores.problem} label={t("report.scoreProblem")} />
          <ScoreRing value={report.scores.niche} label={t("report.scoreNiche")} />
          <ScoreRing
            value={report.scores.differentiation}
            label={t("report.scoreDifferentiation")}
          />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-[color:var(--good)]" />
            <h2 className="text-lg font-semibold">{t("report.strengthsHeading")}</h2>
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
            <h2 className="text-lg font-semibold">{t("report.risksHeading")}</h2>
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
            <h2 className="text-lg font-semibold">{t("report.uniqueAnglesHeading")}</h2>
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

      {report.insights && <InsightsPanel insights={report.insights} />}

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-[color:var(--accent)]" />
          <h2 className="text-lg font-semibold">
            {t("report.competitorsHeading")}{" "}
            <span className="text-[color:var(--muted)] font-normal text-sm">
              ({competitors.length})
            </span>
          </h2>
        </div>
        {competitors.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            {t("report.competitorsNone")}
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
          <h2 className="text-lg font-semibold">{t("report.techStackHeading")}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <StackRow label={t("report.techFrontend")} items={report.techStack.frontend} />
          <StackRow label={t("report.techBackend")} items={report.techStack.backend} />
          <StackRow label={t("report.techDatabase")} items={report.techStack.database} />
          {report.techStack.ai_ml && report.techStack.ai_ml.length > 0 && (
            <StackRow label={t("report.techAiMl")} items={report.techStack.ai_ml} />
          )}
          <StackRow label={t("report.techInfra")} items={report.techStack.infra} />
          <StackRow
            label={t("report.techKeyLibraries")}
            items={report.techStack.keyLibraries}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Map size={18} className="text-[color:var(--accent)]" />
          <h2 className="text-lg font-semibold">{t("report.roadmapHeading")}</h2>
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
        <h2 className="text-lg font-semibold mb-3">{t("report.mvpHeading")}</h2>
        <p className="text-xs text-[color:var(--muted)] mb-3">
          {t("report.mvpDescription")}
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

      <section className="rounded-xl border border-[color:var(--bad)]/30 bg-[color:var(--bad)]/5 p-6">
        <button
          type="button"
          onClick={handleRedTeamClick}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-[color:var(--bad)]" />
            <h2 className="text-lg font-semibold">{t("report.devilsAdvocateHeading")}</h2>
            <span className="text-xs text-[color:var(--muted)] font-normal">
              {t("report.devilsAdvocateSubtitle")}
            </span>
          </div>
          {redTeamOpen ? (
            <ChevronUp size={18} className="text-[color:var(--muted)]" />
          ) : (
            <ChevronDown size={18} className="text-[color:var(--muted)]" />
          )}
        </button>

        {redTeamOpen && (
          <div className="mt-4 space-y-4">
            {isRedTeamLoading && (
              <div className="space-y-4 mt-1">
                {/* Verdict placeholder */}
                <div className="rounded-lg border border-[color:var(--bad)]/20 bg-[color:var(--background)] p-4 space-y-2">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-4 w-3/4" style={{ animationDelay: "0.1s" }} />
                </div>
                {/* Reasons not to build */}
                <div className="space-y-2">
                  <div className="skeleton h-3 w-32 mb-1" />
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="skeleton-circle w-3 h-3 mt-0.5 shrink-0" style={{ animationDelay: `${i * 0.1}s` }} />
                      <div className="skeleton h-3 flex-1" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
                    </div>
                  ))}
                </div>
                {/* Silent killers */}
                <div className="space-y-2">
                  <div className="skeleton h-3 w-24 mb-1" style={{ animationDelay: "0.05s" }} />
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="skeleton-circle w-3 h-3 mt-0.5 shrink-0" style={{ animationDelay: `${i * 0.1 + 0.3}s` }} />
                      <div className="skeleton h-3 flex-1" style={{ animationDelay: `${i * 0.1 + 0.35}s` }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {redTeamError && (
              <div className="text-sm text-[color:var(--bad)]">
                {redTeamError}
              </div>
            )}
            {redTeamReport && (
              <>
                <div className="rounded-lg border border-[color:var(--bad)]/30 bg-[color:var(--background)] p-4">
                  <div className="text-xs uppercase tracking-wider text-[color:var(--bad)] font-medium mb-1">
                    {t("report.redTeamVerdictLabel")}
                  </div>
                  <div className="text-sm font-medium">
                    {redTeamReport.verdict}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-2">
                    {t("report.redTeamReasonsLabel")}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {redTeamReport.reasons.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[color:var(--bad)] mt-0.5">×</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium mb-2">
                    {t("report.redTeamSilentKillersLabel")}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {redTeamReport.silentKillers.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[color:var(--warn)] mt-0.5">
                          ⚠
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Customer Persona Simulation ── */}
      <section className="rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/3 p-6">
        <button
          type="button"
          onClick={() => {
            if (!personas && !isPersonasLoading) onPersonas();
            setPersonasOpen((v) => !v);
          }}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[color:var(--accent)]" />
            <h2 className="text-lg font-semibold">{t("report.personasHeading")}</h2>
            <span className="text-xs text-[color:var(--muted)] font-normal">
              {t("report.personasSubtitle")}
            </span>
          </div>
          {personasOpen ? (
            <ChevronUp size={18} className="text-[color:var(--muted)]" />
          ) : (
            <ChevronDown size={18} className="text-[color:var(--muted)]" />
          )}
        </button>

        {personasOpen && (
          <div className="mt-4 space-y-3">
            {isPersonasLoading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4 space-y-2">
                    <div className="flex gap-3">
                      <div className="skeleton-circle w-10 h-10 shrink-0" style={{ animationDelay: `${i * 0.1}s` }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-32" style={{ animationDelay: `${i * 0.1}s` }} />
                        <div className="skeleton h-2.5 w-48" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
                      </div>
                    </div>
                    <div className="skeleton h-3 w-full" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
                    <div className="skeleton h-3 w-4/5" style={{ animationDelay: `${i * 0.1 + 0.15}s` }} />
                  </div>
                ))}
              </div>
            )}
            {personasError && (
              <div className="text-sm text-[color:var(--bad)]">{personasError}</div>
            )}
            {personas && personas.length > 0 && (
              <div className="space-y-3">
                {personas.map((p, i) => (
                  <div key={i} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[color:var(--accent)]/10 flex items-center justify-center text-sm font-semibold text-[color:var(--accent)] shrink-0">
                        {p.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{p.name}, {p.age}</div>
                        <div className="text-xs text-[color:var(--muted)]">{p.role}</div>
                      </div>
                    </div>
                    <blockquote className="text-sm italic text-[color:var(--foreground)] border-l-2 border-[color:var(--accent)] pl-3 mb-2">
                      &ldquo;{p.quote}&rdquo;
                    </blockquote>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-[color:var(--good)]">{t("report.personaWillingnessToPay")}</span>{" "}
                        <span className="text-[color:var(--muted)]">{p.willingnessToPay}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[color:var(--bad)]">{t("report.personaObjection")}</span>{" "}
                        <span className="text-[color:var(--muted)]">{p.objection}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Name & Domain Suggestions ── */}
      <section className="rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/3 p-6">
        <button
          type="button"
          onClick={() => {
            if (!nameSuggestions && !isNamesLoading) onNames();
            setNamesOpen((v) => !v);
          }}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2">
            <AtSign size={18} className="text-[color:var(--accent)]" />
            <h2 className="text-lg font-semibold">{t("report.namesHeading")}</h2>
            <span className="text-xs text-[color:var(--muted)] font-normal">
              {t("report.namesSubtitle")}
            </span>
          </div>
          {namesOpen ? (
            <ChevronUp size={18} className="text-[color:var(--muted)]" />
          ) : (
            <ChevronDown size={18} className="text-[color:var(--muted)]" />
          )}
        </button>

        {namesOpen && (
          <div className="mt-4 space-y-2">
            {isNamesLoading && (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                    <div className="skeleton h-4 w-24" style={{ animationDelay: `${i * 0.08}s` }} />
                    <div className="skeleton h-3 w-32" style={{ animationDelay: `${i * 0.08 + 0.04}s` }} />
                    <div className="skeleton-circle w-5 h-5 ml-auto" style={{ animationDelay: `${i * 0.08 + 0.08}s` }} />
                  </div>
                ))}
              </div>
            )}
            {namesError && (
              <div className="text-sm text-[color:var(--bad)]">{namesError}</div>
            )}
            {nameSuggestions && nameSuggestions.length > 0 && (
              <div className="space-y-2">
                {nameSuggestions.map((n) => (
                  <div key={n.domain} className="flex items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                    <div className="font-semibold text-sm">{n.name}</div>
                    <div className="text-xs text-[color:var(--muted)] font-mono">{n.domain}</div>
                    <div className="text-xs text-[color:var(--muted)] flex-1 truncate italic">{n.tagline}</div>
                    <div className="shrink-0">
                      {n.available === true && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[color:var(--good)]/10 text-[color:var(--good)]">{t("report.nameDomainAvailable")}</span>
                      )}
                      {n.available === false && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[color:var(--bad)]/10 text-[color:var(--bad)]">{t("report.nameDomainTaken")}</span>
                      )}
                      {n.available === null && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[color:var(--border)] text-[color:var(--muted)]">{t("report.nameDomainUnknown")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="text-center text-xs text-[color:var(--muted)] pt-4">
        {t("report.basedOnIdea", { ideaSummary })}
      </div>

      {/* ── Sticky floating action bar ── */}
      <div className="print:hidden fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto px-6 pb-4 flex items-end justify-between">
          {/* Scroll-to-top — left side */}
          <div>
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Scroll to top"
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[color:var(--card)] border border-[color:var(--border)] shadow-lg px-3 py-2 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--background)] transition"
              >
                <ArrowUp size={14} />
                {t("report.scrollTop")}
              </button>
            )}
          </div>

          {/* Action buttons — right side */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-[color:var(--card)] border border-[color:var(--border)] shadow-lg px-2 py-1.5">
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-[color:var(--background)] transition"
              title={t("report.exportPdfTooltip")}
            >
              <Download size={13} />
              {t("report.exportPdf")}
            </button>
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-[color:var(--background)] transition"
              title={t("report.exportMdTooltip")}
            >
              <FileText size={13} />
              {t("report.exportMd")}
            </button>
            <button
              onClick={handleEmailReport}
              disabled={emailStatus === "sending"}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                emailStatus === "sending"
                  ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)] animate-pulse"
                  : emailStatus === "sent"
                    ? "bg-[color:var(--good)]/10 text-[color:var(--good)]"
                    : emailStatus === "error"
                      ? "bg-[color:var(--bad)]/10 text-[color:var(--bad)]"
                      : "hover:bg-[color:var(--background)]",
              ].join(" ")}
              title={t("report.emailTooltip")}
            >
              <Mail size={13} />
              {emailStatus === "sending" ? t("report.emailSending") : emailStatus === "sent" ? t("report.emailSent") : emailStatus === "error" ? t("report.emailFailed") : t("report.emailButton")}
            </button>
            <div className="w-px h-5 bg-[color:var(--border)]" />
            <button
              onClick={() => {
                setRefineDraft(ideaSummary);
                setRefineOpen((v) => !v);
                scrollToTop();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-[color:var(--background)] transition"
              title={t("report.refineTooltip")}
            >
              <Pencil size={13} />
              {t("report.refineButton")}
            </button>
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-[color:var(--background)] transition"
              title={t("report.newTooltip")}
            >
              <RotateCcw size={13} />
              {t("report.newButton")}
            </button>
          </div>
        </div>
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
