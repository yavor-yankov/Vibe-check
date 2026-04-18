"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import type { Session } from "@/lib/types";
import UserBadge from "./UserBadge";

interface SidebarProps {
  sessions: Session[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

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
}: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r border-[color:var(--border)] bg-[color:var(--card)] flex flex-col h-screen sticky top-0">
      <div className="p-4 flex items-center gap-2 border-b border-[color:var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[color:var(--accent)] flex items-center justify-center text-white">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <div className="font-semibold leading-tight">Vibe Check</div>
          <div className="text-xs text-[color:var(--muted)] leading-tight">
            Pressure-test your app idea
          </div>
        </div>
      </div>

      <button
        onClick={onNew}
        className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-lg bg-[color:var(--accent)] text-white py-2.5 px-4 text-sm font-medium hover:brightness-110 transition"
      >
        <Plus size={16} />
        New vibe check
      </button>

      <div className="px-4 pt-6 pb-2 text-xs uppercase tracking-wider text-[color:var(--muted)] font-medium">
        Saved sessions
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-sm text-[color:var(--muted)] text-center">
            No sessions yet. Start your first vibe check above.
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((s) => (
              <li key={s.id}>
                <div
                  className={`group flex items-start gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${
                    s.id === activeId
                      ? "bg-[color:var(--background)] border border-[color:var(--border)]"
                      : "hover:bg-[color:var(--background)]"
                  }`}
                  onClick={() => onSelect(s.id)}
                >
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

      <UserBadge className="p-3 border-t border-[color:var(--border)]" />

      <div className="px-4 py-3 border-t border-[color:var(--border)] text-[11px] text-[color:var(--muted)] leading-tight">
        Powered by Gemini &amp; Tavily.
      </div>
    </aside>
  );
}
