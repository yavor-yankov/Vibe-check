import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase/proxy";

// Routes that stay accessible without a session.
const PUBLIC_PATHS = ["/signin", "/auth/callback", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
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
    // Bounce signed-in users away from /signin to the app root.
    if (user && pathname.startsWith("/signin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (!user) {
    const signinUrl = new URL("/signin", request.url);
    if (pathname !== "/") {
      signinUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(signinUrl);
  }

  return response;
}

export const config = {
  // Skip static assets and Next internals — everything else is either
  // a page or an API route that needs the session cookie refresh.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
