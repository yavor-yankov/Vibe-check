"use client";

import { useState } from "react";

interface PricingCheckoutButtonProps {
  plan: "pro" | "lifetime";
  label: string;
  highlight?: boolean;
}

/**
 * Thin client wrapper that POSTs to /api/billing/checkout and redirects
 * the browser to the returned Stripe Checkout URL. Handles its own
 * loading + error state.
 */
export default function PricingCheckoutButton({
  plan,
  label,
  highlight,
}: PricingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error ?? `Checkout failed (HTTP ${res.status})`);
        setLoading(false);
        return;
      }
      // Only redirect to trusted Stripe domains or same-origin
      try {
        const parsed = new URL(data.url);
        if (!parsed.hostname.endsWith(".stripe.com") && parsed.origin !== window.location.origin) {
          setError("Untrusted redirect URL");
          setLoading(false);
          return;
        }
      } catch {
        setError("Invalid checkout URL");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`block w-full text-center rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60 ${
          highlight
            ? "bg-[color:var(--accent)] text-white hover:brightness-110"
            : "border border-[color:var(--border)] hover:bg-[color:var(--background)]"
        }`}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error ? (
        <div className="mt-2 text-xs text-[color:var(--bad)]">{error}</div>
      ) : null}
    </div>
  );
}
