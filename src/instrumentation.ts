/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Used for Sentry initialization and fail-fast environment validation.
 */

import { type Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry for server-side error tracking.
    await import("../sentry.server.config");

    // Validate environment variables (fail-fast on misconfiguration).
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(err, request, context);
};
