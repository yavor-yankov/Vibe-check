/**
 * Shared Zod schemas for API request body validation.
 *
 * Enforcing hard size limits on incoming payloads prevents:
 * - Malformed data crashing the server with cryptic errors
 * - Oversized messages exhausting AI token budgets
 * - History padding attacks that sneak extra tokens past the quota gate
 */

import { z } from "zod";

/** Locale enum shared across request bodies. */
export const LocaleSchema = z.enum(["en", "bg"]).optional().default("en");

/** Single chat message — mirrors the ChatMessage type from @/lib/types. */
export const ChatMessageSchema = z.object({
  id: z.string().max(128),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(8_000, "Message content must be 8 000 chars or fewer"),
  createdAt: z.number(),
});

/** Array of chat messages with a hard cap to prevent history-padding. */
export const MessagesSchema = z
  .array(ChatMessageSchema)
  .max(30, "messages array must not exceed 30 items");

/** Single competitor row — mirrors the Competitor type. */
export const CompetitorSchema = z.object({
  title: z.string().max(300).transform((v) => v.slice(0, 300)),
  url: z.string().url().max(2_000),
  // Tavily can return very long snippets. Truncate silently rather than
  // rejecting the whole request — the AI prompt only uses the first
  // ~400 chars anyway.
  snippet: z.string().transform((v) => v.slice(0, 2_000)),
});

/** Idea summary (used across /api/chat, /api/analyze, /api/search, /api/redteam). */
export const IdeaSummarySchema = z
  .string()
  .min(1, "ideaSummary is required")
  .max(2_000, "ideaSummary must be 2 000 chars or fewer");

// ---------------------------------------------------------------------------
// Per-route request body schemas
// ---------------------------------------------------------------------------

export const ChatBodySchema = z.object({
  messages: MessagesSchema,
  locale: LocaleSchema,
});

export const FounderProfileSchema = z.object({
  domainExpertise: z.enum(["none", "some", "deep"]),
  technicalAbility: z.enum(["non-technical", "can-code", "senior-engineer"]),
  runway: z.enum(["side-project", "3-months", "6-months-plus"]),
  timeCommitment: z.enum(["nights-weekends", "part-time", "full-time"]),
  priorExperience: z.enum(["first-time", "one-prior", "serial"]),
}).optional();

export const AnalyzeBodySchema = z.object({
  messages: MessagesSchema.optional().default([]),
  ideaSummary: IdeaSummarySchema,
  competitors: z.array(CompetitorSchema).max(20).optional().default([]),
  founderProfile: FounderProfileSchema,
  locale: LocaleSchema,
});

export const SearchBodySchema = z.object({
  ideaSummary: IdeaSummarySchema,
  locale: LocaleSchema,
});

export const RedTeamBodySchema = z.object({
  ideaSummary: IdeaSummarySchema,
  messages: MessagesSchema.optional().default([]),
  competitors: z.array(CompetitorSchema).max(20).optional().default([]),
  // We pass the full report back for context — strip it down to a bounded
  // subset rather than accepting the entire AnalysisReport shape.
  report: z
    .object({
      verdict: z.string().max(32),
      verdictLabel: z.string().max(128),
      summary: z.string().max(4_000),
      risks: z.array(z.string().max(500)).max(20).optional().default([]),
    })
    .nullable()
    .optional(),
  locale: LocaleSchema,
});

// ---------------------------------------------------------------------------
// Helper: parse body or return a 400 Response
// ---------------------------------------------------------------------------

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

export function parseBody<T>(
  schema: z.ZodType<T>,
  raw: unknown
): ParseResult<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    // Zod v4 uses `.issues`; Zod v3 uses `.errors` — use issues for v4 compat.
    const message = result.error.issues
      .map((e) => `${e.path.join(".") || "body"}: ${e.message}`)
      .join("; ");
    return {
      ok: false,
      response: Response.json({ error: message }, { status: 400 }),
    };
  }
  return { ok: true, data: result.data };
}
