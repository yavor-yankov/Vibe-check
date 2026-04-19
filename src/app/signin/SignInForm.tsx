"use client";

import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "completing" }
  | { kind: "error"; message: string };

// Accept only same-origin relative paths; mirrors the server-side check
// in /auth/callback so `next=https://evil.com` can't phish an open redirect.
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

type HashResult =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "tokens"; accessToken: string; refreshToken: string };

// Supabase's implicit-flow magic links redirect to /signin with the tokens
// in the URL fragment (#access_token=…&refresh_token=…) instead of the
// ?code=… query /auth/callback handles. Browsers don't forward fragments
// to the server so we parse + strip them on the client. Runs lazily (on
// first render) so the strip happens before paint and tokens never sit
// in the visible URL bar.
function consumeAuthHash(): HashResult {
  if (typeof window === "undefined") return { kind: "none" };
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return { kind: "none" };
  const params = new URLSearchParams(hash.slice(1));
  const errorDescription =
    params.get("error_description") ?? params.get("error");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!errorDescription && (!accessToken || !refreshToken)) {
    return { kind: "none" };
  }
  // Strip tokens from the URL immediately so they can't leak via referer
  // headers, browser history, or a stray copy-paste.
  window.history.replaceState(null, "", window.location.pathname);
  if (errorDescription) {
    return { kind: "error", message: errorDescription };
  }
  return {
    kind: "tokens",
    accessToken: accessToken!,
    refreshToken: refreshToken!,
  };
}

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  // Surface errors the callback route bounces back with (`?error=...`)
  // so OAuth / code-exchange failures aren't silently swallowed.
  const callbackError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [hashResult] = useState<HashResult>(consumeAuthHash);
  const [status, setStatus] = useState<Status>(() => {
    if (hashResult.kind === "tokens") return { kind: "completing" };
    if (hashResult.kind === "error") {
      return { kind: "error", message: hashResult.message };
    }
    return callbackError
      ? { kind: "error", message: callbackError }
      : { kind: "idle" };
  });
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (hashResult.kind !== "tokens") return;
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth
      .setSession({
        access_token: hashResult.accessToken,
        refresh_token: hashResult.refreshToken,
      })
      .then(({ error }) => {
        if (cancelled) return;
        if (error) {
          setStatus({ kind: "error", message: error.message });
          return;
        }
        router.replace(next);
        router.refresh();
      });
    return () => {
      cancelled = true;
    };
  }, [hashResult, next, router]);

  const callbackUrl = (extra: string) =>
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          extra
        )}`
      : "";

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus({ kind: "error", message: "Enter a valid email." });
      return;
    }
    setStatus({ kind: "sending" });
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl(next),
      },
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setStatus({ kind: "sent" });
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl(next),
      },
    });
    if (error) {
      setGoogleLoading(false);
      setStatus({ kind: "error", message: error.message });
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[color:var(--accent)] flex items-center justify-center text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight">Vibe Check</h1>
          <p className="text-sm text-[color:var(--muted)] leading-tight">
            Pressure-test your app idea
          </p>
        </div>
      </div>

      <p className="text-sm text-[color:var(--muted)] mb-6">
        Sign in to save your vibe checks across devices.
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || status.kind === "sending"}
        className="w-full flex items-center justify-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] py-2.5 px-4 text-sm font-medium hover:bg-[color:var(--card)] transition disabled:opacity-60 disabled:cursor-not-allowed mb-4"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 my-4 text-xs uppercase tracking-wider text-[color:var(--muted)]">
        <div className="flex-1 h-px bg-[color:var(--border)]" />
        or
        <div className="flex-1 h-px bg-[color:var(--border)]" />
      </div>

      {status.kind === "completing" ? (
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4 text-sm">
          <div className="font-medium mb-1">Signing you in…</div>
          <div className="text-[color:var(--muted)]">
            Completing your magic-link session.
          </div>
        </div>
      ) : status.kind === "sent" ? (
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4 text-sm">
          <div className="font-medium mb-1">Check your inbox</div>
          <div className="text-[color:var(--muted)]">
            We sent a magic link to <b>{email}</b>. Click it to sign in.
          </div>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="mt-3 text-xs text-[color:var(--accent)] hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-3">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--accent)] transition"
            disabled={status.kind === "sending"}
          />
          <button
            type="submit"
            disabled={status.kind === "sending"}
            className="w-full rounded-lg bg-[color:var(--accent)] text-white py-2.5 px-4 text-sm font-medium hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status.kind === "sending" ? "Sending…" : "Email me a magic link"}
          </button>
          {status.kind === "error" && (
            <p className="text-sm text-[color:var(--bad)]">{status.message}</p>
          )}
        </form>
      )}

      <p className="mt-6 text-xs text-[color:var(--muted)]">
        By signing in you agree to our terms. We only use your email to
        authenticate — no marketing.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="18"
      height="18"
      aria-hidden
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.1l6.6 4.8C14.7 15.2 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.6l6.2 5.2C41.1 35 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
