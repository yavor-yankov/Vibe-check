/**
 * AI provider abstraction — Groq (Llama 3.3 70B) via OpenAI-compatible API.
 *
 * Replaces the previous Gemini-only backend. Uses the OpenAI SDK pointed
 * at Groq's endpoint. All exported functions maintain the same interface
 * so API routes need minimal changes.
 *
 * Set GROQ_API_KEY in .env.local. Get a free key at https://console.groq.com
 */

import OpenAI from "openai";
import type { SubscriptionTier } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let _client: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (_client) return _client;
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not set. Get a free key at https://console.groq.com"
    );
  }
  _client = new OpenAI({
    apiKey: key,
    baseURL: "https://api.groq.com/openai/v1",
  });
  return _client;
}

// ---------------------------------------------------------------------------
// Model selection
// ---------------------------------------------------------------------------

// Groq model names — Llama 3.3 70B is the best free option.
// Override globally via AI_MODEL env var.
export const MODEL_NAME =
  process.env.AI_MODEL || "llama-3.3-70b-versatile";

export function modelForTier(_tier: SubscriptionTier): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  // All tiers get the same model on Groq (no per-model rate limits like Gemini)
  return "llama-3.3-70b-versatile";
}

export function modelChainForTier(_tier: SubscriptionTier): string[] {
  if (process.env.AI_MODEL) return [process.env.AI_MODEL];
  // Fallback chain: 70B → 8B (much higher rate limit)
  return ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
}

// ---------------------------------------------------------------------------
// High-level helpers for API routes
// ---------------------------------------------------------------------------

export interface AIGenerateOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  temperature?: number;
}

/**
 * Non-streaming text/JSON generation. Used by analyze, redteam, personas,
 * names, search, and title routes.
 */
export async function generateContent(opts: AIGenerateOptions): Promise<string> {
  const client = getAIClient();
  const response = await client.chat.completions.create({
    model: opts.model,
    messages: [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: opts.userPrompt },
    ],
    temperature: opts.temperature ?? 0.7,
    ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  return response.choices[0]?.message?.content ?? "";
}

/**
 * Streaming chat completion. Used by the /api/chat route.
 * Returns an async iterable of text chunks.
 */
export async function streamChat(opts: {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AsyncIterable<string>> {
  const client = getAIClient();
  const stream = await client.chat.completions.create({
    model: opts.model,
    messages: [
      { role: "system", content: opts.systemPrompt },
      ...opts.messages,
    ],
    stream: true,
  });

  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Friendly error messages
// ---------------------------------------------------------------------------

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
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable")
  );
}

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
// Global request queue
// ---------------------------------------------------------------------------

const CONCURRENCY = Number(process.env.AI_CONCURRENCY) || 3;

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
    next();
  } else {
    active--;
  }
}

export async function aiCall<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await withRetry(fn);
  } finally {
    releaseSlot();
  }
}

export async function aiCallWithFallback<T>(
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
        if (!isRateLimited(err) || i >= models.length - 1) throw err;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw lastErr;
  } finally {
    releaseSlot();
  }
}
