"use client";

import { LogOut, Webhook } from "lucide-react";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import WebhookSettings from "./WebhookSettings";

interface UserBadgeProps {
  className?: string;
}

export default function UserBadge({ className }: UserBadgeProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setEmail(session?.user?.email ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      // Hard reload kicks the proxy into redirecting to /signin and
      // clears all in-memory session state.
      window.location.href = "/signin";
    }
  };

  if (!email) return null;

  return (
    <>
      <div className={className}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[color:var(--background)] border border-[color:var(--border)] flex items-center justify-center text-sm font-semibold shrink-0">
            {email[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[color:var(--muted)] leading-tight">
              Signed in as
            </div>
            <div
              className="text-sm font-medium truncate leading-tight"
              title={email}
            >
              {email}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowWebhook(true)}
            aria-label="Webhook settings"
            title="Webhook / Zapier integration"
            className="shrink-0 p-1.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--background)] rounded-md transition"
          >
            <Webhook size={15} />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
            className="shrink-0 p-1.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--background)] rounded-md transition disabled:opacity-60"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {showWebhook && (
        <WebhookSettings onClose={() => setShowWebhook(false)} />
      )}
    </>
  );
}
