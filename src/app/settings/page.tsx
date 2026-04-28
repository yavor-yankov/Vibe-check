import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, CreditCard, Trash2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlanSnapshot } from "@/lib/billing/usage";
import DeleteAccountButton from "./DeleteAccountButton";

export const metadata: Metadata = {
  title: "Settings — Vibe Check",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/settings");

  const plan = await getPlanSnapshot();

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="border-b border-[color:var(--border)] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-[color:var(--border)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Account Info */}
        <section>
          <h2 className="text-sm font-medium text-[color:var(--muted)] uppercase tracking-wide mb-3">
            Account
          </h2>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[color:var(--muted)]">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[color:var(--muted)]">Plan</span>
              <span className="text-sm font-medium capitalize">
                {plan?.tier ?? "Free"}
              </span>
            </div>
            {plan && plan.quota !== Infinity && (
              <div className="flex justify-between">
                <span className="text-sm text-[color:var(--muted)]">
                  Usage this month
                </span>
                <span className="text-sm font-medium">
                  {plan.usageCount} / {plan.quota} checks
                </span>
              </div>
            )}
            {plan?.subscriptionStatus && (
              <div className="flex justify-between">
                <span className="text-sm text-[color:var(--muted)]">
                  Subscription
                </span>
                <span className="text-sm font-medium capitalize">
                  {plan.subscriptionStatus}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Billing */}
        <section>
          <h2 className="text-sm font-medium text-[color:var(--muted)] uppercase tracking-wide mb-3">
            Billing
          </h2>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
            <p className="text-sm text-[color:var(--muted)] mb-3">
              Manage your subscription, update payment method, or view invoices.
            </p>
            <a
              href="/api/billing/portal"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <CreditCard className="w-4 h-4" />
              Manage billing
            </a>
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="text-sm font-medium text-[color:var(--muted)] uppercase tracking-wide mb-3">
            Your Data
          </h2>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 space-y-4">
            <div>
              <p className="text-sm text-[color:var(--muted)] mb-2">
                Download a copy of all your sessions, reports, and account data.
              </p>
              <a
                href="/api/account"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[color:var(--border)] text-sm font-medium hover:bg-[color:var(--border)] transition-colors"
              >
                <Download className="w-4 h-4" />
                Export my data
              </a>
            </div>

            <hr className="border-[color:var(--border)]" />

            <div>
              <p className="text-sm text-[color:var(--bad)] mb-2">
                Permanently delete your account and all associated data. This
                cannot be undone.
              </p>
              <DeleteAccountButton />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
