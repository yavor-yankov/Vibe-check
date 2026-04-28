/**
 * Pricing + plan definitions for Vibe Check.
 *
 * Single source of truth for tier names, monthly quotas, model choice, and
 * marketing copy. Referenced by the UI (`/pricing`, usage indicator) and
 * by the API routes (`/api/analyze`, `/api/redteam`) for quota enforcement.
 */

import type { SubscriptionTier } from "@/lib/supabase/database.types";

export const PRICING_TIERS = {
  free: {
    tier: "free" as const,
    name: "Free",
    blurb: "Kick the tires. Pressure-test up to 3 ideas a month.",
    priceUsd: 0,
    priceLabel: "$0",
    monthlyQuota: 3,
    aiModel: "llama-3.3-70b-versatile",
    // Whether the red-team pass is unlocked for this tier.
    redTeamEnabled: true,
    features: [
      "3 vibe checks / month",
      "Competitor scan",
      "Scored report + devil's advocate",
      "Session history in the cloud",
    ],
    cta: "Start free",
  },
  pro: {
    tier: "pro" as const,
    name: "Pro",
    blurb: "Ship without counting. Better models, unlimited vibe checks.",
    priceUsd: 9,
    priceLabel: "$9/mo",
    monthlyQuota: Infinity,
    aiModel: "llama-3.3-70b-versatile",
    redTeamEnabled: true,
    features: [
      "Unlimited vibe checks",
      "Advanced AI model (Llama 3.3 70B)",
      "Everything in Free",
      "Priority during API outages",
    ],
    cta: "Upgrade to Pro",
  },
  lifetime: {
    tier: "lifetime" as const,
    name: "Lifetime",
    blurb: "Pay once — only the first 100.",
    priceUsd: 49,
    priceLabel: "$49 once",
    monthlyQuota: Infinity,
    aiModel: "llama-3.3-70b-versatile",
    redTeamEnabled: true,
    features: [
      "Everything in Pro, forever",
      "Founding-user badge",
      "Direct feedback channel",
    ],
    cta: "Claim lifetime",
  },
} as const;

export type PricingTier = (typeof PRICING_TIERS)[keyof typeof PRICING_TIERS];

export function getTier(tier: SubscriptionTier): PricingTier {
  return PRICING_TIERS[tier];
}

/**
 * The YYYY-MM bucket we use to key monthly usage against so we can reset
 * counters with a simple string comparison rather than a cron job.
 */
export function currentUsageMonth(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}
