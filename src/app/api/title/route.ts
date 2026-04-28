import { NextRequest } from "next/server";
import { aiCall, generateContent, MODEL_NAME } from "@/lib/ai";
import { getTitlePromptSuffix } from "@/lib/prompts";
import { getPlanSnapshot } from "@/lib/billing/usage";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  /** The user's opening message / seed idea (first turn of the interview). */
  seed: z.string().min(1).max(2000),
  locale: z.enum(["en", "bg"]).optional().default("en"),
});

/**
 * POST /api/title
 *
 * Generates a short session title (≤50 chars, plain text, no quotes) from the
 * user's first message. Called client-side after the first assistant reply
 * arrives so the sidebar label becomes meaningful.
 *
 * Uses the smallest/fastest AI model regardless of subscription tier
 * because title generation is cheap and doesn't consume a quota slot.
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Bad request" },
      { status: 400 }
    );
  }
  const { seed, locale } = parsed.data;

  const plan = await getPlanSnapshot();
  if (!plan) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate-limit guard shared with the other AI routes.
  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) return rateLimitExceededResponse(rl.reset);

  const systemPrompt = `Create a short title (3-7 words, plain text, no quotes, no punctuation at the end) that captures the core idea from a startup pitch. Return ONLY the title, nothing else.${getTitlePromptSuffix(locale)}`;

  const userPrompt = `Startup pitch: """${seed.slice(0, 500)}"""`;

  try {
    const raw = await aiCall(() =>
      generateContent({
        model: MODEL_NAME,
        systemPrompt,
        userPrompt,
        temperature: 0.4,
      })
    );
    const cleaned = raw.trim().replace(/^["']|["']$/g, "");
    // Truncate to 60 chars as a safety net.
    const title = cleaned.slice(0, 60) || null;
    return Response.json({ title });
  } catch {
    // Non-fatal — the client degrades to the seed-truncation fallback.
    return Response.json({ title: null });
  }
}
