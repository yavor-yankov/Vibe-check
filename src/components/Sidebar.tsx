"use client";

import { GitCompareArrows, Menu, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import type { Session } from "@/lib/types";
import UserBadge from "./UserBadge";
import UsageBadge from "./UsageBadge";

interface SidebarProps {
  sessions: Session[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCompare?: (ids: string[]) => void;
  /** Mobile only — controls whether the drawer is open. */
  isOpen?: boolean;
  /** Mobile only — called when the overlay or close button is clicked. */
  onClose?: () => void;
  /** Mobile only — called when the hamburger button is clicked. */
  onOpen?: () => void;
  /**
   * Increment to trigger a UsageBadge re-fetch (e.g. after a vibe check
   * is consumed so the quota display stays accurate).
   */
  usageRefreshSignal?: number;
}

type VerdictFilter = "all" | "build_it" | "iterate" | "rethink" | "skip" | "in_progress";

const VERDICT_LABELS: Record<VerdictFilter, string> = {
  all: "All",
  build_it: "Build",
  iterate: "Iterate",
  rethink: "Rethink",
  skip: "Skip",
  in_progress: "In progress",
};

const VERDICT_ICONS: Record<VerdictFilter, string> = {
  all: "",
  build_it: "\u2705 ",
  iterate: "\uD83D\uDD04 ",
  rethink: "\uD83E\uDD14 ",
  skip: "\u274C ",
  in_progress: "\u23F3 ",
};

function relative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Sidebar({
  sessions,
  activeId,
  onNew,
  onSelect,
  onDelete,
  onCompare,
  isOpen = false,
  onClose,
  onOpen,
  usageRefreshSignal,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("all");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const compareMode = compareIds.size > 0;

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose?.(); // close drawer on mobile after selecting a session
  };

  const handleNew = () => {
    onNew();
    onClose?.();
  };

  /** Filtered + searched sessions list */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      // Search filter
      if (q && !s.title.toLowerCase().includes(q)) return false;
      // Verdict filter
      if (verdictFilter !== "all") {
        if (verdictFilter === "in_progress") {
          return !s.report;
        }
        return s.report?.verdict === verdictFilter;
      }
      return true;
    });
  }, [sessions, query, verdictFilter]);

  // Only show filter chips when there are enough sessions to warrant it.
  const showFilters = sessions.length > 3;

  // Count sessions per verdict for filter chip badges.
  const counts = useMemo(() => {
    const c: Record<VerdictFilter, number> = {
      all: sessions.length,
      build_it: 0,
      iterate: 0,
      rethink: 0,
      skip: 0,
      in_progress: 0,
    };
    for (const s of sessions) {
      if (!s.report) {
        c.in_progress++;
      } else {
        const v = s.report.verdict as VerdictFilter;
        if (v in c) c[v]++;
      }
    }
    return c;
  }, [sessions]);

  return (
    <>
      {/* Mobile overlay — shown when drawer is open on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          // Base styles (apply at all sizes)
          "w-72 shrink-0 border-r border-[color:var(--border)] bg-[color:var(--card)]",
          "flex flex-col h-screen",
          // Desktop: always-visible sticky column
          "md:sticky md:top-0",
          // Mobile: fixed slide-in drawer, z-index above overlay
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // On md+, override the mobile transform — always show
          "md:translate-x-0 md:relative md:z-auto",
        ].join(" ")}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-2 border-b border-[color:var(--border)]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition"
            title="Go to dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-[color:var(--accent)] flex items-center justify-center text-white shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold leading-tight">Vibe Check</div>
              <div className="text-xs text-[color:var(--muted)] leading-tight">
                Pressure-test your app idea
              </div>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-[color:var(--border)] transition text-[color:var(--muted)]"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={handleNew}
          className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-lg bg-[color:var(--accent)] text-white py-2.5 px-4 text-sm font-medium hover:brightness-110 transition"
        >
          <Plus size={16} />
          New vibe check
        </button>

        {/* Compare mode toggle */}
        {sessions.filter((s) => s.report).length >= 2 && (
          <div className="mx-4 mt-2 flex items-center gap-2">
            {compareMode ? (
              <>
                <button
                  onClick={() => {
                    if (compareIds.size >= 2 && onCompare) {
                      onCompare(Array.from(compareIds));
                      setCompareIds(new Set());
                    }
                  }}
                  disabled={compareIds.size < 2}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[color:var(--accent)] text-white py-2 px-3 text-xs font-medium hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <GitCompareArrows size={14} />
                  Compare {compareIds.size} ideas
                </button>
                <button
                  onClick={() => setCompareIds(new Set())}
                  className="rounded-lg border border-[color:var(--border)] py-2 px-3 text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setCompareIds(new Set())}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] py-2 px-3 text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[color:var(--accent)] transition"
              >
                <GitCompareArrows size={13} />
                Compare ideas
              </button>
            )}
          </div>
        )}

        {/* ── Idea Library search + filters ── */}
        <div className="px-3 pt-4 pb-2 space-y-2">
          {/* Search box */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)] pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Verdict filter chips — only shown when there's enough data */}
          {showFilters && (
            <div className="flex flex-wrap gap-1">
              {(["all", "build_it", "iterate", "rethink", "skip", "in_progress"] as VerdictFilter[])
                .filter((v) => v === "all" || counts[v] > 0)
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVerdictFilter(v === verdictFilter ? "all" : v)}
                    aria-label={v === "all" ? `Show all ${counts.all} sessions` : `Filter by ${VERDICT_LABELS[v]}, ${counts[v]} sessions`}
                    aria-pressed={verdictFilter === v}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                      verdictFilter === v
                        ? "bg-[color:var(--accent)] text-white border-[color:var(--accent)]"
                        : "border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
                    }`}
                  >
                    <span aria-hidden="true">{VERDICT_ICONS[v]}</span>
                    {VERDICT_LABELS[v]}
                    {v !== "all" && (
                      <span className="ml-1 opacity-70">{counts[v]}</span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {sessions.length === 0 ? (
            <div className="px-3 py-6 text-sm text-[color:var(--muted)] text-center">
              No sessions yet. Start your first vibe check above.
            </div>
          ) : visible.length === 0 ? (
            <div className="px-3 py-6 text-sm text-[color:var(--muted)] text-center">
              No sessions match
              {query ? ` "${query}"` : ""}{verdictFilter !== "all" ? ` with verdict "${VERDICT_LABELS[verdictFilter]}"` : ""}.
            </div>
          ) : (
            <ul className="space-y-1">
              {visible.map((s) => (
                <li key={s.id}>
                  <div
                    className={`group flex items-start gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${
                      compareIds.has(s.id)
                        ? "bg-[color:var(--accent)]/5 border border-[color:var(--accent)]/30"
                        : s.id === activeId
                          ? "bg-[color:var(--background)] border border-[color:var(--border)]"
                          : "hover:bg-[color:var(--background)]"
                    }`}
                    onClick={() => {
                      if (compareMode && s.report) {
                        setCompareIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else if (next.size < 4) next.add(s.id);
                          return next;
                        });
                      } else {
                        handleSelect(s.id);
                      }
                    }}
                  >
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={compareIds.has(s.id)}
                        disabled={!s.report}
                        readOnly
                        className="mt-1 shrink-0 accent-[color:var(--accent)]"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {s.title || "Untitled"}
                      </div>
                      <div className="text-xs text-[color:var(--muted)] flex items-center gap-2">
                        <span>{relative(s.updatedAt)}</span>
                        {s.report ? (
                          <span className="inline-flex items-center gap-1">
                            · <b>{s.report.scores.overall}/10</b>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 capitalize">
                            · {s.stage}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this session?")) onDelete(s.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[color:var(--muted)] hover:text-[color:var(--bad)] transition"
                      aria-label="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <UsageBadge
          className="p-3 border-t border-[color:var(--border)]"
          refreshSignal={usageRefreshSignal}
        />
        <UserBadge className="p-3 border-t border-[color:var(--border)]" />

        <div className="px-4 py-3 border-t border-[color:var(--border)] text-[11px] text-[color:var(--muted)] leading-tight">
          Powered by Gemini &amp; Tavily.
        </div>
      </aside>

      {/* Mobile hamburger toggle — visible only on small screens when sidebar is closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open sidebar"
          className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-lg bg-[color:var(--card)] border border-[color:var(--border)] shadow-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
        >
          <Menu size={18} />
        </button>
      )}
    </>
  );
}
