"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
  deleteSession,
  loadSessions,
  newSession,
  upsertSession,
} from "@/lib/storage";

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [current, setCurrent] = useState<Session | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedTeamLoading, setIsRedTeamLoading] = useState(false);
  const [redTeamError, setRedTeamError] = useState<string | null>(null);

  // hydrate from localStorage on mount (client-only)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const all = loadSessions();
    setSessions(all);
    setCurrent(all[0] ?? newSession());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persist = useCallback((s: Session) => {
    const all = upsertSession(s);
    setSessions(all);
    setCurrent(s);
  }, []);

  const handleNew = () => {
    const s = newSession();
    setCurrent(s);
    setError(null);
  };

  const handleSelect = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (s) {
      setCurrent(s);
      setError(null);
    }
  };

  const handleDelete = (id: string) => {
    const all = deleteSession(id);
    setSessions(all);
    if (current?.id === id) {
      setCurrent(all[0] ?? newSession());
    }
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
    revertStage: Session["stage"]
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
      };
      persist(done);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      // revert so the user can retry from a sensible stage
      persist({ ...scanning, stage: revertStage });
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
    setRedTeamError(null);
    const prevReport = current.report;
    const scanning: Session = {
      ...current,
      stage: "scanning",
      ideaSummary: newSummary,
      competitors: [],
      // keep the prior report around so we can revert on failure
      report: prevReport,
    };
    persist(scanning);
    await analyze(scanning, "report");
  };

  const runRedTeam = async () => {
    if (!current || !current.report) return;
    setRedTeamError(null);
    setIsRedTeamLoading(true);
    try {
      const res = await fetch("/api/redteam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaSummary: current.ideaSummary ?? "",
          messages: current.messages,
          competitors: current.competitors,
          report: current.report,
        }),
      });
      const data = (await res.json()) as {
        redTeam?: RedTeamReport;
        error?: string;
      };
      if (!res.ok || !data.redTeam) {
        throw new Error(data.error || "Red-team pass failed");
      }
      persist({ ...current, redTeamReport: data.redTeam });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setRedTeamError(msg);
    } finally {
      setIsRedTeamLoading(false);
    }
  };

  if (!current) {
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
