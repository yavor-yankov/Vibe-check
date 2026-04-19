/**
 * Centralised env-var access for the public Supabase keys.
 *
 * Throws a readable error in dev if the project hasn't been wired up yet,
 * rather than failing deep inside `@supabase/ssr` with a cryptic stack.
 */
export function requirePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase public env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local (see .env.example)."
    );
  }
  return { url, anonKey };
}

/**
 * Returns the canonical app origin used for Supabase auth redirect URLs.
 *
 * Prefer the explicit `NEXT_PUBLIC_APP_URL` env var so magic links always
 * land on the correct deployment — especially important when multiple
 * Supabase projects exist in the browser, which can cause Supabase to fall
 * back to the wrong project's Site URL.
 *
 * Falls back to `window.location.origin` on the client (dev convenience)
 * and to an empty string on the server (caller must be client-side).
 */
export function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    // Strip trailing slash so callers can always do `appOrigin() + "/path"`.
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
