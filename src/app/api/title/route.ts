import { NextRequest } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { getPlanSnapshot } from "@/lib/billing/usage";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  /** The user's opening message / seed idea (first turn of the interview). */
  seed: z.string().min(1).max(2000),
});

/**
 * POST /api/title
 *
 * Generates a short session title (≤50 chars, plain text, no quotes) from the
 * user's first message. Called client-side after the first assistant reply
 * arrives so the sidebar label becomes meaningful.
 *
 * Uses the smallest/fastest Gemini model regardless of subscription tier
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
  const { seed } = parsed.data;

  const plan = await getPlanSnapshot();
  if (!plan) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate-limit guard shared with the other AI routes.
  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) return rateLimitExceededResponse(rl.reset);

  let client;
  try {
    client = getGeminiClient();
  } catch {
    // If Gemini isn't configured, fall back gracefully — the caller already
    // has a reasonable default title from the seed text.
    return Response.json({ title: null });
  }

  // Always use the Flash model — title generation is cheap, fast, and does
  // not benefit from a larger model. We never want this to burn the user's
  // quota or noticeably increase latency.
  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: { temperature: 0.4, maxOutputTokens: 30 },
  });

  const prompt = `Create a short title (3–7 words, plain text, no quotes, no punctuation at the end) that captures the core idea from this startup pitch. Return ONLY the title, nothing else.

Startup pitch: """${seed.slice(0, 500)}"""`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/^["']|["']$/g, "");
    // Truncate to 60 chars as a safety net.
    const title = raw.slice(0, 60) || null;
    return Response.json({ title });
  } catch {
    // Non-fatal — the client degrades to the seed-truncation fallback.
    return Response.json({ title: null });
  }
}
