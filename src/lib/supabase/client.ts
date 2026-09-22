import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { getSupabaseEnv, isSupabaseConfigured } from "./config";

let browserClientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates or reuses a Supabase client for client-side components.
 * Returns null if Supabase environment variables are not configured.
 */
export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[SkillSwap Supabase] Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable backend persistence."
      );
    }
    // Return dummy client to prevent runtime crashes during initial Phase 4 development
    return createBrowserClient<Database>(
      url || "https://unconfigured.supabase.co",
      anonKey || "placeholder-anon-key-skillswap-phase4-unconfigured"
    );
  }

  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient<Database>(url, anonKey);
  }

  return browserClientInstance;
}

/**
 * Direct accessor to the browser client singleton.
 */
export const supabase = {
  get client() {
    return createClient();
  },
  isConfigured: isSupabaseConfigured,
};
