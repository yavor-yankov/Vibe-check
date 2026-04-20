import { NextRequest } from "next/server";
import { getGeminiClient, modelForTier, friendlyAIError } from "@/lib/gemini";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/prompts";
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

  const { messages } = parsed.data;
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

  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini not configured";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const model = client.getGenerativeModel({
    model: modelForTier(plan.tier),
    systemInstruction: INTERVIEW_SYSTEM_PROMPT,
  });

  // Gemini expects history with user/model roles. First turn is the user's seed idea.
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return new Response(
      JSON.stringify({ error: "Last message must be from user" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(last.content);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
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
