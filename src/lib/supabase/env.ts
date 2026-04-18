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
