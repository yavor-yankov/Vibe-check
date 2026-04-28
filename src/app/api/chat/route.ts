import { NextRequest } from "next/server";
import { modelChainForTier, friendlyAIError, aiCallWithFallback, streamChat } from "@/lib/ai";
import { getInterviewPrompt } from "@/lib/prompts";
import { getPlanSnapshot } from "@/lib/billing/usage";
import { ChatBodySchema, parseBody } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = parseBody(ChatBodySchema, raw);
  if (!parsed.ok) return parsed.response;

  const { messages, locale } = parsed.data;
  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const plan = await getPlanSnapshot();
  if (!plan) {
    return new Response(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting — 20 req/min per user. Disabled when Upstash env vars absent.
  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) return rateLimitExceededResponse(rl.reset);

  // Cap to the most recent 16 messages to stay well within token limits on
  // free-tier models. The system prompt + 16 messages ~ 4-6k tokens, leaving
  // plenty of headroom for the response.
  const MAX_HISTORY = 16;
  const recent = messages.length > MAX_HISTORY + 1
    ? messages.slice(messages.length - MAX_HISTORY - 1)
    : messages;
  const last = recent[recent.length - 1];
  if (last.role !== "user") {
    return new Response(
      JSON.stringify({ error: "Last message must be from user" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const models = modelChainForTier(plan.tier);

  try {
    // aiCallWithFallback handles queue + retry + model fallback.
    // On 429 from the primary model, it tries the next model in the chain.
    const chatHistory = recent.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "assistant" as const : "user" as const,
      content: m.content,
    }));
    const result = await aiCallWithFallback(models, (modelName) =>
      streamChat({
        model: modelName,
        systemPrompt: getInterviewPrompt(locale),
        messages: chatHistory.concat([{ role: "user" as const, content: last.content }]),
      })
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of result) {
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`\n[ERROR]: ${friendlyAIError(err)}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: friendlyAIError(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
