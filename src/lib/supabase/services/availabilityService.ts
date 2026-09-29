import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  AvailabilityRow,
  AvailabilityInsert,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

export const DAY_INDEX_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const DAY_NAME_MAP: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const SLOT_TIME_MAP: Record<string, { start: string; end: string }> = {
  "Morning (9:00 AM – 12:00 PM)": { start: "09:00:00", end: "12:00:00" },
  "Afternoon (12:00 PM – 4:00 PM)": { start: "12:00:00", end: "16:00:00" },
  "Evening (4:00 PM – 8:00 PM)": { start: "16:00:00", end: "20:00:00" },
  "Night (8:00 PM – 11:00 PM)": { start: "20:00:00", end: "23:00:00" },
};

export const availabilityService = {
  /**
   * Validates that end_time is strictly after start_time.
   */
  validateTimeRange(startTime: string, endTime: string): { valid: boolean; error?: string } {
    if (!startTime || !endTime) {
      return { valid: false, error: "Both start time and end time are required." };
    }

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (isNaN(startMinutes) || isNaN(endMinutes)) {
      return { valid: false, error: "Invalid time format. Please provide valid HH:MM times." };
    }

    if (endMinutes <= startMinutes) {
      return { valid: false, error: "End time must be after start time." };
    }

    return { valid: true };
  },

  timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + (m || 0);
  },

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
   * Creates an availability slot for a user with validation.
   */
  async addAvailability(
    slot: AvailabilityInsert,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AvailabilityRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const validation = this.validateTimeRange(slot.start_time, slot.end_time);
    if (!validation.valid) {
      return { data: null, error: validation.error || "Invalid time range." };
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
   * Updates an existing availability slot.
   */
  async updateAvailability(
    slotId: string,
    updates: Partial<AvailabilityInsert>,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AvailabilityRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    if (updates.start_time && updates.end_time) {
      const validation = this.validateTimeRange(updates.start_time, updates.end_time);
      if (!validation.valid) {
        return { data: null, error: validation.error || "Invalid time range." };
      }
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("availability")
      .update(updates)
      .eq("id", slotId)
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

  /**
   * Synchronizes full availability schedule for a user.
   */
  async syncUserAvailability(
    userId: string,
    slots: AvailabilityInsert[],
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: false, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);

    try {
      // Delete old slots
      await sb.from("availability").delete().eq("user_id", userId);

      // Validate and insert new slots
      const validSlots = slots.filter((slot) => {
        const v = this.validateTimeRange(slot.start_time, slot.end_time);
        return v.valid;
      });

      if (validSlots.length > 0) {
        const { error: insertError } = await sb.from("availability").insert(validSlots);
        if (insertError) {
          return { data: false, error: insertError.message };
        }
      }

      return { data: true, error: null };
    } catch (err) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to sync availability.",
      };
    }
  },
};
