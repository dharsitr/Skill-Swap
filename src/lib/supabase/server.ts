import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import { getSupabaseEnv } from "./config";

/**
 * Creates a Supabase client for Server Components, Server Actions,
 * and Route Handlers with automatic cookie handling.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured && process.env.NODE_ENV === "development") {
    console.warn(
      "[SkillSwap Supabase] Server client instantiated without valid configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  return createServerClient<Database>(
    url || "https://unconfigured.supabase.co",
    anonKey || "placeholder-anon-key-skillswap-phase4-unconfigured",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored if called from a Server Component where response cookies cannot be set directly
          }
        },
      },
    }
  );
}
