import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { requirePublicEnv } from "./env";

/**
 * Build a Supabase client bound to the incoming proxy/middleware request.
 *
 * Unlike `createSupabaseServerClient()` in `server.ts` (which uses
 * `next/headers`), this reads/writes cookies directly on the Next.js
 * request/response pair. That's required because the proxy runs before any
 * route handler — there is no `cookies()` async context.
 *
 * Returns both the client AND the mutable `NextResponse` so callers can:
 *   1. Refresh the session by calling `supabase.auth.getUser()`, which
 *      writes any new access/refresh cookies onto `response`.
 *   2. Add their own headers/redirects to `response` before returning it.
 */
export function createSupabaseProxyClient(request: NextRequest) {
  const { url, anonKey } = requirePublicEnv();

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Propagate session-refresh cookies back to the browser.
        // Mutate both the inbound request (so downstream reads see the
        // fresh value) and the outbound response (so the browser stores it).
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  return {
    supabase,
    get response() {
      return response;
    },
  };
}
