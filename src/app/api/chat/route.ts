import { NextRequest } from "next/server";
import { getGeminiClient, MODEL_NAME } from "@/lib/gemini";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: ChatMessage[];
}

export async function POST(request: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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
    model: MODEL_NAME,
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
          const msg = err instanceof Error ? err.message : "stream error";
          controller.enqueue(encoder.encode(`\n[ERROR]: ${msg}`));
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
    const msg = err instanceof Error ? err.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
