import type { Session } from "./types";

const KEY = "vibe-check-sessions-v1";

export function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Session[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function upsertSession(session: Session): Session[] {
  const all = loadSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  const next = { ...session, updatedAt: Date.now() };
  if (idx >= 0) {
    all[idx] = next;
  } else {
    all.unshift(next);
  }
  saveSessions(all);
  return all;
}

export function deleteSession(id: string): Session[] {
  const all = loadSessions().filter((s) => s.id !== id);
  saveSessions(all);
  return all;
}

export function newSession(): Session {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(36).slice(2);
  return {
    id,
    title: "New idea",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stage: "intro",
    messages: [],
    competitors: [],
    report: null,
  };
}
