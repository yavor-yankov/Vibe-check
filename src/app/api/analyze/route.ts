import { NextRequest } from "next/server";
import { modelChainForTier, aiCallWithFallback, generateContent } from "@/lib/gemini";
import { getAnalysisPrompt } from "@/lib/prompts";
import { consumeUsage, refundUsage } from "@/lib/billing/usage";
import { AnalyzeBodySchema, parseBody } from "@/lib/validation";
import { getFailureDatabaseContext } from "@/lib/failure-database";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { fireWebhook } from "@/lib/webhooks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { ActionPlanWeek, AnalysisReport, ExpandedInsights, LeanCanvasEntry, NextStep } from "@/lib/types";

const log = logger.child({ route: "/api/analyze" });

export const runtime = "nodejs";

// Strip `insights` entirely if the model returned a malformed payload.
// We'd rather render the original report cleanly than explode the UI on
// half-formed expanded insights.
const BUILD_EFFORT_BUCKETS: ReadonlyArray<ExpandedInsights["buildEffort"]["bucket"]> = [
  "weekend",
  "1-2 weeks",
  "1-3 months",
  "3-6 months",
  "6+ months",
];
const PRICING_MODELS: ReadonlyArray<
  ExpandedInsights["pricingBenchmarks"][number]["model"]
> = ["freemium", "subscription", "one-time", "usage-based", "free"];

function sanitizeInsights(
  raw: unknown
): ExpandedInsights | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  const ms = r.marketSize as Record<string, unknown> | undefined;
  const fs = r.fundingSignal as Record<string, unknown> | undefined;
  const be = r.buildEffort as Record<string, unknown> | undefined;

  if (!ms || typeof ms.range !== "string" || typeof ms.reasoning !== "string") {
    return undefined;
  }
  if (
    !fs ||
    typeof fs.totalRaisedInSpace !== "string" ||
    typeof fs.summary !== "string"
  ) {
    return undefined;
  }
  if (
    !be ||
    typeof be.bucket !== "string" ||
    !BUILD_EFFORT_BUCKETS.includes(
      be.bucket as ExpandedInsights["buildEffort"]["bucket"]
    ) ||
    typeof be.teamSize !== "string" ||
    typeof be.headlineRisk !== "string"
  ) {
    return undefined;
  }

  const confidence =
    ms.confidence === "low" || ms.confidence === "medium" || ms.confidence === "high"
      ? ms.confidence
      : "medium";

  const notableRaises = Array.isArray(fs.notableRaises)
    ? fs.notableRaises.filter(
        (x): x is ExpandedInsights["fundingSignal"]["notableRaises"][number] =>
          !!x &&
          typeof x === "object" &&
          typeof (x as Record<string, unknown>).company === "string" &&
          typeof (x as Record<string, unknown>).amount === "string" &&
          typeof (x as Record<string, unknown>).year === "string"
      )
    : [];

  const graveyard = Array.isArray(r.graveyard)
    ? r.graveyard.filter(
        (x): x is ExpandedInsights["graveyard"][number] =>
          !!x &&
          typeof x === "object" &&
          typeof (x as Record<string, unknown>).name === "string" &&
          typeof (x as Record<string, unknown>).year === "string" &&
          typeof (x as Record<string, unknown>).reason === "string"
      )
    : [];

  const regulatoryFlags = Array.isArray(r.regulatoryFlags)
    ? r.regulatoryFlags.filter(
        (x): x is ExpandedInsights["regulatoryFlags"][number] =>
          !!x &&
          typeof x === "object" &&
          typeof (x as Record<string, unknown>).domain === "string" &&
          typeof (x as Record<string, unknown>).note === "string" &&
          ["low", "medium", "high"].includes(
            String((x as Record<string, unknown>).severity)
          )
      )
    : [];

  const pricingBenchmarks = Array.isArray(r.pricingBenchmarks)
    ? r.pricingBenchmarks.filter(
        (x): x is ExpandedInsights["pricingBenchmarks"][number] =>
          !!x &&
          typeof x === "object" &&
          typeof (x as Record<string, unknown>).competitor === "string" &&
          typeof (x as Record<string, unknown>).freeTier === "string" &&
          typeof (x as Record<string, unknown>).paidTier === "string" &&
          typeof (x as Record<string, unknown>).model === "string" &&
          PRICING_MODELS.includes(
            (x as Record<string, unknown>)
              .model as ExpandedInsights["pricingBenchmarks"][number]["model"]
          )
      )
    : [];

  return {
    marketSize: {
      range: ms.range,
      tam: typeof ms.tam === "string" ? ms.tam : undefined,
      sam: typeof ms.sam === "string" ? ms.sam : undefined,
      som: typeof ms.som === "string" ? ms.som : undefined,
      confidence,
      reasoning: ms.reasoning,
    },
    fundingSignal: {
      totalRaisedInSpace: fs.totalRaisedInSpace,
      summary: fs.summary,
      notableRaises,
    },
    graveyard,
    buildEffort: {
      bucket: be.bucket as ExpandedInsights["buildEffort"]["bucket"],
      teamSize: be.teamSize,
      headlineRisk: be.headlineRisk,
    },
    regulatoryFlags,
    pricingBenchmarks,
    leanCanvas: sanitizeLeanCanvas(r),
    nextSteps: sanitizeNextSteps(r),
    actionPlan: sanitizeActionPlan(r),
  };
}

function sanitizeLeanCanvas(raw: Record<string, unknown>): LeanCanvasEntry[] | undefined {
  const lc = raw.leanCanvas;
  if (!Array.isArray(lc)) return undefined;
  const valid = lc.filter(
    (e): e is { section: string; content: string } =>
      typeof e === "object" && e !== null &&
      typeof (e as Record<string, unknown>).section === "string" &&
      typeof (e as Record<string, unknown>).content === "string"
  );
  return valid.length > 0 ? valid.slice(0, 9) : undefined;
}

function sanitizeNextSteps(raw: Record<string, unknown>): NextStep[] | undefined {
  const ns = raw.nextSteps;
  if (!Array.isArray(ns)) return undefined;
  const valid = ns.filter(
    (e): e is NextStep =>
      typeof e === "object" && e !== null &&
      typeof (e as Record<string, unknown>).description === "string" &&
      typeof (e as Record<string, unknown>).channel === "string" &&
      typeof (e as Record<string, unknown>).metric === "string"
  );
  return valid.length > 0 ? valid.slice(0, 5) : undefined;
}

function sanitizeActionPlan(raw: Record<string, unknown>): ActionPlanWeek[] | undefined {
  const ap = raw.actionPlan;
  if (!Array.isArray(ap)) return undefined;
  const valid = ap.filter(
    (e): e is ActionPlanWeek =>
      typeof e === "object" && e !== null &&
      typeof (e as Record<string, unknown>).week === "string" &&
      typeof (e as Record<string, unknown>).goal === "string" &&
      Array.isArray((e as Record<string, unknown>).tasks)
  );
  return valid.length > 0 ? valid.slice(0, 8) : undefined;
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
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(AnalyzeBodySchema, raw);
  if (!parsed.ok) return parsed.response;
  const { messages, ideaSummary, competitors, founderProfile, locale } = parsed.data;

  // Quota + plan gate — a successful analyze counts as "one vibe check"
  // against the monthly budget. Quota errors surface as 402 so the client
  // can show the upgrade CTA without treating it like a server crash.
  let plan;
  try {
    plan = await consumeUsage();
  } catch (err) {
    const e = err as Error & { code?: string; message?: string };
    if (e.code === "QUOTA_EXCEEDED") {
      return Response.json({ error: e.message }, { status: 402 });
    }
    // Only surface 401 when the caller truly isn't signed in. Supabase
    // PostgrestErrors aren't instanceof Error but do carry a .message;
    // treating them as 401 hides real database failures from operators
    // and triggers misleading sign-in redirects on the client.
    const isAuthError =
      e instanceof Error && e.message === "Not authenticated";
    const msg = e.message ?? "Unknown billing error";
    return Response.json(
      { error: msg },
      { status: isAuthError ? 401 : 500 }
    );
  }

  // Rate limiting — 20 req/min per user. Checked after quota so a failed
  // quota check doesn't consume a rate-limit slot.
  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) {
    // Roll back the consumed quota slot — the request won't proceed.
    await refundUsage(plan.userId, plan.usageMonth);
    return rateLimitExceededResponse(rl.reset);
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

  const founderBlock = founderProfile
    ? `# Founder profile\n- Domain expertise: ${founderProfile.domainExpertise}\n- Technical ability: ${founderProfile.technicalAbility}\n- Runway: ${founderProfile.runway}\n- Time commitment: ${founderProfile.timeCommitment}\n- Prior startup experience: ${founderProfile.priorExperience}\n\nTailor the tech stack complexity, timeline estimates, and build effort to this founder's profile.`
    : "";

  const failureDb = getFailureDatabaseContext();

  const userPrompt = `# Idea summary\n${ideaSummary}\n\n# Interview transcript\n${transcript}\n\n# Competitors found on the web\n${competitorBlock}${founderBlock ? `\n\n${founderBlock}` : ""}\n\n# Startup failure database (use for graveyard section — match by problem space, business model, or target user)\n${failureDb}\n\nReturn ONLY the JSON described in your instructions.`;

  const models = modelChainForTier(plan.tier);

  try {
    const raw = await aiCallWithFallback(models, (modelName) =>
      generateContent({
        model: modelName,
        systemPrompt: getAnalysisPrompt(locale),
        userPrompt,
        jsonMode: true,
        temperature: 0.6,
      })
    );
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr) as AnalysisReport & {
      insights?: unknown;
    };
    const report: AnalysisReport = {
      ...parsed,
      insights: sanitizeInsights(parsed.insights),
    };

    // Fire webhook — non-blocking, best-effort. We look up the saved URL
    // from the user's profile after the analysis is done so we never delay
    // the response while fetching settings upfront.
    void (async () => {
      try {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase
          .from("users")
          .select("webhook_url")
          .eq("id", plan.userId)
          .maybeSingle();
        const webhookUrl = data?.webhook_url;
        if (webhookUrl) {
          await fireWebhook(webhookUrl, {
            event: "vibe_check.completed",
            timestamp: new Date().toISOString(),
            ideaSummary,
            report,
          });
        }
      } catch (err) {
        log.warn({ err, userId: plan.userId }, "Webhook lookup/dispatch failed");
      }
    })();

    return Response.json({ report });
  } catch (err) {
    // Analysis failed after we already charged the user — roll the slot
    // back so transient AI errors don't eat free-tier quota.
    await refundUsage(plan.userId, plan.usageMonth);
    log.error({ err }, "Analysis generation failed");
    return Response.json(
      { error: "Failed to generate analysis. Please try again." },
      { status: 500 }
    );
  }
}
