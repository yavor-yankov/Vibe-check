import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const log = logger.child({ route: "/api/auth/magic-link" });

const BodySchema = z.object({
  email: z.string().email("Invalid email address"),
  /** Relative path to redirect to after sign-in, e.g. "/dashboard" */
  next: z
    .string()
    .startsWith("/")
    .max(512)
    .default("/dashboard")
    .transform((v) =>
      // Prevent open-redirect — must be a relative path, no protocol
      v.startsWith("//") ? "/dashboard" : v
    ),
});

/**
 * POST /api/auth/magic-link
 *
 * Generates a Supabase magic-link via the Admin API and sends a branded
 * HTML email via Resend. Falls back gracefully to a 501 when RESEND_API_KEY
 * is not configured so callers can switch back to the native Supabase OTP.
 */
export async function POST(request: NextRequest) {
  // Reject if Resend isn't configured — let the client fall back to
  // native Supabase OTP.
  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      { error: "Custom email not configured", fallback: true },
      { status: 501 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return Response.json({ error: msg }, { status: 400 });
  }

  const { email, next } = parsed.data;

  // Build the final redirect URL (must be HTTPS in production).
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) {
    return Response.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured" },
      { status: 500 }
    );
  }

  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error || !data.properties?.action_link) {
      const msg = error?.message ?? "Could not generate sign-in link";
      log.error({ err: error, email }, "generateLink failed");
      return Response.json({ error: msg }, { status: 500 });
    }

    await sendMagicLinkEmail(email, data.properties.action_link);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    log.error({ err, email }, "Magic link send failed");
    return Response.json({ error: msg }, { status: 500 });
  }
}
