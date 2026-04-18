"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IntroStage from "@/components/IntroStage";
import InterviewStage, {
  buildAssistantMessage,
  buildUserMessage,
} from "@/components/InterviewStage";
import ScanningStage from "@/components/ScanningStage";
import ReportStage from "@/components/ReportStage";
import Sidebar from "@/components/Sidebar";
import type {
  AnalysisReport,
  ChatMessage,
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Keep a ref to the latest active session so async callbacks don't
  // act on stale closures (e.g. runRedTeam finishing after the user
  // switched sessions or hit "New check").
  const currentRef = useRef<Session | null>(null);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // Hydrate from Postgres on mount. If it's empty and the browser has
  // legacy localStorage sessions, migrate them once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let remote = await fetchSessions();
        if (!cancelled && remote.length === 0) {
          const migrated = await migrateLocalStorageIfNeeded();
          if (migrated.length > 0) {
            remote = migrated;
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

  const persist = useCallback((s: Session) => {
    const stamped: Session = { ...s, updatedAt: Date.now() };
    setCurrent(stamped);
    setSessions((prev) => {
      const idx = prev.findIndex((x) => x.id === stamped.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stamped;
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      }
      return [stamped, ...prev];
    });
    // Fire server write in the background. We don't block the UI on it,
    // but surface errors so the user knows persistence failed.
    void persistSession(stamped).catch((err) => {
      setError(
        err instanceof Error
          ? `Save failed: ${err.message}`
          : "Save failed"
      );
    });
  }, []);

  const resetRedTeamState = () => {
    setIsRedTeamLoading(false);
    setRedTeamError(null);
  };

  const handleNew = () => {
    const s = newSession();
    setCurrent(s);
    setError(null);
    resetRedTeamState();
  };

  const handleSelect = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (s) {
      setCurrent(s);
      setError(null);
      resetRedTeamState();
    }
  };

  const handleDelete = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (current?.id === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrent(remaining[0] ?? newSession());
      resetRedTeamState();
    }
    void deleteSessionRemote(id).catch((err) => {
      setError(
        err instanceof Error
          ? `Delete failed: ${err.message}`
          : "Delete failed"
      );
    });
  };

  const startInterview = async (seed: string) => {
    if (!current) return;
    setError(null);
    const userMsg = buildUserMessage(seed);
    const next: Session = {
      ...current,
      title: seed.slice(0, 60),
      stage: "interview",
      messages: [userMsg],
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
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: sessionWithUser.messages }),
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsStreaming(false);
    }
  };

  const analyze = async (
    scanning: Session,
    revertStage: Session["stage"],
    revertIdeaSummary?: string
  ) => {
    const ideaSummary = scanning.ideaSummary ?? "";
    try {
      // 1. search competitors
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaSummary }),
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
        }),
      });
      const analyzeData = (await analyzeRes.json()) as {
        report?: AnalysisReport;
        error?: string;
      };
      if (!analyzeRes.ok || !analyzeData.report) {
        throw new Error(analyzeData.error || "Analysis failed");
      }

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
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
      });
      const data = (await res.json()) as {
        redTeam?: RedTeamReport;
        error?: string;
      };
      if (!res.ok || !data.redTeam) {
        throw new Error(data.error || "Red-team pass failed");
      }
      // Use the latest in-memory session instead of re-fetching; the
      // generation guard below still catches concurrent refines.
      const live = currentRef.current;
      const target = live?.id === sessionId ? live : null;
      if (!target) return; // session was deleted or switched
      if ((target.reportGeneration ?? 0) !== generationAtStart) return;
      const updated: Session = { ...target, redTeamReport: data.redTeam };
      persist(updated);
    } catch (err) {
      const live = currentRef.current;
      if (
        live?.id === sessionId &&
        (live.reportGeneration ?? 0) === generationAtStart
      ) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setRedTeamError(msg);
      }
    } finally {
      const live = currentRef.current;
      if (
        live?.id === sessionId &&
        (live.reportGeneration ?? 0) === generationAtStart
      ) {
        setIsRedTeamLoading(false);
      }
    }
  };

  if (!isHydrated || !current) {
    return (
      <div className="flex-1 grid place-items-center text-[color:var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar
        sessions={sessions}
        activeId={current.id}
        onNew={handleNew}
        onSelect={handleSelect}
        onDelete={handleDelete}
      />
      <main className="flex-1 min-w-0">
        {error && (
          <div className="px-6 pt-4">
            <div className="max-w-3xl mx-auto rounded-lg border border-[color:var(--bad)]/30 bg-[color:var(--bad)]/5 px-4 py-3 text-sm text-[color:var(--bad)]">
              <b>Error:</b> {error}
            </div>
          </div>
        )}

        {current.stage === "intro" && <IntroStage onStart={startInterview} />}

        {current.stage === "interview" && (
          <InterviewStage
            messages={current.messages}
            onSend={sendInterviewAnswer}
            onDone={runAnalysis}
            isStreaming={isStreaming}
          />
        )}

        {current.stage === "scanning" && (
          <ScanningStage ideaSummary={current.ideaSummary ?? ""} />
        )}

        {current.stage === "report" && current.report && (
          <ReportStage
            key={current.id}
            report={current.report}
            competitors={current.competitors}
            ideaSummary={current.ideaSummary ?? ""}
            redTeamReport={current.redTeamReport ?? null}
            isRedTeamLoading={isRedTeamLoading}
            redTeamError={redTeamError}
            onRestart={handleNew}
            onRefine={refineAnalysis}
            onRedTeam={runRedTeam}
          />
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
 */
async function migrateLocalStorageIfNeeded(): Promise<Session[]> {
  if (typeof window === "undefined") return [];
  if (window.localStorage.getItem(MIGRATION_FLAG)) return [];
  const legacy = loadLocalSessions();
  if (legacy.length === 0) {
    window.localStorage.setItem(MIGRATION_FLAG, String(Date.now()));
    return [];
  }
  const migrated: Session[] = [];
  for (const s of legacy) {
    try {
      const saved = await persistSession(s);
      migrated.push(saved);
    } catch {
      /* skip — keep legacy in localStorage for manual recovery */
    }
  }
  if (migrated.length === legacy.length) {
    window.localStorage.setItem(MIGRATION_FLAG, String(Date.now()));
  }
  migrated.sort((a, b) => b.updatedAt - a.updatedAt);
  return migrated;
}
