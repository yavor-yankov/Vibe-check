import { NextRequest } from "next/server";
import { modelChainForTier, aiCallWithFallback, generateContent } from "@/lib/ai";
import { getPersonaPrompt } from "@/lib/prompts";
import { getPlanSnapshot } from "@/lib/billing/usage";
import { RedTeamBodySchema, parseBody } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { Persona } from "@/lib/types";

export const runtime = "nodejs";

const log = logger.child({ route: "/api/personas" });

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Reuse RedTeamBodySchema — same shape (ideaSummary + messages + competitors + report)
  const parsed = parseBody(RedTeamBodySchema, raw);
  if (!parsed.ok) return parsed.response;
  const { ideaSummary, messages, competitors, locale } = parsed.data;

  const plan = await getPlanSnapshot();
  if (!plan) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) return rateLimitExceededResponse(rl.reset);

  const transcript = (messages ?? [])
    .map((m) => `${m.role === "user" ? "Founder" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const competitorBlock =
    competitors && competitors.length > 0
      ? competitors.map((c, i) => `${i + 1}. ${c.title} — ${c.url}`).join("\n")
      : "(no competitors found)";

  const userPrompt = `# Idea summary\n${ideaSummary}\n\n# Interview transcript\n${transcript || "(no transcript)"}\n\n# Competitors\n${competitorBlock}\n\nGenerate 3-5 realistic user personas who would encounter this product. Return ONLY the JSON.`;

  const models = modelChainForTier(plan.tier);

  try {
    const rawText = await aiCallWithFallback(models, (modelName) =>
      generateContent({
        model: modelName,
        systemPrompt: getPersonaPrompt(locale),
        userPrompt,
        jsonMode: true,
        temperature: 0.9,
      })
    );
    const jsonStr = extractJson(rawText);
    const data = JSON.parse(jsonStr) as { personas?: Persona[] };
    const personas = (data.personas ?? []).filter(
      (p): p is Persona =>
        typeof p.name === "string" &&
        typeof p.role === "string" &&
        typeof p.quote === "string"
    );
    return Response.json({ personas });
  } catch (err) {
    log.error({ err }, "Persona simulation failed");
    return Response.json(
      { error: "Failed to generate personas. Please try again." },
      { status: 500 }
    );
  }
}
