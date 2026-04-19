import "server-only";
/**
 * Per-user rate limiting for AI/search API routes.
 *
 * Uses Upstash Redis + @upstash/ratelimit with a sliding window algorithm.
 * Enforces 20 requests per minute per user to prevent LLM quota abuse and
 * runaway billing in the event of a compromised account or buggy client.
 *
 * GRACEFUL DEGRADATION: When UPSTASH_REDIS_REST_URL / TOKEN are absent
 * (local dev without Redis, Vercel preview without the add-on) the limiter
 * is disabled and every call is allowed through. This keeps developer
 * experience smooth while still protecting production.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Singleton — shared across all route handler invocations in the same
// Node worker process.  Next.js hot-reloads reset this in dev, which is fine.
let rateLimiter: Ratelimit | null = null;
let rateLimiterEnabled = false;

function getRateLimiter(): Ratelimit | null {
  if (rateLimiter !== null) return rateLimiterEnabled ? rateLimiter : null;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Env vars absent — disable silently.
    rateLimiter = null as unknown as Ratelimit; // sentinel to avoid re-checking
    rateLimiterEnabled = false;
    console.info(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled"
    );
    return null;
  }

  try {
    const redis = new Redis({ url, token });
    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: false,
      prefix: "vibe-check:rl",
    });
    rateLimiterEnabled = true;
    console.info("[rate-limit] Upstash rate limiter initialised (20 req/min)");
  } catch (err) {
    console.error("[rate-limit] Failed to initialise — disabling", err);
    rateLimiter = null as unknown as Ratelimit;
    rateLimiterEnabled = false;
  }

  return rateLimiterEnabled ? rateLimiter : null;
}

/**
 * Check rate limit for a given identifier (typically the signed-in user ID
 * or IP address for unauthenticated requests).
 *
 * Returns null when rate limiting is disabled (missing env vars), otherwise
 * returns the Upstash `{ success, remaining, reset }` result so callers can
 * forward `Retry-After` headers.
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix epoch seconds
}

export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult | null> {
  const limiter = getRateLimiter();
  if (!limiter) return null; // disabled — allow through

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    // Redis unavailable — fail open so a transient Redis outage doesn't
    // take the whole app down.
    console.error("[rate-limit] Redis error — allowing request through", err);
    return null;
  }
}

/**
 * Helper that returns a ready-made 429 Response with the correct headers.
 * Call this when `checkRateLimit` returns `{ success: false }`.
 */
export function rateLimitExceededResponse(reset: number): Response {
  const retryAfter = Math.max(0, Math.ceil(reset - Date.now() / 1000));
  return Response.json(
    {
      error:
        "Too many requests. You've exceeded the 20 requests per minute limit. Please slow down.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}
