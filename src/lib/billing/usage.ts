import "server-only";
/**
 * Server-side usage accounting for Vibe Check's monthly quotas.
 *
 * Calls into Supabase via the user-scoped SSR client so RLS still applies.
 * `incrementUsage` is the write-path, `getPlan` is the read-path for
 * usage indicators in the UI.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentUsageMonth, getTier, PRICING_TIERS } from "./plan";
import { logger } from "@/lib/logger";
import type { SubscriptionTier } from "@/lib/supabase/database.types";

const log = logger.child({ module: "billing/usage" });

export interface PlanSnapshot {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  usageMonth: string;
  usageCount: number;
  remaining: number; // Infinity for unlimited tiers.
  quota: number; // Infinity for unlimited tiers.
  aiModel: string;
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
      aiModel: PRICING_TIERS.free.aiModel,
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
    aiModel: plan.aiModel,
    stripeCustomerId: row.stripe_customer_id,
    subscriptionStatus: row.subscription_status,
  };
}

/**
 * Atomically increment the signed-in user's usage counter for the
 * current month, rolling the bucket over if it's stale.
 *
 * Delegates the read-check-write to the `public.increment_usage` RPC
 * (see migration 0002) so concurrent requests from the same user can't
 * both sneak past the quota via a TOCTOU race.
 *
 * Returns the post-increment snapshot, or throws when the user would
 * exceed their quota. Callers should catch that error (`code ==
 * "QUOTA_EXCEEDED"`) and surface a 402 Payment Required.
 */
export async function consumeUsage(): Promise<PlanSnapshot> {
  const snapshot = await getPlanSnapshot();
  if (!snapshot) throw new Error("Not authenticated");

  const month = currentUsageMonth();
  const unlimited = snapshot.quota === Infinity;
  // The RPC ignores p_monthly_quota when p_unlimited=true, but we still
  // need to pass a concrete integer through the JSON-RPC boundary.
  const quotaParam = unlimited ? 0 : snapshot.quota;

  // Use the service-role client so the RPC grants are locked down to
  // service_role only — otherwise a signed-in user could call
  // decrement_usage from the browser and reset their own counter
  // (self-attack bypass of the monthly quota).
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("increment_usage", {
    p_user_id: snapshot.userId,
    p_month: month,
    p_unlimited: unlimited,
    p_monthly_quota: quotaParam,
  });

  if (error) {
    const raised = (error.message ?? "").toUpperCase();
    if (raised.includes("QUOTA_EXCEEDED")) {
      const err = new Error(
        `Monthly quota reached (${snapshot.quota}). Upgrade to Pro for unlimited vibe checks.`
      );
      (err as Error & { code?: string }).code = "QUOTA_EXCEEDED";
      throw err;
    }
    throw error;
  }

  const nextCount = typeof data === "number" ? data : snapshot.usageCount + 1;
  return {
    ...snapshot,
    usageMonth: month,
    usageCount: nextCount,
    remaining: unlimited ? Infinity : Math.max(0, snapshot.quota - nextCount),
  };
}

/**
 * Roll back a previous `consumeUsage()` when the downstream work fails
 * so users don't get charged a slot for a transient error. Best-effort
 * — swallows errors because the refund is never the primary request.
 */
export async function refundUsage(
  userId: string,
  month: string
): Promise<void> {
  try {
    // Service-role only — see note in consumeUsage above.
    const admin = createSupabaseAdminClient();
    await admin.rpc("decrement_usage", {
      p_user_id: userId,
      p_month: month,
    });
  } catch (err) {
    log.error({ err, userId, month }, "refundUsage failed");
  }
}
