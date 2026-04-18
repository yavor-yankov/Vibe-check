/**
 * Thin cache around Tavily. Uses the service-role client because the
 * tavily_cache table is locked down behind RLS (no policies), so anon
 * and auth clients can't see it.
 *
 * Hits are scoped by a normalized query key; entries expire after 7
 * days. Writes are "best effort" — any DB failure falls back to a
 * direct Tavily call.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Competitor } from "@/lib/types";

const TTL_DAYS = 7;

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 280);
}

interface CachedPayload {
  competitors: Competitor[];
}

export async function readCachedSearch(
  query: string
): Promise<Competitor[] | null> {
  const key = normalizeQuery(query);
  if (!key) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("tavily_cache")
      .select("response,expires_at")
      .eq("query_key", key)
      .maybeSingle();
    if (!data) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    const payload = data.response as CachedPayload | null;
    return payload?.competitors ?? null;
  } catch {
    // Cache should never fail the search — fall through to live call.
    return null;
  }
}

export async function writeCachedSearch(
  query: string,
  competitors: Competitor[]
): Promise<void> {
  const key = normalizeQuery(query);
  if (!key) return;
  try {
    const admin = createSupabaseAdminClient();
    const expiresAt = new Date(
      Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    await admin.from("tavily_cache").upsert(
      {
        query_key: key,
        query,
        response: { competitors } as unknown,
        expires_at: expiresAt,
      },
      { onConflict: "query_key" }
    );
  } catch {
    /* non-fatal */
  }
}
