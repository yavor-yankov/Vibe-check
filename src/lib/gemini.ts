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
 * Return an ordered list of models to try for a given tier.
 * On 429, geminiCall will fall through to the next model in the chain.
 * Each model has its own rate limit bucket, so switching models
 * effectively bypasses the exhausted quota.
 */
export function modelChainForTier(tier: SubscriptionTier): string[] {
  if (process.env.GEMINI_MODEL) return [process.env.GEMINI_MODEL];

  const primary = getTier(tier).geminiModel;

  // Build a fallback chain — deduplicated, primary first
  const chain: string[] = [primary];
  const fallbacks =
    tier === "free"
      ? ["gemini-2.0-flash-lite", "gemini-2.0-flash"]
      : ["gemini-2.5-flash-lite", "gemini-2.0-flash"];

  for (const m of fallbacks) {
    if (!chain.includes(m)) chain.push(m);
  }
  return chain;
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

function isRateLimited(err: unknown): boolean {
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
  maxRetries = 2,
  baseDelayMs = 1500
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= maxRetries || !isRateLimited(err)) throw err;
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
 * wait. Each call retries up to 2 times on transient 429/503 errors.
 */
export async function geminiCall<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await withRetry(fn);
  } finally {
    releaseSlot();
  }
}

/**
 * Try a Gemini call with automatic model fallback on 429.
 * Accepts a factory that receives a model name and returns the promise.
 * Walks through the model chain for the tier — each model has its own
 * rate limit bucket, so switching models bypasses exhausted quotas.
 */
export async function geminiCallWithFallback<T>(
  models: string[],
  fn: (modelName: string) => Promise<T>
): Promise<T> {
  await acquireSlot();
  try {
    let lastErr: unknown;
    for (let i = 0; i < models.length; i++) {
      try {
        return await withRetry(() => fn(models[i]));
      } catch (err) {
        lastErr = err;
        // Only fall through to next model on rate limit errors
        if (!isRateLimited(err) || i >= models.length - 1) throw err;
        // Small pause before trying next model
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw lastErr;
  } finally {
    releaseSlot();
  }
}
