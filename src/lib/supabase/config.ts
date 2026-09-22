/**
 * Safe Supabase configuration and diagnostic helpers.
 * Ensures secrets are never logged or leaked to client console.
 */

const PLACEHOLDER_URL_SNIPPETS = ["your-project-id", "placeholder", "example.com"];
const PLACEHOLDER_KEY_SNIPPETS = ["your-anon-key", "placeholder"];

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  url?: string;
  hasAnonKey: boolean;
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  const isUrlValid =
    Boolean(url) &&
    url.startsWith("http") &&
    !PLACEHOLDER_URL_SNIPPETS.some((snippet) => url.includes(snippet));

  const isKeyValid =
    Boolean(anonKey) &&
    anonKey.length > 20 &&
    !PLACEHOLDER_KEY_SNIPPETS.some((snippet) => anonKey.includes(snippet));

  return {
    url,
    anonKey,
    isConfigured: isUrlValid && isKeyValid,
    isUrlValid,
    isKeyValid,
  };
}

/**
 * Returns true if both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are present and not dummy placeholder strings.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv().isConfigured;
}

/**
 * Safely inspects configuration status without leaking secret values.
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { url, isConfigured, isUrlValid, isKeyValid } = getSupabaseEnv();
  const missingKeys: string[] = [];

  if (!isUrlValid) missingKeys.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!isKeyValid) missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return {
    isConfigured,
    missingKeys,
    url: isUrlValid ? url : undefined,
    hasAnonKey: isKeyValid,
  };
}

/**
 * Asserts that Supabase is configured; throws a clean error if missing without exposing keys.
 */
export function assertSupabaseConfigured(): { url: string; anonKey: string } {
  const { url, anonKey, isConfigured, isUrlValid, isKeyValid } = getSupabaseEnv();

  if (!isConfigured) {
    const missing: string[] = [];
    if (!isUrlValid) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!isKeyValid) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    throw new Error(
      `[SkillSwap Supabase] Configuration incomplete. Missing or placeholder values for: ${missing.join(", ")}. Please configure them in your .env.local file.`
    );
  }

  return { url, anonKey };
}
