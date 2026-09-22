import { SupabaseClient } from "@supabase/supabase-js";
import { Database, NotificationDbRow } from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

export const notificationService = {
  /**
   * Retrieves notifications for a given user.
   */
  async getUserNotifications(
    userId: string,
    unreadOnly = false,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<NotificationDbRow[]>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    let query = sb
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Marks a notification as read.
   */
  async markAsRead(
    notificationId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: false, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { error } = await sb
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      return { data: false, error: error.message };
    }

    return { data: true, error: null };
  },

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: false, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { error } = await sb
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      return { data: false, error: error.message };
    }

    return { data: true, error: null };
  },
};
