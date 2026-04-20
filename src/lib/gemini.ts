import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTier } from "@/lib/billing/plan";
import type { SubscriptionTier } from "@/lib/supabase/database.types";

export function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenerativeAI(key);
}

// Default fallback when we don't know the caller's plan (e.g. internal
// utilities). Most API routes pick a plan-specific model via modelForTier
// below.
export const MODEL_NAME =
  process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

/**
 * Resolve which Gemini model to use for a given subscription tier.
 * GEMINI_MODEL env var is honored when set (lets us downshift globally
 * if we're rate-limited); otherwise we use the per-tier default.
 */
export function modelForTier(tier: SubscriptionTier): string {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  return getTier(tier).geminiModel;
}

/**
 * Return a user-friendly message for Gemini / AI errors.
 * Keeps technical details out of production responses.
 */
export function friendlyAIError(err: unknown): string {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = msg.toLowerCase();

  if (lower.includes("429") || lower.includes("rate") || lower.includes("quota") || lower.includes("resource has been exhausted")) {
    return "We're experiencing high demand right now. Please wait a moment and try again.";
  }
  if (lower.includes("403") || lower.includes("permission") || lower.includes("api key")) {
    return "AI service is temporarily unavailable. Please try again later.";
  }
  if (lower.includes("timeout") || lower.includes("deadline")) {
    return "The request took too long. Please try again.";
  }
  if (lower.includes("500") || lower.includes("internal") || lower.includes("server error")) {
    return "The AI service encountered an issue. Please try again in a moment.";
  }
  // Generic fallback — still no raw internals
  return "Something went wrong. Please try again.";
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

function isRetryable(err: unknown): boolean {
  const msg =
    (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("quota") ||
    msg.includes("resource has been exhausted") ||
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable")
  );
}

/**
 * Retry a function up to `maxRetries` times with exponential backoff
 * when the error looks like a transient rate limit / overload.
 * Non-retryable errors are thrown immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= maxRetries || !isRetryable(err)) throw err;
      // Exponential backoff: 2s, 4s, 8s + jitter
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Global request queue — serializes Gemini calls to avoid burst 429s
// ---------------------------------------------------------------------------

const CONCURRENCY = Number(process.env.GEMINI_CONCURRENCY) || 2;

let active = 0;
const waiting: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (active < CONCURRENCY) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}

function releaseSlot(): void {
  const next = waiting.shift();
  if (next) {
    next(); // hand the slot to the next waiter
  } else {
    active--;
  }
}

/**
 * Run a Gemini call through the global queue + retry pipeline.
 * At most CONCURRENCY (default 2) calls run in parallel; the rest
 * wait. Each call retries up to 3 times on transient 429/503 errors.
 */
export async function geminiCall<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await withRetry(fn);
  } finally {
    releaseSlot();
  }
}
