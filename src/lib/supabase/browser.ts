"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { requirePublicEnv } from "./env";

/**
 * Browser-side Supabase client. Safe to call many times — `@supabase/ssr`
 * de-duplicates internally when the same URL / key pair is reused.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = requirePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
