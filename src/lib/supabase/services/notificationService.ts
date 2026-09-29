import { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { Database, NotificationDbRow } from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

export type NotificationType =
  | "session_booking"
  | "session_confirmed"
  | "session_rejected"
  | "session_cancelled"
  | "session_completed"
  | "session_reminder"
  | "connection_request"
  | "connection_accepted"
  | "credit_received"
  | "review_received"
  | "system";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType | string;
  title: string;
  message?: string;
  content?: string;
  linkUrl?: string | null;
  referenceId?: string | null;
}

export const notificationService = {
  /**
   * Retrieves notifications for a given user ordered chronologically (newest first).
   */
  async getUserNotifications(
    userId: string,
    unreadOnly = false,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<NotificationDbRow[]>> {
    if (!checkConfigured()) {
      return { data: [], error: null };
    }

    try {
      const sb = resolveClient(client);
      let query = sb
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (unreadOnly) {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ?? [], error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load notifications.",
      };
    }
  },

  /**
   * Retrieves the count of unread notifications for a user.
   */
  async getUnreadCount(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<number>> {
    if (!checkConfigured()) {
      return { data: 0, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { count, error } = await sb
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        return { data: 0, error: error.message };
      }

      return { data: count ?? 0, error: null };
    } catch (err: unknown) {
      return {
        data: 0,
        error: err instanceof Error ? err.message : "Failed to get unread count.",
      };
    }
  },

  /**
   * Creates a notification with deduplication prevention.
   */
  async createNotification(
    params: CreateNotificationParams,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<string>> {
    if (!checkConfigured()) {
      return { data: `local-notif-${Date.now()}`, error: null };
    }

    try {
      const sb = resolveClient(client);
      const message = params.message || params.content || "";

      // Enforce notification preferences (Phase 17)
      const { data: pref } = await sb
        .from("notification_preferences")
        .select("*")
        .eq("user_id", params.userId)
        .maybeSingle();

      if (pref) {
        const t = params.type;
        if (
          (t === "session_booking" || t === "session_confirmed" || t === "session_rejected" || t === "session_cancelled" || t === "session_completed") &&
          !pref.session_updates_enabled
        ) {
          return { data: null, error: null };
        }
        if (t === "session_reminder" && !pref.session_reminders_enabled) {
          return { data: null, error: null };
        }
        if ((t === "connection_request" || t === "connection_accepted") && !pref.connection_requests_enabled) {
          return { data: null, error: null };
        }
        if (t === "review_received" && !pref.reviews_enabled) {
          return { data: null, error: null };
        }
        if (t === "credit_received" && !pref.credit_activity_enabled) {
          return { data: null, error: null };
        }
        if ((t === "messages" || t === "message" || t === "chat_message") && !pref.messages_enabled) {
          return { data: null, error: null };
        }
      }

      // Attempt atomic stored function RPC
      const { data: rpcId, error: rpcErr } = await sb.rpc("create_notification", {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: message,
        p_link_url: params.linkUrl || null,
        p_reference_id: params.referenceId || null,
      });

      if (!rpcErr && rpcId) {
        return { data: rpcId, error: null };
      }


      // Fallback: check deduplication and insert directly
      if (params.referenceId) {
        const { data: existing } = await sb
          .from("notifications")
          .select("id")
          .eq("user_id", params.userId)
          .eq("type", params.type)
          .eq("reference_id", params.referenceId)
          .maybeSingle();

        if (existing) {
          return { data: existing.id, error: null };
        }
      }

      const { data, error } = await sb
        .from("notifications")
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: message,
          link_url: params.linkUrl || null,
          reference_id: params.referenceId || null,
          read: false,
        })
        .select("id")
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.id, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to create notification.",
      };
    }
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(
    notificationId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: true, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { error } = await sb
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: unknown) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to update notification.",
      };
    }
  },

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: true, error: null };
    }

    try {
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
    } catch (err: unknown) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to mark all as read.",
      };
    }
  },

  /**
   * Deletes a notification.
   */
  async deleteNotification(
    notificationId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: true, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { error } = await sb
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: unknown) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to delete notification.",
      };
    }
  },

  /**
   * Scans and generates session reminders for upcoming confirmed sessions within 24h.
   */
  async checkSessionReminders(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<number>> {
    if (!checkConfigured()) {
      return { data: 0, error: null };
    }

    try {
      const sb = resolveClient(client);

      // Attempt stored function
      const { data: count, error: rpcErr } = await sb.rpc(
        "check_and_create_session_reminders",
        {
          p_user_id: userId,
        }
      );

      if (!rpcErr && typeof count === "number") {
        return { data: count, error: null };
      }

      // Fallback: query confirmed sessions within next 24h
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: sessions } = await sb
        .from("sessions")
        .select(`
          id,
          scheduled_at,
          skill:skills(name),
          teacher:profiles!sessions_teacher_id_fkey(id, display_name),
          learner:profiles!sessions_learner_id_fkey(id, display_name)
        `)
        .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
        .eq("status", "confirmed")
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", next24h.toISOString());

      let createdCount = 0;
      if (sessions) {
        for (const sess of sessions) {
          const teacherObj = sess.teacher as unknown as { id?: string; display_name?: string } | null;
          const learnerObj = sess.learner as unknown as { id?: string; display_name?: string } | null;
          const skillObj = sess.skill as unknown as { name?: string } | null;

          const isTeacher = teacherObj?.id === userId;
          const partnerObj = isTeacher ? learnerObj : teacherObj;
          const partnerName = partnerObj?.display_name || "Partner";
          const skillName = skillObj?.name || "Skill Swap";
          const dateStr = new Date(sess.scheduled_at).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const timeStr = new Date(sess.scheduled_at).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });

          const res = await this.createNotification(
            {
              userId,
              type: "session_reminder",
              title: "Upcoming Session Reminder",
              message: `Your ${skillName} session with ${partnerName} is scheduled for ${dateStr} at ${timeStr}.`,
              linkUrl: `/dashboard/sessions/${sess.id}/room`,
              referenceId: sess.id,
            },
            sb
          );

          if (res.data) createdCount++;
        }
      }

      return { data: createdCount, error: null };
    } catch (err: unknown) {
      return {
        data: 0,
        error: err instanceof Error ? err.message : "Failed to check session reminders.",
      };
    }
  },

  /**
   * Subscribes to real-time notification changes for the given user.
   * Returns an unsubscribe callback.
   */
  subscribeToNotifications(
    userId: string,
    callbacks: {
      onNewNotification: (notification: NotificationDbRow) => void;
      onNotificationUpdated?: (notification: NotificationDbRow) => void;
    },
    client?: SupabaseClient<Database>
  ): () => void {
    if (!checkConfigured()) {
      return () => {};
    }

    const sb = resolveClient(client);
    const channelName = `notifications:${userId}`;

    const channel: RealtimeChannel = sb
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacks.onNewNotification(payload.new as NotificationDbRow);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (callbacks.onNotificationUpdated) {
            callbacks.onNotificationUpdated(payload.new as NotificationDbRow);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  },
};
