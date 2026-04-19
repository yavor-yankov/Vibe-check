import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fireWebhook } from "@/lib/webhooks";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const log = logger.child({ route: "/api/settings/webhook" });

const PatchSchema = z.object({
  webhookUrl: z
    .string()
    .trim()
    .max(2048, "URL too long")
    .refine(
      (v) =>
        v === "" ||
        /^https:\/\//.test(v) ||
        /^http:\/\/localhost/.test(v) ||
        /^http:\/\/127\.0\.0\.1/.test(v),
      "Only https:// URLs are allowed (or http://localhost for testing)"
    )
    .nullable(),
});

/** GET /api/settings/webhook — return the current saved webhook URL */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("users")
    .select("webhook_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    log.error({ err: error, userId: user.id }, "Failed to fetch webhook URL");
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }

  return Response.json({ webhookUrl: data?.webhook_url ?? null });
}

/** PATCH /api/settings/webhook — save or clear the webhook URL */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return Response.json({ error: msg }, { status: 400 });
  }

  const webhookUrl =
    parsed.data.webhookUrl === "" ? null : parsed.data.webhookUrl;

  const { error } = await supabase
    .from("users")
    .update({ webhook_url: webhookUrl })
    .eq("id", user.id);

  if (error) {
    log.error({ err: error, userId: user.id }, "Failed to update webhook URL");
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }

  log.info({ userId: user.id, hasUrl: webhookUrl !== null }, "Webhook URL updated");
  return Response.json({ webhookUrl });
}

/** POST /api/settings/webhook/test — send a test ping to the saved URL */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Allow the client to pass a URL to test before saving.
  let testUrl: string | undefined;
  try {
    const body = (await request.json()) as { webhookUrl?: string };
    testUrl = body.webhookUrl?.trim();
  } catch {
    // no body — use saved URL
  }

  if (!testUrl) {
    const { data } = await supabase
      .from("users")
      .select("webhook_url")
      .eq("id", user.id)
      .maybeSingle();
    testUrl = data?.webhook_url ?? undefined;
  }

  if (!testUrl) {
    return Response.json(
      { error: "No webhook URL configured" },
      { status: 400 }
    );
  }

  const delivered = await fireWebhook(testUrl, {
    event: "vibe_check.completed",
    timestamp: new Date().toISOString(),
    ideaSummary: "This is a test ping from Vibe Check.",
    report: {
      verdict: "build_it",
      verdictLabel: "Build it",
      summary: "Test delivery — not a real analysis.",
      scores: {
        viability: 8,
        niche: 8,
        problem: 8,
        differentiation: 8,
        overall: 8,
      },
      strengths: ["Test ping"],
      risks: [],
      uniqueAngles: [],
      techStack: {
        frontend: [],
        backend: [],
        database: [],
        infra: [],
        keyLibraries: [],
      },
      roadmap: [],
      mvpScope: [],
    },
  });

  return Response.json({ delivered });
}
