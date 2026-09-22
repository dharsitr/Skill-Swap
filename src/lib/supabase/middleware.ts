import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database.types";
import { getSupabaseEnv } from "./config";

/**
 * Refreshes auth tokens stored in cookies and passes them to the response.
 * Prepares the application for Phase 5 authenticated sessions.
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
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

  // IMPORTANT: Do not remove auth.getUser() as it ensures auth tokens are refreshed
  await supabase.auth.getUser();

  return supabaseResponse;
}
