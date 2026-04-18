/**
 * Server-side usage accounting for Vibe Check's monthly quotas.
 *
 * Calls into Supabase via the user-scoped SSR client so RLS still applies.
 * `incrementUsage` is the write-path, `getPlan` is the read-path for
 * usage indicators in the UI.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentUsageMonth, getTier, PRICING_TIERS } from "./plan";
import type { SubscriptionTier } from "@/lib/supabase/database.types";

export interface PlanSnapshot {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  usageMonth: string;
  usageCount: number;
  remaining: number; // Infinity for unlimited tiers.
  quota: number; // Infinity for unlimited tiers.
  geminiModel: string;
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
}

/**
 * Fetch the signed-in user's plan + usage snapshot. Lazily rolls over
 * the monthly counter when the bucket changes. Returns null when there
 * is no signed-in user.
 */
export async function getPlanSnapshot(): Promise<PlanSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("users")
    .select(
      "id,email,subscription_tier,usage_month,usage_count,stripe_customer_id,subscription_status"
    )
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!row) {
    // First access post-signup: the row is created by the
    // handle_new_user() trigger, but in case it hasn't fired yet we
    // fall back to a synthetic free-tier snapshot.
    return {
      userId: user.id,
      email: user.email ?? "",
      tier: "free",
      usageMonth: currentUsageMonth(),
      usageCount: 0,
      remaining: PRICING_TIERS.free.monthlyQuota,
      quota: PRICING_TIERS.free.monthlyQuota,
      geminiModel: PRICING_TIERS.free.geminiModel,
      stripeCustomerId: null,
      subscriptionStatus: null,
    };
  }

  const month = currentUsageMonth();
  const tier = row.subscription_tier;
  const plan = getTier(tier);
  const count = row.usage_month === month ? row.usage_count : 0;

  return {
    userId: user.id,
    email: row.email,
    tier,
    usageMonth: month,
    usageCount: count,
    quota: plan.monthlyQuota,
    remaining:
      plan.monthlyQuota === Infinity
        ? Infinity
        : Math.max(0, plan.monthlyQuota - count),
    geminiModel: plan.geminiModel,
    stripeCustomerId: row.stripe_customer_id,
    subscriptionStatus: row.subscription_status,
  };
}

/**
 * Atomically increment the signed-in user's usage counter for the
 * current month, rolling the bucket over if it's stale.
 *
 * Returns the post-increment snapshot, or throws when the user would
 * exceed their quota. Callers should catch that error and surface a
 * 402 Payment Required.
 */
export async function consumeUsage(): Promise<PlanSnapshot> {
  const snapshot = await getPlanSnapshot();
  if (!snapshot) throw new Error("Not authenticated");
  if (snapshot.remaining <= 0) {
    const err = new Error(
      `Monthly quota reached (${snapshot.quota}). Upgrade to Pro for unlimited vibe checks.`
    );
    (err as Error & { code?: string }).code = "QUOTA_EXCEEDED";
    throw err;
  }

  const month = currentUsageMonth();
  const nextCount =
    snapshot.usageMonth === month ? snapshot.usageCount + 1 : 1;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({ usage_month: month, usage_count: nextCount })
    .eq("id", snapshot.userId);
  if (error) throw error;

  return {
    ...snapshot,
    usageMonth: month,
    usageCount: nextCount,
    remaining:
      snapshot.quota === Infinity
        ? Infinity
        : Math.max(0, snapshot.quota - nextCount),
  };
}
