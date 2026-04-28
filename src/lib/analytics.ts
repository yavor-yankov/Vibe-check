/**
 * Lightweight analytics event tracking.
 *
 * Supports Plausible (if script loaded) and Vercel Analytics (if enabled).
 * Falls back silently to no-op when neither is available.
 */

type EventName =
  | "check_started"
  | "check_completed"
  | "share_clicked"
  | "pdf_downloaded"
  | "upgrade_clicked"
  | "onboarding_completed"
  | "onboarding_skipped";

interface EventProps {
  [key: string]: string | number | boolean;
}

export function trackEvent(name: EventName, props?: EventProps): void {
  try {
    // Plausible Analytics (custom events)
    if (typeof window !== "undefined" && "plausible" in window) {
      (window as unknown as { plausible: (name: string, opts?: { props: EventProps }) => void })
        .plausible(name, props ? { props } : undefined);
    }

    // Vercel Analytics (if va is loaded)
    if (typeof window !== "undefined" && "va" in window) {
      (window as unknown as { va: (event: string, props?: EventProps) => void })
        .va(name, props);
    }
  } catch {
    // Analytics should never break the app.
  }
}
