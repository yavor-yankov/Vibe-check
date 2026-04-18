import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook — the source of truth for plan changes.
 *
 * Stripe POSTs subscription lifecycle events here. We update the user row
 * via the service-role client (bypasses RLS) keyed on stripe_customer_id.
 *
 * Events handled:
 *   - checkout.session.completed     → mark plan active (pro monthly or lifetime)
 *   - customer.subscription.updated  → keep status + current_period_end fresh
 *   - customer.subscription.deleted  → drop user back to free
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 500 }
    );
  }
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification needs the raw body exactly as Stripe sent it.
  const raw = await request.text();

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe unavailable" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${
          err instanceof Error ? err.message : "unknown"
        }`,
      },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (!customerId) break;
        const plan = session.metadata?.plan === "lifetime" ? "lifetime" : "pro";
        if (plan === "lifetime") {
          await admin
            .from("users")
            .update({
              subscription_tier: "lifetime",
              subscription_status: "active",
            })
            .eq("stripe_customer_id", customerId);
        } else {
          // For subscriptions Stripe will send a follow-up
          // customer.subscription.updated event with the full object —
          // we'll fill in stripe_subscription_id + period there. Flip
          // the tier here for an immediate unlock.
          await admin
            .from("users")
            .update({
              subscription_tier: "pro",
              subscription_status: "active",
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const priceId = sub.items.data[0]?.price.id ?? null;
        const periodEnd = (sub as Stripe.Subscription & {
          current_period_end?: number;
        }).current_period_end;
        await admin
          .from("users")
          .update({
            subscription_tier: sub.status === "active" ? "pro" : "free",
            subscription_status: sub.status,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            current_period_end:
              typeof periodEnd === "number"
                ? new Date(periodEnd * 1000).toISOString()
                : null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await admin
          .from("users")
          .update({
            subscription_tier: "free",
            subscription_status: sub.status,
            stripe_subscription_id: null,
            stripe_price_id: null,
            current_period_end: null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }
      default:
        // Not every event needs a side effect — acknowledge and move on.
        break;
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: `Webhook handler failed: ${
          err instanceof Error ? err.message : "unknown"
        }`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
