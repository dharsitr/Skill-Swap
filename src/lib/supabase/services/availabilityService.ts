import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  AvailabilityRow,
  AvailabilityInsert,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

export const availabilityService = {
  /**
   * Retrieves availability schedule for a user.
   */
  async getUserAvailability(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AvailabilityRow[]>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("availability")
      .select("*")
      .eq("user_id", userId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Creates an availability slot for a user.
   */
  async addAvailability(
    slot: AvailabilityInsert,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AvailabilityRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("availability")
      .insert(slot)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Deletes an availability slot by ID.
   */
  async deleteAvailability(
    slotId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: false, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { error } = await sb
      .from("availability")
      .delete()
      .eq("id", slotId);

    if (error) {
      return { data: false, error: error.message };
    }

    return { data: true, error: null };
  },
};
