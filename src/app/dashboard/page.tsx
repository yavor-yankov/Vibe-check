"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IntroStage from "@/components/IntroStage";
import InterviewStage, {
  buildAssistantMessage,
  buildUserMessage,
} from "@/components/InterviewStage";
import ScanningStage from "@/components/ScanningStage";
import ReportStage from "@/components/ReportStage";
import ReportSkeleton from "@/components/ReportSkeleton";
import Sidebar from "@/components/Sidebar";
import type {
  AnalysisReport,
  ChatMessage,
  FounderProfile,
  Persona,
  RedTeamReport,
  Session,
} from "@/lib/types";
import { loadSessions as loadLocalSessions, newSession } from "@/lib/storage";
import {
  deleteSessionRemote,
  fetchSessions,
  persistSession,
} from "@/lib/client/sessions-api";

const MIGRATION_FLAG = "vibe-check-migrated-v1";

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [current, setCurrent] = useState<Session | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedTeamLoading, setIsRedTeamLoading] = useState(false);
  const [redTeamError, setRedTeamError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [isPersonasLoading, setIsPersonasLoading] = useState(false);
  const [personasError, setPersonasError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Incrementing this counter signals UsageBadge to re-fetch the quota
  // after each vibe check is consumed.
  const [usageRefreshSignal, setUsageRefreshSignal] = useState(0);

  // Keep a ref to the latest active session so async callbacks don't
  // act on stale closures (e.g. runRedTeam finishing after the user
  // switched sessions or hit "New check").
  const currentRef = useRef<Session | null>(null);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  // Mirrors `sessions` so async callbacks (e.g. runRedTeam returning
  // after a session switch) can find a target session by id without
  // needing a re-fetch from the server.
  const sessionsRef = useRef<Session[]>([]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Per-session write queue. `persistSession` does a non-atomic
  // delete-then-insert on messages/competitors/etc., so two concurrent
  // writes for the same session can interleave and wipe rows from the
  // newer write. Chain every persist for a given session id onto the
  // previous one so they execute strictly in order.
  const persistQueueRef = useRef<Map<string, Promise<unknown>>>(new Map());

  // Hydrate from Postgres on mount. If it's empty and the browser has
  // legacy localStorage sessions, migrate them once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let remote = await fetchSessions();
        // Always try the migration path — it's flag-guarded and persistSession
        // is an idempotent upsert, so re-running won't duplicate. Skipping
        // this when remote is non-empty would strand any half-migrated
        // sessions from a previous failed attempt permanently in localStorage.
        if (!cancelled) {
          const existingIds = new Set(remote.map((s) => s.id));
          const migrated = await migrateLocalStorageIfNeeded(existingIds);
          if (migrated.length > 0) {
            remote = [...remote, ...migrated].sort(
              (a, b) => b.updatedAt - a.updatedAt
            );
          }
        }
        if (cancelled) return;
        setSessions(remote);
        setCurrent(remote[0] ?? newSession());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load sessions");
        setCurrent(newSession());
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Write a session to the sessions list + server. If it matches the
   * currently-active session we also update `current` so the UI reflects
   * the change immediately. For async callbacks that fire after the user
   * has switched to another session (e.g. a slow red-team response), pass
   * `{ updateCurrent: false }` so we don't yank them back.
   */
  const persist = useCallback(
    (s: Session, opts: { updateCurrent?: boolean } = {}) => {
      const { updateCurrent = true } = opts;
      const stamped: Session = { ...s, updatedAt: Date.now() };
      if (updateCurrent) setCurrent(stamped);
      setSessions((prev) => {
        const idx = prev.findIndex((x) => x.id === stamped.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = stamped;
          return next.sort((a, b) => b.updatedAt - a.updatedAt);
        }
        return [stamped, ...prev];
      });
      // Fire server write in the background, but chain it onto any
      // in-flight write for the same session so concurrent calls never
      // interleave inside upsertSessionFull.
      const queue = persistQueueRef.current;
      const prev = queue.get(stamped.id) ?? Promise.resolve();
      const next = prev
        .catch(() => {
          /* previous write's error was already surfaced; don't chain-cancel */
        })
        .then(() => persistSession(stamped))
        .catch((err) => {
          setError(
            err instanceof Error
              ? `Save failed: ${err.message}`
              : "Save failed"
          );
        })
        .finally(() => {
          // Only clear the tail if nothing newer has been chained on.
          if (queue.get(stamped.id) === next) queue.delete(stamped.id);
        });
      queue.set(stamped.id, next);
    },
    []
  );

  const resetRedTeamState = () => {
    setIsRedTeamLoading(false);
    setRedTeamError(null);
  };

  const resetPersonasState = () => {
    setPersonas(null);
    setIsPersonasLoading(false);
    setPersonasError(null);
  };

  const handleNew = () => {
    const s = newSession();
    setCurrent(s);
    setError(null);
    resetRedTeamState();
    resetPersonasState();
  };

  const handleSelect = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (s) {
      setCurrent(s);
      setError(null);
      resetRedTeamState();
      resetPersonasState();
    }
  };

  const handleDelete = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      // Pick the next-current session from the post-delete list inside
      // the updater so we never read a stale `sessions` closure (a
      // background persistSession could have queued an updater that
      // reordered the list before this delete ran).
      if (current?.id === id) {
        setCurrent(next[0] ?? newSession());
        resetRedTeamState();
        resetPersonasState();
      }
      return next;
    });
    // Chain the server DELETE onto any in-flight persist for this id so
    // a queued upsert can't resurrect the session after the DELETE lands.
    const queue = persistQueueRef.current;
    const prev = queue.get(id) ?? Promise.resolve();
    const next = prev
      .catch(() => {
        /* previous write's error was already surfaced */
      })
      .then(() => deleteSessionRemote(id))
      .catch((err) => {
        setError(
          err instanceof Error
            ? `Delete failed: ${err.message}`
            : "Delete failed"
        );
      })
      .finally(() => {
        if (queue.get(id) === next) queue.delete(id);
      });
    queue.set(id, next);
  };

  const startInterview = async (seed: string, founderProfile?: FounderProfile) => {
    if (!current) return;
    setError(null);
    const userMsg = buildUserMessage(seed);
    const next: Session = {
      ...current,
      title: seed.slice(0, 60),
      stage: "interview",
      messages: [userMsg],
      founderProfile,
    };
    persist(next);
    await streamAssistantReply(next);
  };

  const sendInterviewAnswer = async (text: string) => {
    if (!current) return;
    const userMsg = buildUserMessage(text);
    const next: Session = {
      ...current,
      messages: [...current.messages, userMsg],
    };
    persist(next);
    await streamAssistantReply(next);
  };

  const streamAssistantReply = async (sessionWithUser: Session) => {
    setIsStreaming(true);
    setError(null);
    const chatAbort = new AbortController();
    const chatTimeout = setTimeout(() => chatAbort.abort(), 60_000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: sessionWithUser.messages }),
        signal: chatAbort.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(
          `Chat API failed (${res.status}). ${msg || "Check GEMINI_API_KEY."}`
        );
      }
      const assistantMsg = buildAssistantMessage("");
      let working: Session = {
        ...sessionWithUser,
        messages: [...sessionWithUser.messages, assistantMsg],
      };
      setCurrent(working);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const updated: ChatMessage = { ...assistantMsg, content: acc };
        working = {
          ...working,
          messages: [...sessionWithUser.messages, updated],
        };
        setCurrent(working);
      }
      // final persist
      persist(working);

      // Auto-generate a meaningful session title after the FIRST assistant
      // reply. At this point sessionWithUser.messages has exactly 1 entry
      // (the user's seed idea). Fire-and-forget — a failed title call must
      // never break the interview flow.
      if (sessionWithUser.messages.length === 1) {
        const seed = sessionWithUser.messages[0]?.content ?? "";
        void (async () => {
          try {
            const res = await fetch("/api/title", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ seed }),
            });
            if (res.ok) {
              const { title } = (await res.json()) as { title?: string | null };
              if (title) {
                const titled: Session = { ...working, title };
                // Only apply if the user is still on this session.
                setCurrent((prev) =>
                  prev?.id === titled.id ? titled : prev
                );
                setSessions((prev) =>
                  prev.map((s) => (s.id === titled.id ? titled : s))
                );
                persist(titled);
              }
            }
          } catch {
            // Non-fatal — sidebar label stays as seed truncation.
          }
        })();
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        setError("Chat request timed out. Please try again.");
      } else {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
      }
    } finally {
      clearTimeout(chatTimeout);
      setIsStreaming(false);
    }
  };

  const analyze = async (
    scanning: Session,
    revertStage: Session["stage"],
    revertIdeaSummary?: string
  ) => {
    const ideaSummary = scanning.ideaSummary ?? "";
    // 90-second hard cap on the whole scan (search + analyze). If either
    // fetch hangs the user would otherwise see the spinner forever.
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 90_000);
    try {
      // 1. search competitors
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaSummary }),
        signal: abort.signal,
      });
      const searchData = (await searchRes.json()) as {
        competitors?: Session["competitors"];
        error?: string;
      };
      if (!searchRes.ok) {
        throw new Error(searchData.error || "Search failed");
      }
      const competitors = searchData.competitors ?? [];

      // 2. analyze
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: scanning.messages,
          ideaSummary,
          competitors,
          founderProfile: scanning.founderProfile,
        }),
        signal: abort.signal,
      });
      const analyzeData = (await analyzeRes.json()) as {
        report?: AnalysisReport;
        error?: string;
      };
      if (!analyzeRes.ok || !analyzeData.report) {
        throw new Error(analyzeData.error || "Analysis failed");
      }

      clearTimeout(timeout);
      const done: Session = {
        ...scanning,
        stage: "report",
        competitors,
        report: analyzeData.report,
        // Refining invalidates the prior red-team pass — force re-run.
        redTeamReport: null,
        reportGeneration: (scanning.reportGeneration ?? 0) + 1,
      };
      persist(done);
      // Notify the sidebar UsageBadge that a quota slot was consumed.
      setUsageRefreshSignal((n) => n + 1);
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const msg = isAbort
        ? "Analysis timed out (90 s). Please try again."
        : err instanceof Error
          ? err.message
          : "Unknown error";
      setError(msg);
      // revert so the user can retry from a sensible stage. If caller
      // supplied an original ideaSummary (refine path), restore it so the
      // report/competitors on screen stay in sync with the seed text the
      // Re-score textarea is pre-filled with.
      persist({
        ...scanning,
        stage: revertStage,
        ideaSummary: revertIdeaSummary ?? scanning.ideaSummary,
      });
    }
  };

  const runAnalysis = async (ideaSummary: string) => {
    if (!current) return;
    setError(null);
    const scanning: Session = {
      ...current,
      stage: "scanning",
      ideaSummary,
    };
    persist(scanning);
    await analyze(scanning, "interview");
  };

  const refineAnalysis = async (newSummary: string) => {
    if (!current) return;
    setError(null);
    resetRedTeamState();
    resetPersonasState();
    const originalSummary = current.ideaSummary;
    const scanning: Session = {
      ...current,
      stage: "scanning",
      ideaSummary: newSummary,
    };
    persist(scanning);
    await analyze(scanning, "report", originalSummary);
  };

  const runRedTeam = async () => {
    const snapshot = currentRef.current;
    if (!snapshot || !snapshot.report) return;
    const sessionId = snapshot.id;
    const generationAtStart = snapshot.reportGeneration ?? 0;
    setRedTeamError(null);
    setIsRedTeamLoading(true);
    const rtAbort = new AbortController();
    const rtTimeout = setTimeout(() => rtAbort.abort(), 45_000);
    try {
      const res = await fetch("/api/redteam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaSummary: snapshot.ideaSummary ?? "",
          messages: snapshot.messages,
          competitors: snapshot.competitors,
          report: snapshot.report,
        }),
        signal: rtAbort.signal,
      });
      const data = (await res.json()) as {
        redTeam?: RedTeamReport;
        error?: string;
      };
      if (!res.ok || !data.redTeam) {
        throw new Error(data.error || "Red-team pass failed");
      }
      // Look up the target by id in the in-memory sessions list so we
      // can save the red-team result even if the user has switched away
      // to another session while the request was in flight (it can take
      // 10+ seconds). We only update `current` when the user is still
      // on that session — otherwise we'd yank them back.
      const target = sessionsRef.current.find((s) => s.id === sessionId);
      if (!target) return; // session was deleted
      if ((target.reportGeneration ?? 0) !== generationAtStart) return;
      const updated: Session = { ...target, redTeamReport: data.redTeam };
      const stillActive = currentRef.current?.id === sessionId;
      persist(updated, { updateCurrent: stillActive });
    } catch (err) {
      const live = currentRef.current;
      if (
        live?.id === sessionId &&
        (live.reportGeneration ?? 0) === generationAtStart
      ) {
        const msg =
          (err as Error)?.name === "AbortError"
            ? "Red-team request timed out. Please try again."
            : err instanceof Error
              ? err.message
              : "Unknown error";
        setRedTeamError(msg);
      }
    } finally {
      clearTimeout(rtTimeout);
      const live = currentRef.current;
      if (
        live?.id === sessionId &&
        (live.reportGeneration ?? 0) === generationAtStart
      ) {
        setIsRedTeamLoading(false);
      }
    }
  };

  const runPersonas = async () => {
    const snapshot = currentRef.current;
    if (!snapshot || !snapshot.report) return;
    setPersonasError(null);
    setIsPersonasLoading(true);
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 30_000);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaSummary: snapshot.ideaSummary ?? "",
          messages: snapshot.messages,
          competitors: snapshot.competitors,
          report: snapshot.report,
        }),
        signal: abort.signal,
      });
      const data = (await res.json()) as { personas?: Persona[]; error?: string };
      if (!res.ok || !data.personas) {
        throw new Error(data.error || "Persona simulation failed");
      }
      setPersonas(data.personas);
    } catch (err) {
      const msg =
        (err as Error)?.name === "AbortError"
          ? "Persona request timed out. Please try again."
          : err instanceof Error
            ? err.message
            : "Unknown error";
      setPersonasError(msg);
    } finally {
      clearTimeout(timeout);
      setIsPersonasLoading(false);
    }
  };

  if (!isHydrated || !current) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeId={current.id}
        onNew={handleNew}
        onSelect={handleSelect}
        onDelete={handleDelete}
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        usageRefreshSignal={usageRefreshSignal}
      />
      {/* On mobile, add top padding to clear the fixed hamburger button */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14 flex flex-col overflow-hidden">
        {error && (
          <div className="px-6 pt-4">
            <div className="max-w-3xl mx-auto rounded-lg border border-[color:var(--bad)]/30 bg-[color:var(--bad)]/5 px-4 py-3 text-sm text-[color:var(--bad)]">
              <b>Error:</b> {error}
            </div>
          </div>
        )}

        {current.stage === "intro" && (
          <div className="flex-1 overflow-y-auto">
            <IntroStage onStart={startInterview} />
          </div>
        )}

        {/* InterviewStage manages its own internal scroll — give it all remaining height.
            The wrapping div passes height down; InterviewStage uses h-full internally. */}
        {current.stage === "interview" && (
          <div className="flex-1 min-h-0 flex flex-col">
          <InterviewStage
            messages={current.messages}
            onSend={sendInterviewAnswer}
            onDone={runAnalysis}
            isStreaming={isStreaming}
          />
          </div>
        )}

        {current.stage === "scanning" && (
          <div className="flex-1 overflow-y-auto">
            <ScanningStage
              ideaSummary={current.ideaSummary ?? ""}
              error={error}
              onRetry={
                error
                  ? () => {
                      setError(null);
                      runAnalysis(current.ideaSummary ?? "");
                    }
                  : undefined
              }
            />
          </div>
        )}

        {current.stage === "report" && !current.report && (
          <div className="flex-1 overflow-y-auto">
            <ReportSkeleton />
          </div>
        )}

        {current.stage === "report" && current.report && (
          <div className="flex-1 overflow-y-auto">
            <ReportStage
              key={current.id}
              report={current.report}
              competitors={current.competitors}
              ideaSummary={current.ideaSummary ?? ""}
              redTeamReport={current.redTeamReport ?? null}
              isRedTeamLoading={isRedTeamLoading}
              redTeamError={redTeamError}
              personas={personas}
              isPersonasLoading={isPersonasLoading}
              personasError={personasError}
              onRestart={handleNew}
              onRefine={refineAnalysis}
              onRedTeam={runRedTeam}
              onPersonas={runPersonas}
            />
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * One-time localStorage → Postgres migration.
 *
 * If this browser has legacy sessions saved under `vibe-check-sessions-v1`
 * and they haven't been uploaded yet, post them to `/api/sessions` so the
 * user doesn't lose their history when we switch away from localStorage.
 * Best-effort — failures are swallowed so the hard-wall sign-in UX still
 * works for brand-new users.
 *
 * Skips any session whose id is already on the server. Without that guard,
 * a retry on a partially-failed migration would `upsertSessionFull` the
 * original localStorage snapshot over any edits the user has made since
 * (messages, reports, etc.) — a silent destructive data loss.
 */
async function migrateLocalStorageIfNeeded(
  existingIds: Set<string>
): Promise<Session[]> {
  if (typeof window === "undefined") return [];
  if (window.localStorage.getItem(MIGRATION_FLAG)) return [];
  const legacy = loadLocalSessions();
  if (legacy.length === 0) {
    window.localStorage.setItem(MIGRATION_FLAG, String(Date.now()));
    return [];
  }
  const migrated: Session[] = [];
  let skippedCount = 0;
  for (const s of legacy) {
    if (existingIds.has(s.id)) {
      // Already on the server from a prior partial migration — skip so
      // we don't overwrite post-migration edits with stale data.
      skippedCount++;
      continue;
    }
    try {
      const saved = await persistSession(s);
      migrated.push(saved);
    } catch {
      /* skip — keep legacy in localStorage for manual recovery */
    }
  }
  if (migrated.length + skippedCount === legacy.length) {
    window.localStorage.setItem(MIGRATION_FLAG, String(Date.now()));
  }
  migrated.sort((a, b) => b.updatedAt - a.updatedAt);
  return migrated;
}

// ---------------------------------------------------------------------------
// Dashboard skeleton — shown on first load while sessions hydrate from Postgres
// ---------------------------------------------------------------------------
function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[color:var(--border)] bg-[color:var(--card)] p-4 gap-4">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-9 w-full rounded-lg" style={{ animationDelay: "0.05s" }} />
        <div className="flex-1 space-y-2 mt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-full rounded-lg" style={{ animationDelay: `${0.1 + i * 0.07}s` }} />
          ))}
        </div>
        <div className="skeleton h-[72px] w-full rounded-lg" style={{ animationDelay: "0.4s" }} />
      </aside>

      {/* Main area — mirrors IntroStage layout */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-16 space-y-4">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-9 w-3/4" style={{ animationDelay: "0.05s" }} />
          <div className="skeleton h-4 w-full" style={{ animationDelay: "0.1s" }} />
          <div className="skeleton h-4 w-4/5" style={{ animationDelay: "0.15s" }} />
          <div className="skeleton h-32 w-full rounded-xl mt-4" style={{ animationDelay: "0.2s" }} />
          <div className="flex gap-3 mt-2">
            <div className="skeleton h-10 w-32 rounded-lg" style={{ animationDelay: "0.25s" }} />
            <div className="skeleton h-10 w-24 rounded-lg" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
