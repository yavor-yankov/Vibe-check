import { NextRequest } from "next/server";
import { getGeminiClient, modelForTier, friendlyAIError } from "@/lib/gemini";
import { NAME_SUGGESTION_SYSTEM_PROMPT } from "@/lib/prompts";
import { getPlanSnapshot } from "@/lib/billing/usage";
import { SearchBodySchema, parseBody } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { NameSuggestion } from "@/lib/types";

export const runtime = "nodejs";

const log = logger.child({ route: "/api/names" });

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

/** Best-effort domain availability check via DNS-based heuristic. */
async function checkDomainAvailability(domain: string): Promise<boolean | null> {
  try {
    // Use a simple fetch to a WHOIS-like API. If unavailable, return null.
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { Answer?: unknown[] };
    // If there are DNS A records, the domain is taken.
    return !data.Answer || data.Answer.length === 0;
  } catch {
    return null; // Can't determine — show as "unknown"
  }
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Reuse SearchBodySchema — just needs ideaSummary
  const parsed = parseBody(SearchBodySchema, raw);
  if (!parsed.ok) return parsed.response;
  const { ideaSummary } = parsed.data;

  const plan = await getPlanSnapshot();
  if (!plan) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) return rateLimitExceededResponse(rl.reset);

  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    const msg = friendlyAIError(err);
    return Response.json({ error: msg }, { status: 500 });
  }

  const model = client.getGenerativeModel({
    model: modelForTier(plan.tier),
    systemInstruction: NAME_SUGGESTION_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 1.0,
    },
  });

  try {
    const result = await model.generateContent(ideaSummary);
    const rawText = result.response.text();
    const jsonStr = extractJson(rawText);
    const data = JSON.parse(jsonStr) as {
      names?: Array<{ name: string; domain: string; tagline: string }>;
    };

    const rawNames = (data.names ?? []).filter(
      (n) => typeof n.name === "string" && typeof n.domain === "string"
    );

    // Check domain availability in parallel (best-effort, with 3s timeout each)
    const names: NameSuggestion[] = await Promise.all(
      rawNames.slice(0, 5).map(async (n) => {
        const available = await checkDomainAvailability(n.domain);
        return {
          name: n.name,
          domain: n.domain,
          available,
          tagline: n.tagline ?? "",
        };
      })
    );

    return Response.json({ names });
  } catch (err) {
    log.error({ err }, "Name suggestion generation failed");
    return Response.json(
      { error: "Failed to generate name suggestions. Please try again." },
      { status: 500 }
    );
  }
}
