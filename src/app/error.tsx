"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console so it shows in server logs / error tracking
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-[color:var(--bad)]/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-[color:var(--bad)]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-[color:var(--muted)] text-sm mb-6">
          An unexpected error occurred. If this keeps happening, please refresh
          the page or contact support.
        </p>
        {error.digest && (
          <p className="text-xs text-[color:var(--muted)] font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] text-white px-5 py-2.5 text-sm font-medium hover:brightness-110 transition"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    </div>
  );
}
