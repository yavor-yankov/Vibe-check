"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, Zap, AlertTriangle } from "lucide-react";

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
  /**
   * Increment this counter from the parent whenever a vibe check completes
   * so the badge re-fetches the latest quota from the server. The actual
   * value doesn't matter — only changes trigger the effect.
   */
  refreshSignal?: number;
}

/** Returns the number of days until the first of next month. */
function daysUntilReset(): number {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((first.getTime() - now.getTime()) / 86_400_000);
}

/**
 * Plan / usage indicator that sits at the bottom of the sidebar.
 *
 * - Free: shows a progress bar + "X of Y used", warns in amber when ≤2 remain
 * - Pro / Lifetime: shows "Unlimited" pill + billing management link
 * - Re-fetches when `refreshSignal` changes (i.e. after each vibe check)
 */
export default function UsageBadge({ className, refreshSignal }: UsageBadgeProps) {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/billing/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSnapshot(data as UsageSnapshot);
      })
      .catch(() => {
        /* usage badge is non-critical — swallow errors */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshSignal]);

  const openPortal = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await res.json().catch(() => null)) as
      | { url?: string }
      | null;
    if (data?.url) {
      try {
        const parsed = new URL(data.url);
        if (parsed.hostname.endsWith(".stripe.com") || parsed.origin === window.location.origin) {
          window.location.href = data.url;
        }
      } catch { /* invalid URL — ignore */ }
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="h-[72px] rounded-lg bg-[color:var(--background)] animate-pulse" />
      </div>
    );
  }
  if (!snapshot) return null;

  const isFree = snapshot.tier === "free";
  const remaining = snapshot.remaining ?? null;
  const quota = snapshot.quota ?? null;

  // Progress bar fill (free tier only).
  const pct =
    isFree && quota
      ? Math.min(100, (snapshot.usageCount / quota) * 100)
      : 100;

  // Warn in amber when the user has ≤2 free checks left.
  const isLow = isFree && remaining !== null && remaining <= 2;
  const isExhausted = isFree && remaining !== null && remaining === 0;

  const barColor = isExhausted
    ? "bg-[color:var(--bad)]"
    : isLow
      ? "bg-amber-500"
      : "bg-[color:var(--accent)]";

  const resetDays = daysUntilReset();

  return (
    <div className={className}>
      <div
        className={`rounded-lg border p-3 ${
          isExhausted
            ? "border-[color:var(--bad)]/40 bg-[color:var(--bad)]/5"
            : isLow
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-[color:var(--border)] bg-[color:var(--background)]"
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium capitalize">
            {isExhausted || isLow ? (
              <AlertTriangle
                size={12}
                className={isExhausted ? "text-[color:var(--bad)]" : "text-amber-500"}
              />
            ) : isFree ? (
              <Zap size={12} className="text-[color:var(--muted)]" />
            ) : (
              <CreditCard size={12} className="text-[color:var(--accent)]" />
            )}
            {snapshot.tier} plan
          </div>

          {isFree && quota ? (
            <span
              className={`tabular-nums ${
                isExhausted
                  ? "text-[color:var(--bad)] font-semibold"
                  : isLow
                    ? "text-amber-500 font-semibold"
                    : "text-[color:var(--muted)]"
              }`}
            >
              {snapshot.usageCount}/{quota} used
            </span>
          ) : (
            <span className="text-[color:var(--muted)]">Unlimited</span>
          )}
        </div>

        {/* Progress bar (free only) */}
        {isFree && quota ? (
          <div className="mt-2 h-1.5 rounded-full bg-[color:var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}

        {/* Sub-row: remaining / reset info + CTA */}
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          {isFree ? (
            <span
              className={
                isExhausted
                  ? "text-[color:var(--bad)]"
                  : isLow
                    ? "text-amber-500"
                    : "text-[color:var(--muted)]"
              }
            >
              {isExhausted
                ? `Resets in ${resetDays}d`
                : `${remaining} left · resets in ${resetDays}d`}
            </span>
          ) : (
            <span className="text-[color:var(--muted)] text-xs">
              Resets monthly
            </span>
          )}

          {isFree ? (
            <Link
              href="/pricing"
              className="text-[color:var(--accent)] hover:underline font-medium shrink-0"
            >
              {isExhausted ? "Upgrade now →" : "Upgrade →"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={openPortal}
              className="text-[color:var(--accent)] hover:underline font-medium shrink-0"
            >
              Manage →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
