import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay is expensive; only capture on errors.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  // Scrub sensitive data from breadcrumbs and events.
  beforeSend(event) {
    // Remove any user-typed idea content from error reports.
    if (event.request?.data) {
      event.request.data = "[Filtered]";
    }
    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    // Don't capture fetch body payloads (may contain user ideas).
    if (breadcrumb.category === "fetch" && breadcrumb.data) {
      delete breadcrumb.data.body;
    }
    return breadcrumb;
  },
});
