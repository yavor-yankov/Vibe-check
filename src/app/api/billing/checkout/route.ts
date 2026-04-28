import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe, getPriceIds } from "@/lib/billing/stripe";

/**
 * Create a Stripe Checkout Session for the signed-in user and return its
 * redirect URL. The client POSTs { plan: "pro" | "lifetime" }.
 *
 * We ensure the user has a stripe_customer_id (creating one lazily and
 * writing it back via the service-role client so the webhook can find it
 * later), then hand off to Stripe-hosted Checkout.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    plan?: "pro" | "lifetime";
  };
  const plan = body.plan === "lifetime" ? "lifetime" : "pro";

  const priceIds = getPriceIds();
  const priceId = priceIds[plan];
  if (!priceId) {
    return NextResponse.json(
      {
        error: `STRIPE_PRICE_${plan.toUpperCase()} is not configured on the server.`,
      },
      { status: 500 }
    );
  }

  // ─── Lifetime cap enforcement ───────────────────────────────────────────
  // Pricing claims "only the first 100" — enforce it server-side.
  if (plan === "lifetime") {
    const cap = parseInt(process.env.LIFETIME_CAP || "100", 10);
    const admin = createSupabaseAdminClient();
    const { count, error: countErr } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("subscription_tier", "lifetime");
    if (!countErr && (count ?? 0) >= cap) {
      return NextResponse.json(
        { error: "Lifetime plan is sold out. All slots have been claimed." },
        { status: 410 }
      );
    }
  }

  const { data: row } = await supabase
    .from("users")
    .select("email,stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe unavailable" },
      { status: 500 }
    );
  }

  let customerId = row?.stripe_customer_id ?? null;
  if (!customerId) {
    // Use the Supabase user id as an idempotency key so two concurrent
    // POST /api/billing/checkout requests don't create two Stripe
    // customers for the same user; Stripe returns the same customer
    // for any duplicate call within 24h.
    const customer = await stripe.customers.create(
      {
        email: row?.email ?? user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      },
      { idempotencyKey: `customer:${user.id}` }
    );
    customerId = customer.id;
    // Conditional write via the admin client: only the first concurrent
    // request wins. If another request already stamped a customer id
    // we re-read and reuse it so the checkout session is linked to the
    // customer id that's actually stored in the DB (otherwise the
    // webhook lookup .eq(stripe_customer_id, …) would miss and the
    // user would pay without getting upgraded).
    const admin = createSupabaseAdminClient();
    const { data: updated, error: updateErr } = await admin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
      .is("stripe_customer_id", null)
      .select("stripe_customer_id")
      .maybeSingle();
    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }
    if (!updated) {
      const { data: reread } = await admin
        .from("users")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle();
      if (reread?.stripe_customer_id) {
        customerId = reread.stripe_customer_id;
      }
    }
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: plan === "lifetime" ? "payment" : "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    allow_promotion_codes: true,
    // The webhook is the source of truth, but stash the plan here too
    // for the success page copy.
    metadata: { supabase_user_id: user.id, plan },
    subscription_data:
      plan === "pro"
        ? { metadata: { supabase_user_id: user.id } }
        : undefined,
  });

  return NextResponse.json({ url: session.url });
}
