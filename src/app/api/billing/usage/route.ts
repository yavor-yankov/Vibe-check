import { NextResponse } from "next/server";
import { getPlanSnapshot } from "@/lib/billing/usage";

/**
 * Return the signed-in user's plan + current monthly usage. Used by the
 * sidebar usage indicator + upgrade CTA.
 */
export async function GET() {
  const snapshot = await getPlanSnapshot();
  if (!snapshot) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    tier: snapshot.tier,
    quota: Number.isFinite(snapshot.quota) ? snapshot.quota : null,
    usageCount: snapshot.usageCount,
    remaining: Number.isFinite(snapshot.remaining) ? snapshot.remaining : null,
    usageMonth: snapshot.usageMonth,
    hasStripeCustomer: Boolean(snapshot.stripeCustomerId),
    subscriptionStatus: snapshot.subscriptionStatus,
  });
}
