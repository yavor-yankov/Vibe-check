import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server-only Supabase client using the `service_role` key.
 *
 * Bypasses Row-Level Security. Use only for privileged server operations
 * (Stripe webhooks, background jobs, admin dashboards). NEVER import this
 * from a client component or expose the key to the browser.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set."
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
