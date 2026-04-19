import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Landing page Stripe bounces to after a successful checkout. Plan
 * entitlement is driven by the webhook, so all we do here is confirm
 * and link back into the app.
 */
export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6 bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="max-w-md text-center">
        <CheckCircle2
          size={48}
          className="mx-auto text-[color:var(--accent)]"
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          You&apos;re in. Welcome to Pro.
        </h1>
        <p className="mt-3 text-[color:var(--muted)]">
          Unlimited vibe checks are unlocked. It may take a few seconds
          for the upgrade to propagate — refresh the app if the usage
          indicator hasn&apos;t flipped yet.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-[color:var(--accent)] text-white px-5 py-2.5 text-sm font-medium hover:brightness-110 transition"
        >
          Open Vibe Check
        </Link>
      </div>
    </main>
  );
}
