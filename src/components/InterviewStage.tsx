"use client";

import { Send, Sparkles, User, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

interface InterviewStageProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onDone: (ideaSummary: string) => void;
  isStreaming: boolean;
}

// Minimum user turns before the "analyze now" escape hatch is offered.
const ESCAPE_HATCH_MIN_TURNS = 2;

function syntheticSummaryFromMessages(messages: ChatMessage[]): string {
  const userTurns = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);
  if (userTurns.length === 0) return "";
  // Keep first turn (usually the seed idea) + later turns concatenated, capped.
  return userTurns.join(" · ").slice(0, 800);
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2);
}

export function buildUserMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    role: "user",
    content,
    createdAt: Date.now(),
  };
}

export function buildAssistantMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    role: "assistant",
    content,
    createdAt: Date.now(),
  };
}

function extractReady(content: string): string | null {
  const m = content.match(/READY_FOR_ANALYSIS\s*:\s*([\s\S]+)/i);
  return m ? m[1].trim() : null;
}

export default function InterviewStage({
  messages,
  onSend,
  onDone,
  isStreaming,
}: InterviewStageProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const last = messages[messages.length - 1];
  const readySummary =
    last && last.role === "assistant" ? extractReady(last.content) : null;
  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const canEscape =
    !readySummary && !isStreaming && userTurnCount >= ESCAPE_HATCH_MIN_TURNS;

  function submit() {
    const t = draft.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setDraft("");
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="shrink-0 border-b border-[color:var(--border)] bg-[color:var(--card)] px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs text-[color:var(--accent)] font-medium">
            Step 2 of 3 — Interview
          </div>
          <div className="text-sm text-[color:var(--muted)]">
            Answer a few questions so I can evaluate the idea properly.
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {isStreaming && last?.role === "user" && <TypingBubble />}
        </div>
      </div>

      {readySummary ? (
        <div className="shrink-0 border-t border-[color:var(--border)] bg-[color:var(--accent)]/5 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium">
                Got it — ready to analyze.
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                I&apos;ll search the web for similar apps, then score your idea.
              </div>
            </div>
            <button
              onClick={() => onDone(readySummary)}
              disabled={isStreaming}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] text-white px-5 py-2.5 font-medium hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={16} />
              Analyze idea
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-[color:var(--border)] bg-[color:var(--card)] px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Type your answer…"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm max-h-40 focus:outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20"
              disabled={isStreaming}
            />
            <button
              onClick={submit}
              disabled={!draft.trim() || isStreaming}
              className="rounded-lg bg-[color:var(--accent)] text-white p-2.5 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
          {canEscape && (
            <div className="max-w-3xl mx-auto mt-2 flex justify-end">
              <button
                onClick={() => {
                  const summary = syntheticSummaryFromMessages(messages);
                  if (summary) onDone(summary);
                }}
                disabled={isStreaming}
                className="inline-flex items-center gap-1.5 text-xs text-[color:var(--muted)] hover:text-[color:var(--accent)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Skip remaining questions and analyze now"
              >
                <Wand2 size={12} />
                I&apos;m done — analyze now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function stripReady(content: string): string {
  return content.replace(/READY_FOR_ANALYSIS\s*:\s*/i, "").trim();
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 fade-in-up ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
          isUser
            ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
            : "bg-[color:var(--accent)] text-white"
        }`}
      >
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
            : "bg-[color:var(--card)] border border-[color:var(--border)]"
        }`}
      >
        {isUser ? message.content : stripReady(message.content)}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3 fade-in-up">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-[color:var(--accent)] text-white">
        <Sparkles size={16} />
      </div>
      <div className="rounded-2xl px-4 py-3 bg-[color:var(--card)] border border-[color:var(--border)]">
        <div className="flex items-center gap-1">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--muted)]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--muted)]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[color:var(--muted)]" />
        </div>
      </div>
    </div>
  );
}
