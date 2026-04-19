import "server-only";
/**
 * Server-side Stripe client.
 *
 * We deliberately don't create the client at module load — instantiating
 * without a key would throw during `next build` on machines that haven't
 * configured billing yet. Call `getStripe()` from a route handler and it
 * will throw a clean error if the env isn't wired up.
 */

import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Billing routes are disabled until it's configured."
    );
  }
  cached = new Stripe(key, {
    // Pin the API version so a future Stripe upgrade doesn't silently
    // change request/response shape under us.
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
  return cached;
}

export function getPriceIds() {
  return {
    pro: process.env.STRIPE_PRICE_PRO ?? null,
    lifetime: process.env.STRIPE_PRICE_LIFETIME ?? null,
  };
}
