import { NextRequest } from "next/server";
import { z } from "zod";
import { getGeminiClient, modelForTier } from "@/lib/gemini";
import { RED_TEAM_SYSTEM_PROMPT } from "@/lib/prompts";
import { getPlanSnapshot } from "@/lib/billing/usage";
import type { AnalysisReport, RedTeamReport } from "@/lib/types";

export const runtime = "nodejs";

const CompetitorSchema = z.object({
  title: z.string().max(300),
  url: z.string().url(),
  snippet: z.string().max(1000),
});

const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(8000),
  createdAt: z.number(),
});

const RedTeamRequestSchema = z.object({
  ideaSummary: z.string().min(1).max(2000),
  messages: z.array(ChatMessageSchema).max(100).optional(),
  competitors: z.array(CompetitorSchema).max(20).optional(),
  report: z.unknown().optional(),
});

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
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RedTeamRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { ideaSummary, messages, competitors } = parsed.data;
  // report is passed through as opaque context for the LLM prompt; we only
  // access known fields so cast it to AnalysisReport for convenience.
  const report = (parsed.data.report ?? null) as AnalysisReport | null;

  // Red-team doesn't consume monthly quota — it's part of the same
  // vibe check that /api/analyze already charged. But we still need the
  // plan to pick the right model, and we 401 if somehow unauthenticated.
  const plan = await getPlanSnapshot();
  if (!plan) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini not configured";
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
    const result = await model.generateContent(userPrompt);
    const raw = result.response.text();
    const jsonStr = extractJson(raw);
    const redTeam = JSON.parse(jsonStr) as RedTeamReport;
    return Response.json({ redTeam });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "red-team failed";
    return Response.json(
      { error: `Failed to run red-team pass: ${msg}` },
      { status: 500 }
    );
  }
}
