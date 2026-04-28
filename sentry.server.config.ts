import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% in production.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Scrub sensitive data — user ideas should never appear in Sentry.
  beforeSend(event) {
    if (event.request?.data) {
      event.request.data = "[Filtered]";
    }
    // Strip API keys from environment context.
    if (event.contexts?.runtime?.environment) {
      const env = event.contexts.runtime.environment as Record<string, unknown>;
      for (const key of Object.keys(env)) {
        if (/KEY|SECRET|TOKEN|PASSWORD/i.test(key)) {
          env[key] = "[Filtered]";
        }
      }
    }
    return event;
  },
});
