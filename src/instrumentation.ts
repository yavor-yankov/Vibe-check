/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Used for fail-fast environment validation.
 */

export function register() {
  // Only validate on the server (Node.js runtime), not during build or edge.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to avoid pulling server-only into edge/build.
    import("@/lib/env").then(({ validateEnv }) => {
      validateEnv();
    });
  }
}
