"use client";

import { ArrowLeft, Sparkles, Target } from "lucide-react";
import type { Session } from "@/lib/types";

interface CompareViewProps {
  sessions: Session[];
  onClose: () => void;
}

const VERDICT_COLORS: Record<string, string> = {
  build_it: "text-[color:var(--good)]",
  iterate: "text-[color:var(--warn)]",
  rethink: "text-[color:var(--bad)]",
  skip: "text-[color:var(--bad)]",
};

function scoreBar(value: number) {
  const pct = Math.max(0, Math.min(100, value * 10));
  const color =
    value >= 7.5 ? "var(--good)" : value >= 5 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-[color:var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-7 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function CompareView({ sessions, onClose }: CompareViewProps) {
  const compared = sessions.filter((s) => s.report);

  if (compared.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center fade-in-up">
        <p className="text-[color:var(--muted)]">
          Select at least 2 completed sessions to compare.
        </p>
        <button
          onClick={onClose}
          className="mt-4 inline-flex items-center gap-2 text-sm text-[color:var(--accent)] hover:underline"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[color:var(--card)] transition text-[color:var(--muted)]"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Compare ideas
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            {compared.length} sessions side by side
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)]">
              <th className="text-left py-3 pr-4 text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium w-32">
                Dimension
              </th>
              {compared.map((s) => (
                <th
                  key={s.id}
                  className="text-left py-3 px-3 font-medium truncate max-w-[200px]"
                  title={s.title}
                >
                  {s.title || "Untitled"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Verdict */}
            <tr className="border-b border-[color:var(--border)]">
              <td className="py-3 pr-4 text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium flex items-center gap-1.5">
                <Sparkles size={13} /> Verdict
              </td>
              {compared.map((s) => (
                <td key={s.id} className="py-3 px-3">
                  <span
                    className={`font-semibold ${VERDICT_COLORS[s.report!.verdict] ?? ""}`}
                  >
                    {s.report!.verdictLabel}
                  </span>
                </td>
              ))}
            </tr>

            {/* Scores */}
            {(
              ["overall", "viability", "problem", "niche", "differentiation"] as const
            ).map((dim) => (
              <tr key={dim} className="border-b border-[color:var(--border)]">
                <td className="py-3 pr-4 text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium flex items-center gap-1.5">
                  {dim === "overall" && <Target size={13} />}
                  {dim.charAt(0).toUpperCase() + dim.slice(1)}
                </td>
                {compared.map((s) => (
                  <td key={s.id} className="py-3 px-3 min-w-[160px]">
                    {scoreBar(s.report!.scores[dim])}
                  </td>
                ))}
              </tr>
            ))}

            {/* Top strength */}
            <tr className="border-b border-[color:var(--border)]">
              <td className="py-3 pr-4 text-xs uppercase tracking-wider text-[color:var(--good)] font-medium">
                Top strength
              </td>
              {compared.map((s) => (
                <td
                  key={s.id}
                  className="py-3 px-3 text-xs text-[color:var(--muted)]"
                >
                  {s.report!.strengths[0] ?? "—"}
                </td>
              ))}
            </tr>

            {/* Top risk */}
            <tr className="border-b border-[color:var(--border)]">
              <td className="py-3 pr-4 text-xs uppercase tracking-wider text-[color:var(--bad)] font-medium">
                Top risk
              </td>
              {compared.map((s) => (
                <td
                  key={s.id}
                  className="py-3 px-3 text-xs text-[color:var(--muted)]"
                >
                  {s.report!.risks[0] ?? "—"}
                </td>
              ))}
            </tr>

            {/* Competitors found */}
            <tr>
              <td className="py-3 pr-4 text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium">
                Competitors
              </td>
              {compared.map((s) => (
                <td key={s.id} className="py-3 px-3 text-xs tabular-nums">
                  {s.competitors.length} found
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
