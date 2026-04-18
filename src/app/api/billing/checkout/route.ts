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
    const customer = await stripe.customers.create({
      email: row?.email ?? user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    // Write back via the admin client so we don't need an RLS policy
    // update that would expose customer ids to the user themselves.
    const admin = createSupabaseAdminClient();
    await admin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
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
