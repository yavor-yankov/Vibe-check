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
