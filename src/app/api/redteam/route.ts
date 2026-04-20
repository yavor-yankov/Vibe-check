import { NextRequest } from "next/server";
import { getGeminiClient, modelForTier, friendlyAIError, geminiCall } from "@/lib/gemini";
import { RED_TEAM_SYSTEM_PROMPT } from "@/lib/prompts";
import { getPlanSnapshot } from "@/lib/billing/usage";
import { RedTeamBodySchema, parseBody } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { RedTeamReport } from "@/lib/types";

export const runtime = "nodejs";

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

  const parsed = parseBody(RedTeamBodySchema, raw);
  if (!parsed.ok) return parsed.response;
  const { ideaSummary, messages, competitors, report } = parsed.data;

  // Red-team doesn't consume monthly quota — it's part of the same
  // vibe check that /api/analyze already charged. But we still need the
  // plan to pick the right model, and we 401 if somehow unauthenticated.
  const plan = await getPlanSnapshot();
  if (!plan) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limiting — 20 req/min per user. Disabled when Upstash env vars absent.
  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) return rateLimitExceededResponse(rl.reset);

  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    const msg = friendlyAIError(err);
    return Response.json({ error: msg }, { status: 500 });
  }

  const transcript = (messages ?? [])
    .map((m) => `${m.role === "user" ? "Founder" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const competitorBlock =
    competitors && competitors.length > 0
      ? competitors
          .map((c, i) => `${i + 1}. ${c.title} — ${c.url}`)
          .join("\n")
      : "(no competitors found via web search)";

  const reportBlock = report
    ? `Prior constructive verdict: ${report.verdict} — ${report.verdictLabel}\nKnown risks already surfaced:\n${(report.risks ?? []).map((r) => `- ${r}`).join("\n")}`
    : "(no prior analysis report)";

  const userPrompt = `# Idea summary\n${ideaSummary}\n\n# Interview transcript\n${transcript || "(no transcript)"}\n\n# Competitors found on the web\n${competitorBlock}\n\n# Prior analysis context\n${reportBlock}\n\nReturn ONLY the JSON described in your instructions. Focus on specific, concrete failure modes — not generic platitudes. Do not repeat risks already listed above unless you're sharpening them with a new angle.`;

  const model = client.getGenerativeModel({
    model: modelForTier(plan.tier),
    systemInstruction: RED_TEAM_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });

  try {
    const result = await geminiCall(() => model.generateContent(userPrompt));
    const raw = result.response.text();
    const jsonStr = extractJson(raw);
    const redTeam = JSON.parse(jsonStr) as RedTeamReport;
    return Response.json({ redTeam });
  } catch (err) {
    const log = logger.child({ route: "redteam" });
    log.error({ err }, "Red-team pass failed");
    return Response.json(
      { error: "Failed to run red-team analysis. Please try again." },
      { status: 500 }
    );
  }
}
