import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth + magic-link callback.
 *
 * Supabase redirects here with a `?code=...` after the user clicks a magic
 * link or completes the OAuth dance. We exchange the code for a session,
 * which writes the auth cookies, then bounce the user back to `next`
 * (defaults to `/`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    const url = new URL("/signin", origin);
    url.searchParams.set("error", errorDescription);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/signin", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/signin", origin);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  // Only accept same-origin relative paths for `next` — otherwise
  // `new URL("https://evil.com", origin)` resolves to the attacker URL,
  // giving us an open redirect / phishing vector.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, origin));
}
