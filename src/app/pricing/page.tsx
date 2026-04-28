import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { PRICING_TIERS } from "@/lib/billing/plan";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PricingCheckoutButton from "./PricingCheckoutButton";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with 3 vibe checks per month. Upgrade to Pro for unlimited checks, priority AI, and advanced competitor analysis.",
  openGraph: {
    title: "Vibe Check Pricing — Free & Pro Plans",
    description:
      "Start free with 3 vibe checks per month. Upgrade to Pro for unlimited checks, priority AI, and advanced competitor analysis.",
  },
};

export const dynamic = "force-dynamic";

/**
 * /pricing — public route (listed in proxy PUBLIC_PATHS). Shows the Free
 * vs Pro vs Lifetime tiers side-by-side with a checkout CTA for
 * signed-in users, and a sign-in CTA for logged-out visitors.
 */
export default async function PricingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch lifetime subscriber count for scarcity display.
  const lifetimeCap = parseInt(process.env.LIFETIME_CAP || "100", 10);
  const { count: lifetimeCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("subscription_tier", "lifetime");
  const lifetimeRemaining = Math.max(0, lifetimeCap - (lifetimeCount ?? 0));
  const lifetimeSoldOut = lifetimeRemaining === 0;

  const tiers = [
    PRICING_TIERS.free,
    PRICING_TIERS.pro,
    PRICING_TIERS.lifetime,
  ] as const;

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition"
        >
          <ArrowLeft size={14} />
          Back to Vibe Check
        </Link>

        <div className="mt-6 mb-12 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">
            Pick a plan that fits the idea.
          </h1>
          <p className="mt-3 text-lg text-[color:var(--muted)]">
            Kick the tires for free. When you&apos;re burning through
            ideas faster than 3 a month, Pro unlocks unlimited runs and
            our advanced AI model.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const highlight = tier.tier === "pro";
            return (
              <div
                key={tier.tier}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  highlight
                    ? "border-[color:var(--accent)] bg-[color:var(--card)] shadow-lg"
                    : "border-[color:var(--border)] bg-[color:var(--card)]"
                }`}
              >
                {highlight ? (
                  <div className="absolute -top-3 left-6 text-xs px-2 py-0.5 rounded-full bg-[color:var(--accent)] text-white font-medium">
                    Most popular
                  </div>
                ) : null}
                <div className="text-sm uppercase tracking-wider text-[color:var(--muted)] font-medium">
                  {tier.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">
                    {tier.priceLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {tier.blurb}
                </p>
                {tier.tier === "lifetime" && (
                  <p className={`mt-1 text-xs font-medium ${lifetimeSoldOut ? "text-[color:var(--bad)]" : "text-[color:var(--accent)]"}`}>
                    {lifetimeSoldOut ? "Sold out" : `${lifetimeRemaining} of ${lifetimeCap} remaining`}
                  </p>
                )}

                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        size={16}
                        className="text-[color:var(--accent)] mt-0.5 shrink-0"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {tier.tier === "free" ? (
                    <Link
                      href={user ? "/" : "/signin"}
                      className="block text-center rounded-lg border border-[color:var(--border)] py-2.5 text-sm font-medium hover:bg-[color:var(--background)] transition"
                    >
                      {user ? "Go to app" : "Start free"}
                    </Link>
                  ) : user ? (
                    <PricingCheckoutButton
                      plan={tier.tier}
                      label={tier.cta}
                      highlight={highlight}
                    />
                  ) : (
                    <Link
                      href={`/signin?next=${encodeURIComponent("/pricing")}`}
                      className={`block text-center rounded-lg py-2.5 text-sm font-medium transition ${
                        highlight
                          ? "bg-[color:var(--accent)] text-white hover:brightness-110"
                          : "border border-[color:var(--border)] hover:bg-[color:var(--background)]"
                      }`}
                    >
                      Sign in to upgrade
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-[color:var(--muted)] text-center">
          Payments handled by Stripe. Cancel anytime from the billing
          portal. Lifetime tier is limited to the first 100 subscribers.
        </p>
      </div>
    </main>
  );
}
