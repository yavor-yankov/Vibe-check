import { NextRequest } from "next/server";
import { getGeminiClient, modelForTier } from "@/lib/gemini";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts";
import { consumeUsage, refundUsage } from "@/lib/billing/usage";
import type {
  AnalysisReport,
  ChatMessage,
  Competitor,
} from "@/lib/types";

export const runtime = "nodejs";

interface AnalyzeRequestBody {
  messages: ChatMessage[];
  ideaSummary: string;
  competitors: Competitor[];
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  // strip code fences if present
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  // try to find first { ... last }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  let body: AnalyzeRequestBody;
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { messages, ideaSummary, competitors } = body;
  if (!ideaSummary) {
    return Response.json(
      { error: "ideaSummary is required" },
      { status: 400 }
    );
  }

  // Resolve the Gemini client FIRST so a missing API key never burns a
  // quota slot. Only once we know the downstream call is reachable do we
  // consume a check.
  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini not configured";
    return Response.json({ error: msg }, { status: 500 });
  }

  // Quota + plan gate — a successful analyze counts as "one vibe check"
  // against the monthly budget. Quota errors surface as 402 so the client
  // can show the upgrade CTA without treating it like a server crash.
  let plan;
  try {
    plan = await consumeUsage();
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === "QUOTA_EXCEEDED") {
      return Response.json({ error: e.message }, { status: 402 });
    }
    const msg = e instanceof Error ? e.message : "Not authenticated";
    return Response.json({ error: msg }, { status: 401 });
  }

  const transcript = (messages ?? [])
    .map((m) => `${m.role === "user" ? "Founder" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const competitorBlock =
    competitors && competitors.length > 0
      ? competitors
          .map(
            (c, i) =>
              `${i + 1}. ${c.title} — ${c.url}\n   ${c.snippet.slice(0, 400)}`
          )
          .join("\n")
      : "(no competitors found via web search)";

  const userPrompt = `# Idea summary\n${ideaSummary}\n\n# Interview transcript\n${transcript}\n\n# Competitors found on the web\n${competitorBlock}\n\nReturn ONLY the JSON described in your instructions.`;

  const model = client.getGenerativeModel({
    model: modelForTier(plan.tier),
    systemInstruction: ANALYSIS_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.6,
    },
  });

  try {
    const result = await model.generateContent(userPrompt);
    const raw = result.response.text();
    const jsonStr = extractJson(raw);
    const report = JSON.parse(jsonStr) as AnalysisReport;
    return Response.json({ report });
  } catch (err) {
    // Analysis failed after we already charged the user — roll the slot
    // back so transient Gemini errors don't eat free-tier quota.
    await refundUsage(plan.userId, plan.usageMonth);
    const msg = err instanceof Error ? err.message : "analysis failed";
    return Response.json(
      { error: `Failed to generate analysis: ${msg}` },
      { status: 500 }
    );
  }
}
