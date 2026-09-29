import { SupabaseClient, User, Session } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { DEFAULT_AVATARS } from "@/constants/config";
import { sanitizeDisplayName, checkRateLimit } from "@/lib/security/sanitize";

export interface AuthResultData {
  user: User | null;
  session: Session | null;
}

/**
 * Maps raw auth errors into user-friendly diagnostic messages.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const msg = typeof error === "string" ? error : (error as { message?: string }).message || "";

  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid_grant")) {
    return "Incorrect email or password. Please check your credentials and try again.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("unique constraint") ||
    lower.includes("already exists")
  ) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (lower.includes("password should be at least") || lower.includes("weak_password")) {
    return "Password must be at least 6 characters long.";
  }
  if (lower.includes("invalid format") || lower.includes("valid email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("rate limit") || lower.includes("over_email_send_rate_limit")) {
    return "Too many authentication attempts or emails sent. Please wait a few moments before trying again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Your email address is not yet confirmed. Please check your inbox for confirmation link.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("load failed")
  ) {
    return "Could not connect to authentication service. Please check your internet connection or browser privacy/ad-blocking extensions.";
  }

  return msg || "Authentication failed. Please try again.";
}

export const authService = {
  /**
   * Registers a new user with email and password.
   * Creates the corresponding profile record and initial credits.
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AuthResultData>> {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanName = sanitizeDisplayName(fullName);

    // Rate limiting: max 5 signup/auth attempts per 30s per email/ip
    const rateCheck = checkRateLimit(`auth_signup_${trimmedEmail}`, 5, 30000);
    if (!rateCheck.allowed) {
      return {
        data: null,
        error: `Too many registration attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
      };
    }

    if (!checkConfigured()) {
      return {
        data: null,
        error: "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      };
    }

    try {
      const sb = resolveClient(client);

      const { data, error } = await sb.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: cleanName,
            avatar_url: DEFAULT_AVATARS[0],
          },
        },
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      // Check for existing user where Supabase returned empty identities without hard error
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          data: null,
          error: "An account with this email address already exists. Please sign in instead.",
        };
      }

      // If user was created, ensure profile row exists in the profiles table
      if (data.user) {
        const generatedUsername =
          cleanName.toLowerCase().replace(/[^a-z0-9]/g, "") +
          "_" +
          Math.floor(1000 + Math.random() * 9000);

        try {
          await sb.from("profiles").upsert(
            {
              id: data.user.id,
              display_name: cleanName,
              username: generatedUsername,
              avatar_url: DEFAULT_AVATARS[0],
            },
            { onConflict: "id" }
          );
        } catch {
          // Triggers in database may have already executed; non-fatal
        }
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: formatAuthError(err),
      };
    }
  },

  /**
   * Authenticates an existing user with email and password.
   */
  async signIn(
    email: string,
    password: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AuthResultData>> {
    const trimmedEmail = email.trim().toLowerCase();

    // Rate limiting: max 5 login attempts per 30s per email
    const rateCheck = checkRateLimit(`auth_signin_${trimmedEmail}`, 5, 30000);
    if (!rateCheck.allowed) {
      return {
        data: null,
        error: `Too many sign in attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
      };
    }

    if (!checkConfigured()) {
      return {
        data: null,
        error: "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: formatAuthError(err),
      };
    }
  },

  /**
   * Signs out the current user and terminates the session.
   */
  async signOut(client?: SupabaseClient<Database>): Promise<ServiceResult<null>> {
    if (!checkConfigured()) {
      return { data: null, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { error } = await sb.auth.signOut();
      if (error) {
        return { data: null, error: formatAuthError(error) };
      }
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: formatAuthError(err) };
    }
  },

  /**
   * Retrieves the current authenticated user from local session.
   */
  async getCurrentUser(client?: SupabaseClient<Database>): Promise<ServiceResult<User | null>> {
    if (!checkConfigured()) {
      return { data: null, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb.auth.getUser();
      if (error) {
        return { data: null, error: null };
      }
      return { data: data.user, error: null };
    } catch {
      return { data: null, error: null };
    }
  },

  /**
   * Retrieves current active session.
   */
  async getSession(client?: SupabaseClient<Database>): Promise<ServiceResult<Session | null>> {
    if (!checkConfigured()) {
      return { data: null, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb.auth.getSession();
      if (error) {
        return { data: null, error: null };
      }
      return { data: data.session, error: null };
    } catch {
      return { data: null, error: null };
    }
  },
};
