import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/sessions/[id]/share — Generate or remove a public share slug.
 *
 * Body: { enabled: boolean }
 *   - enabled: true  → generate a slug (if not already set) and return it
 *   - enabled: false → clear the slug (make report private again)
 *
 * Returns: { slug: string | null, url: string | null }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    enabled?: boolean;
  };
  const enabled = body.enabled !== false;

  // Verify ownership.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, public_slug")
    .eq("id", id)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (enabled) {
    // Generate slug if not already set.
    const slug = session.public_slug || generateSlug();
    if (!session.public_slug) {
      const { error } = await supabase
        .from("sessions")
        .update({ public_slug: slug })
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.json({
      slug,
      url: `${appUrl}/report/${slug}`,
    });
  } else {
    // Remove slug — make private.
    const { error } = await supabase
      .from("sessions")
      .update({ public_slug: null })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ slug: null, url: null });
  }
}

/**
 * Generate a URL-safe, non-guessable slug (22 chars, base64url from random).
 */
function generateSlug(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Convert to base64url (RFC 4648 §5) — no padding, URL-safe.
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64;
}
