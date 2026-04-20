import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase/proxy";

// Routes that stay accessible without a session. /api/billing/webhook is
// here because Stripe calls it externally with no cookies — it
// authenticates via the Stripe-Signature header instead.
// "/" is public so unauthenticated visitors see the landing page.
const PUBLIC_PATHS = [
  "/",
  "/signin",
  "/auth/callback",
  "/api/auth",
  "/api/billing/webhook",
  "/pricing",
  "/terms",
  "/privacy",
  "/opengraph-image",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`))
  );
}

/**
 * Build a redirect response that preserves any session-refresh cookies
 * Supabase wrote on the mutable `source` response. Without this, a
 * redirect path silently drops freshly rotated auth cookies and the
 * browser stays on an about-to-expire session.
 */
function redirectPreservingCookies(
  target: URL,
  source: NextResponse
): NextResponse {
  const redirect = NextResponse.redirect(target);
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createSupabaseProxyClient(request);

  // Touching getUser() refreshes the session cookies if they're close to
  // expiring. Must happen on every request per @supabase/ssr guidance.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    // Bounce signed-in users away from /signin or / to the dashboard.
    if (user && (pathname === "/" || pathname.startsWith("/signin"))) {
      return redirectPreservingCookies(
        new URL("/dashboard", request.url),
        response
      );
    }
    return response;
  }

  if (!user) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectPreservingCookies(signinUrl, response);
  }

  return response;
}

export const config = {
  // Skip static assets and Next internals — everything else is either
  // a page or an API route that needs the session cookie refresh.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
