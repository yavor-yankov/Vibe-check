import "server-only";
/**
 * Fire-and-forget webhook delivery.
 *
 * After a successful vibe check, the analyze route calls `fireWebhook` with
 * the user's saved webhook URL (if any) and the finished report payload. The
 * call is intentionally non-blocking: failures are logged but never propagate
 * to the caller so the user always gets their report even if the downstream
 * integration is down.
 *
 * Delivery guarantees:
 *  - Single attempt with a 10-second timeout.
 *  - POST with Content-Type: application/json.
 *  - Signed with HMAC-SHA-256 when WEBHOOK_SECRET is set (X-Vibe-Signature).
 *  - Non-2xx responses are treated as delivery failures (logged, not thrown).
 */

import { createHash, createHmac } from "crypto";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "webhooks" });

export interface WebhookPayload {
  event: "vibe_check.completed";
  /** ISO-8601 timestamp */
  timestamp: string;
  ideaSummary: string;
  report: unknown;
}

/**
 * POST `payload` to `url`. Never throws — failures are logged only.
 * Returns `true` on a 2xx response, `false` otherwise.
 */
export async function fireWebhook(
  url: string,
  payload: WebhookPayload
): Promise<boolean> {
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "VibeCheck-Webhook/1.0",
    "X-Vibe-Event": payload.event,
  };

  // Optionally sign the payload so the receiver can verify authenticity.
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const sig = createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    headers["X-Vibe-Signature"] = `sha256=${sig}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      log.warn(
        { url, status: response.status },
        "Webhook delivery failed — non-2xx response"
      );
      return false;
    }

    log.info({ url, status: response.status }, "Webhook delivered");
    return true;
  } catch (err) {
    const isTimeout =
      err instanceof Error && err.name === "AbortError";
    log.warn(
      { err, url, timedOut: isTimeout },
      isTimeout ? "Webhook delivery timed out" : "Webhook delivery error"
    );
    return false;
  }
}

/**
 * Returns a short content-based fingerprint of a URL (for display, not security).
 */
export function webhookUrlFingerprint(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 8);
}
