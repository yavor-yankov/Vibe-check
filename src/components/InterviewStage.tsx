"use client";

import { ChevronDown, Send, Sparkles, User, Wand2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

interface InterviewStageProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onDone: (ideaSummary: string) => void;
  isStreaming: boolean;
}

// Minimum user turns before the "analyze now" escape hatch is offered.
const ESCAPE_HATCH_MIN_TURNS = 2;

// How far from the bottom (px) before we consider the user "scrolled up".
const SCROLL_THRESHOLD = 80;

function syntheticSummaryFromMessages(messages: ChatMessage[]): string {
  const userTurns = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);
  if (userTurns.length === 0) return "";
  return userTurns.join(" · ").slice(0, 800);
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2);
}

export function buildUserMessage(content: string): ChatMessage {
  return { id: makeId(), role: "user", content, createdAt: Date.now() };
}

export function buildAssistantMessage(content: string): ChatMessage {
  return { id: makeId(), role: "assistant", content, createdAt: Date.now() };
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  // True when we should auto-scroll (user is at/near the bottom)
  const atBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);

  /** Returns true when the scroll container is within SCROLL_THRESHOLD of the bottom. */
  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowScrollBtn(false);
    setUnreadCount(0);
    atBottomRef.current = true;
  }, []);

  // Auto-scroll when new messages arrive — but only if already at the bottom.
  useEffect(() => {
    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = newCount;

    if (newCount <= prevCount) return; // not a new message

    if (atBottomRef.current) {
      scrollToBottom("smooth");
    } else {
      // User has scrolled up — show badge but don't force-scroll.
      setUnreadCount((n) => n + (newCount - prevCount));
      setShowScrollBtn(true);
    }
  }, [messages.length, scrollToBottom]);

  // Keep the view pinned to the bottom while streaming updates the last
  // message in place (content changes but message count stays the same).
  const lastContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    if (!isStreaming) return;
    if (atBottomRef.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [lastContent, isStreaming]);

  // Initial scroll on mount (no animation).
  useEffect(() => {
    scrollToBottom("instant");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const atBottom = isAtBottom();
    atBottomRef.current = atBottom;
    if (atBottom) {
      setShowScrollBtn(false);
      setUnreadCount(0);
    } else {
      setShowScrollBtn(true);
    }
  }

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
    // Optimistically snap to bottom when the user sends a message.
    setTimeout(() => scrollToBottom("smooth"), 50);
  }

  return (
    // Use h-full so this fills its parent container rather than forcing 100vh.
    // The dashboard page root already sets the viewport height.
    <div className="flex flex-col h-full">
      {/* ── Step header ── */}
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

      {/* ── Scrollable message list ── */}
      {/* Relative wrapper so the scroll-to-bottom button can be positioned
          inside the message area, above the composer. */}
      <div className="flex-1 min-h-0 relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-6 py-6"
        >
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {isStreaming && last?.role === "user" && <TypingBubble />}
          </div>
        </div>

        {/* ── Scroll-to-bottom button ── */}
        {showScrollBtn && (
          <div className="print:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              aria-label="Scroll to latest message"
              className="flex items-center gap-1.5 rounded-full bg-[color:var(--card)] border border-[color:var(--border)] shadow-lg px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--background)] transition"
            >
              <ChevronDown size={13} />
              {unreadCount > 0 ? (
                <span className="bg-[color:var(--accent)] text-white rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                  {unreadCount}
                </span>
              ) : (
                "Latest"
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Composer / ready banner ── */}
      {readySummary ? (
        <div className="shrink-0 border-t border-[color:var(--border)] bg-[color:var(--accent)]/5 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium">Got it — ready to analyze.</div>
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
