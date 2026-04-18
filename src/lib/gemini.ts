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
