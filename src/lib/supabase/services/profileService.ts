import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow, ProfileUpdate } from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import {
  sanitizeDisplayName,
  sanitizeBio,
  sanitizeHeadline,
  sanitizePlainText,
  sanitizeSafeUrl,
  isValidUuid,
} from "@/lib/security/sanitize";

export const profileService = {
  /**
   * Fetches a user profile by user UUID.
   */
  async getProfile(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ProfileRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Updates an existing profile with sanitized input data.
   */
  async updateProfile(
    userId: string,
    updates: ProfileUpdate,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ProfileRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    // Sanitize user-provided fields
    const sanitizedUpdates: ProfileUpdate = {};

    if (updates.display_name !== undefined) {
      sanitizedUpdates.display_name = sanitizeDisplayName(updates.display_name);
    }

    if (updates.headline !== undefined) {
      sanitizedUpdates.headline = updates.headline ? sanitizeHeadline(updates.headline) : null;
    }

    if (updates.bio !== undefined) {
      sanitizedUpdates.bio = updates.bio ? sanitizeBio(updates.bio) : null;
    }

    if (updates.location !== undefined) {
      sanitizedUpdates.location = updates.location ? sanitizePlainText(updates.location, 80) : null;
    }

    if (updates.timezone !== undefined) {
      sanitizedUpdates.timezone = updates.timezone ? sanitizePlainText(updates.timezone, 50) : null;
    }

    if (updates.avatar_url !== undefined) {
      sanitizedUpdates.avatar_url = updates.avatar_url ? sanitizeSafeUrl(updates.avatar_url) : null;
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("profiles")
      .update(sanitizedUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },
};
