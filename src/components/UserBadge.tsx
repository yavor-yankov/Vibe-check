"use client";

import { ChevronUp, ExternalLink, LogOut, Settings, User, Webhook } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import WebhookSettings from "./WebhookSettings";

interface UserBadgeProps {
  className?: string;
}

export default function UserBadge({ className }: UserBadgeProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setMenuOpen(false);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      // Navigate to landing page after sign-out
      window.location.href = "/";
    }
  };

  const openPortal = async () => {
    setMenuOpen(false);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await res.json().catch(() => null)) as { url?: string } | null;
    if (data?.url) window.location.href = data.url;
  };

  if (!email) return null;

  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <>
      <div className={`relative ${className ?? ""}`} ref={menuRef}>
        {/* Trigger row — the whole thing is clickable */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-[color:var(--background)] transition text-left group"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <div className="w-8 h-8 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--border)] flex items-center justify-center text-sm font-semibold shrink-0 text-[color:var(--accent)]">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[color:var(--muted)] leading-tight">Signed in as</div>
            <div className="text-sm font-medium truncate leading-tight" title={email}>
              {email}
            </div>
          </div>
          <ChevronUp
            size={14}
            className={`shrink-0 text-[color:var(--muted)] transition-transform duration-200 ${menuOpen ? "rotate-180" : "rotate-0"}`}
          />
        </button>

        {/* Dropdown menu — opens upward */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg overflow-hidden z-50 fade-in-up">
            {/* Profile header */}
            <div className="px-3 py-2.5 border-b border-[color:var(--border)] bg-[color:var(--background)]">
              <div className="text-xs text-[color:var(--muted)]">Account</div>
              <div className="text-sm font-medium truncate" title={email}>{email}</div>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setShowWebhook(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[color:var(--background)] transition text-left"
              >
                <Webhook size={14} className="text-[color:var(--muted)] shrink-0" />
                Webhook / Zapier
              </button>

              <button
                type="button"
                onClick={openPortal}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[color:var(--background)] transition text-left"
              >
                <Settings size={14} className="text-[color:var(--muted)] shrink-0" />
                Billing &amp; plan
                <ExternalLink size={11} className="ml-auto text-[color:var(--muted)]" />
              </button>

              <a
                href="/pricing"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[color:var(--background)] transition"
              >
                <User size={14} className="text-[color:var(--muted)] shrink-0" />
                View plans
              </a>
            </div>

            <div className="border-t border-[color:var(--border)] py-1">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[color:var(--background)] transition text-left text-[color:var(--bad)] disabled:opacity-60"
              >
                <LogOut size={14} className="shrink-0" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showWebhook && (
        <WebhookSettings onClose={() => setShowWebhook(false)} />
      )}
    </>
  );
}
