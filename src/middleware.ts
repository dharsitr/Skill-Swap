import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Validates that a redirect path is internal and safe from open redirect vulnerabilities.
 */
function getSafeRedirectPath(path: string): string {
  if (path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")) {
    return path;
  }
  return "/dashboard";
}

export async function middleware(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  // If Supabase is not configured yet, allow access to avoid blocking development
  if (!isConfigured) {
    const res = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    return res;
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verify authenticated identity server-side via auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protect all /dashboard/* routes from unauthenticated users
  if (path.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      const safeRedirect = getSafeRedirectPath(path);
      redirectUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users away from /login and /signup
  if ((path === "/login" || path === "/signup") && user) {
    const rawRedirect = request.nextUrl.searchParams.get("redirect") || "/dashboard";
    const safeTarget = getSafeRedirectPath(rawRedirect);
    return NextResponse.redirect(new URL(safeTarget, request.url));
  }

  // Set defense-in-depth response headers
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};
