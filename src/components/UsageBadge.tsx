"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, Zap } from "lucide-react";

interface UsageSnapshot {
  tier: "free" | "pro" | "lifetime";
  quota: number | null; // null = unlimited
  usageCount: number;
  remaining: number | null;
  usageMonth: string;
  hasStripeCustomer: boolean;
  subscriptionStatus: string | null;
}

interface UsageBadgeProps {
  className?: string;
}

/**
 * Small plan / usage indicator that sits in the sidebar. Shows how many
 * vibe checks remain this month on free tier, or an "Unlimited" pill on
 * paid tiers. Clicks through to /pricing (free) or the Stripe billing
 * portal (paid).
 */
export default function UsageBadge({ className }: UsageBadgeProps) {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSnapshot(data as UsageSnapshot);
      })
      .catch(() => {
        /* usage badge is non-critical */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openPortal = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await res.json().catch(() => null)) as
      | { url?: string }
      | null;
    if (data?.url) window.location.href = data.url;
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="h-9 rounded-lg bg-[color:var(--background)] animate-pulse" />
      </div>
    );
  }
  if (!snapshot) return null;

  const isFree = snapshot.tier === "free";
  const pct =
    isFree && snapshot.quota
      ? Math.min(100, (snapshot.usageCount / snapshot.quota) * 100)
      : 100;

  return (
    <div className={className}>
      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium capitalize">
            {isFree ? (
              <Zap size={12} className="text-[color:var(--muted)]" />
            ) : (
              <CreditCard size={12} className="text-[color:var(--accent)]" />
            )}
            {snapshot.tier} plan
          </div>
          {isFree && snapshot.quota ? (
            <span className="text-[color:var(--muted)] tabular-nums">
              {snapshot.usageCount}/{snapshot.quota}
            </span>
          ) : (
            <span className="text-[color:var(--muted)]">Unlimited</span>
          )}
        </div>
        {isFree && snapshot.quota ? (
          <div className="mt-2 h-1 rounded-full bg-[color:var(--border)] overflow-hidden">
            <div
              className="h-full bg-[color:var(--accent)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
          {isFree ? (
            <Link
              href="/pricing"
              className="text-[color:var(--accent)] hover:underline font-medium"
            >
              Upgrade to Pro →
            </Link>
          ) : (
            <button
              type="button"
              onClick={openPortal}
              className="text-[color:var(--accent)] hover:underline font-medium"
            >
              Manage billing →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
