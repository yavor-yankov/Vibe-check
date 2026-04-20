"use client";

/**
 * ReportSkeleton — shown when stage === "report" but report data hasn't arrived yet.
 * Mirrors the exact layout of ReportStage so the transition feels instant.
 */
export default function ReportSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 fade-in-up space-y-8">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-full max-w-lg" />
          <div className="skeleton h-4 w-4/5 max-w-md" style={{ animationDelay: "0.1s" }} />
        </div>
        {/* Button skeletons */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="skeleton h-8 w-24 rounded-lg" />
          <div className="skeleton h-8 w-28 rounded-lg" style={{ animationDelay: "0.08s" }} />
          <div className="skeleton h-8 w-24 rounded-lg" style={{ animationDelay: "0.16s" }} />
        </div>
      </div>

      {/* Verdict pill */}
      <div className="skeleton h-8 w-32 rounded-full" />

      {/* Scores */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <div className="skeleton h-4 w-20 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="skeleton-circle w-20 h-20"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
              <div className="skeleton h-2.5 w-14" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Strengths / Risks grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {["Strengths", "Risks"].map((_, ci) => (
          <div
            key={ci}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 space-y-3"
          >
            <div className="skeleton h-4 w-24" style={{ animationDelay: `${ci * 0.05}s` }} />
            {[...Array(3)].map((__, li) => (
              <div key={li} className="flex gap-2 items-start">
                <div className="skeleton-circle w-3 h-3 mt-1 shrink-0" style={{ animationDelay: `${(ci * 3 + li) * 0.07}s` }} />
                <div className="skeleton h-3 flex-1" style={{ animationDelay: `${(ci * 3 + li) * 0.07 + 0.04}s`, width: `${70 + (li % 3) * 10}%` }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Unique angles */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 space-y-3">
        <div className="skeleton h-4 w-40" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton h-3" style={{ animationDelay: `${i * 0.1}s`, width: `${80 - i * 15}%` }} />
        ))}
      </div>

      {/* Competitors */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 space-y-3">
        <div className="skeleton h-4 w-48 mb-2" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[color:var(--border)] p-3 space-y-1.5">
            <div className="skeleton h-3 w-2/5" style={{ animationDelay: `${i * 0.1}s` }} />
            <div className="skeleton h-2.5 w-full opacity-60" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 space-y-3">
        <div className="skeleton h-4 w-36 mb-2" />
        <div className="grid md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-3" style={{ animationDelay: `${i * 0.08}s`, width: `${60 + (i % 2) * 20}%` }} />
          ))}
        </div>
      </div>

      {/* Devil's advocate collapsed bar */}
      <div className="rounded-xl border border-[color:var(--bad)]/20 bg-[color:var(--bad)]/3 p-5">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-4 w-4 rounded" />
        </div>
      </div>
    </div>
  );
}
