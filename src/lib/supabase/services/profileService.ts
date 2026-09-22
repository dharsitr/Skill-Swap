import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow, ProfileUpdate } from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

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
   * Updates an existing profile.
   */
  async updateProfile(
    userId: string,
    updates: ProfileUpdate,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ProfileRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },
};
