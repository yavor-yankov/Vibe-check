import type { Session } from "@/lib/types";

/**
 * Client-side helpers for the `/api/sessions` routes.
 *
 * All calls require a signed-in user (the proxy redirects to /signin
 * otherwise). Errors are surfaced as thrown `Error`s with the server's
 * message when available.
 */
async function throwIfBad(res: Response): Promise<void> {
  if (res.ok) return;
  let message = res.statusText || `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) message = body.error;
  } catch {
    /* non-JSON error body — keep status text */
  }
  throw new Error(message);
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch("/api/sessions", { cache: "no-store" });
  await throwIfBad(res);
  const body = (await res.json()) as { sessions: Session[] };
  return body.sessions;
}

export async function persistSession(session: Session): Promise<Session> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
  await throwIfBad(res);
  const body = (await res.json()) as { session: Session };
  return body.session;
}

export async function deleteSessionRemote(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
  await throwIfBad(res);
}
