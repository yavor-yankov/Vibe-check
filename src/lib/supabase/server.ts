import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { requirePublicEnv } from "./env";

/**
 * Create a Supabase client bound to the current request's cookies.
 *
 * Use this from Server Components, Route Handlers, and Server Actions — it
 * reads/writes the auth cookies automatically so `supabase.auth.getUser()`
 * returns the signed-in user and RLS kicks in against that user's id.
 *
 * In Next 16 `cookies()` is async, hence this helper is too.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requirePublicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `cookies().set` throws when called from a Server Component render
          // path — the middleware already refreshed the session, so ignoring
          // here is safe.
        }
      },
    },
  });
}
