import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  NotificationPreferencesRow,
  NotificationPreferencesUpdate,
  PrivacyPreferencesRow,
  PrivacyPreferencesUpdate,
  UserPreferencesRow,
  UserPreferencesUpdate,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { isValidUuid } from "@/lib/security/sanitize";

export interface UserDataExport {
  exportDate: string;
  userId: string;
  profile: Record<string, unknown> | null;
  skills: Record<string, unknown>[];
  availability: Record<string, unknown>[];
  credits: Record<string, unknown> | null;
  creditTransactions: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  connectionRequests: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  preferences: {
    notifications: NotificationPreferencesRow | null;
    privacy: PrivacyPreferencesRow | null;
    general: UserPreferencesRow | null;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferencesRow, "id" | "user_id" | "created_at" | "updated_at"> = {
  messages_enabled: true,
  connection_requests_enabled: true,
  session_reminders_enabled: true,
  session_updates_enabled: true,
  reviews_enabled: true,
  credit_activity_enabled: true,
  email_enabled: true,
};

export const DEFAULT_PRIVACY_PREFERENCES: Omit<PrivacyPreferencesRow, "id" | "user_id" | "created_at" | "updated_at"> = {
  profile_visibility: "public",
  allow_connection_requests: "everyone",
  show_online_status: true,
  show_availability: true,
  show_completed_sessions: true,
  show_rating_summary: true,
};

export const DEFAULT_USER_PREFERENCES: Omit<UserPreferencesRow, "id" | "user_id" | "created_at" | "updated_at"> = {
  default_session_duration: 45,
  auto_accept_connections: false,
  cancellation_notice_hours: 2,
  read_receipts_enabled: true,
  typing_indicators_enabled: true,
  message_sounds_enabled: true,
  theme: "system",
  layout_density: "comfortable",
  language: "en",
  date_format: "MM/DD/YYYY",
  time_format: "12h",
  preferred_camera_id: null,
  preferred_mic_id: null,
  preferred_speaker_id: null,
  video_quality: "720p",
  mirror_video: true,
};

export const settingsService = {
  /**
   * Fetches notification preferences for a user, creating defaults if not yet present.
   */
  async getNotificationPreferences(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<NotificationPreferencesRow>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          id: `local-notif-pref-${userId}`,
          user_id: userId,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    try {

      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (data) {
        return { data, error: null };
      }

      // Initialize default preferences
      const { data: created, error: insertErr } = await sb
        .from("notification_preferences")
        .insert({
          user_id: userId,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
        })
        .select()
        .single();

      if (insertErr) {
        // Fallback: in case another concurrent request created it
        const { data: retryData } = await sb
          .from("notification_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (retryData) return { data: retryData, error: null };
        return { data: null, error: insertErr.message };
      }

      return { data: created, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load notification preferences.",
      };
    }
  },

  /**
   * Updates notification preferences for a user.
   */
  async updateNotificationPreferences(
    userId: string,
    updates: NotificationPreferencesUpdate,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<NotificationPreferencesRow>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          id: `local-notif-pref-${userId}`,
          user_id: userId,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as NotificationPreferencesRow,
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("notification_preferences")
        .upsert(
          {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to update notification preferences.",
      };
    }
  },

  /**
   * Fetches privacy preferences for a user, creating defaults if not yet present.
   */
  async getPrivacyPreferences(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<PrivacyPreferencesRow>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          id: `local-privacy-pref-${userId}`,
          user_id: userId,
          ...DEFAULT_PRIVACY_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("privacy_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (data) {
        return { data, error: null };
      }

      // Initialize default preferences
      const { data: created, error: insertErr } = await sb
        .from("privacy_preferences")
        .insert({
          user_id: userId,
          ...DEFAULT_PRIVACY_PREFERENCES,
        })
        .select()
        .single();

      if (insertErr) {
        const { data: retryData } = await sb
          .from("privacy_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (retryData) return { data: retryData, error: null };
        return { data: null, error: insertErr.message };
      }

      return { data: created, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load privacy preferences.",
      };
    }
  },

  /**
   * Updates privacy preferences for a user.
   */
  async updatePrivacyPreferences(
    userId: string,
    updates: PrivacyPreferencesUpdate,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<PrivacyPreferencesRow>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          id: `local-privacy-pref-${userId}`,
          user_id: userId,
          ...DEFAULT_PRIVACY_PREFERENCES,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as PrivacyPreferencesRow,
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("privacy_preferences")
        .upsert(
          {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to update privacy preferences.",
      };
    }
  },

  /**
   * Fetches general user preferences (sessions, video/audio, chat, appearance, region).
   */
  async getUserPreferences(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<UserPreferencesRow>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          id: `local-user-pref-${userId}`,
          user_id: userId,
          ...DEFAULT_USER_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (data) {
        return { data, error: null };
      }

      const { data: created, error: insertErr } = await sb
        .from("user_preferences")
        .insert({
          user_id: userId,
          ...DEFAULT_USER_PREFERENCES,
        })
        .select()
        .single();

      if (insertErr) {
        const { data: retryData } = await sb
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (retryData) return { data: retryData, error: null };
        return { data: null, error: insertErr.message };
      }

      return { data: created, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load user preferences.",
      };
    }
  },

  /**
   * Updates general user preferences (sessions, video/audio, chat, appearance, region).
   */
  async updateUserPreferences(
    userId: string,
    updates: UserPreferencesUpdate,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<UserPreferencesRow>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          id: `local-user-pref-${userId}`,
          user_id: userId,
          ...DEFAULT_USER_PREFERENCES,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserPreferencesRow,
        error: null,
      };
    }


    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to update user preferences.",
      };
    }
  },

  /**
   * Exports all personal data belonging strictly to the authenticated user.
   */
  async exportUserData(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<UserDataExport>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    try {
      const sb = resolveClient(client);

      // Verify current user matches or is authenticated
      const { data: authData } = await sb.auth.getUser();
      if (authData?.user && authData.user.id !== userId) {
        return { data: null, error: "Unauthorized: You can only export your own account data." };
      }

      // Parallel batch query for personal data
      const [
        profileRes,
        skillsRes,
        availRes,
        creditsRes,
        txRes,
        sessionsRes,
        connectRes,
        notifRes,
        reviewsRes,
        notifPrefRes,
        privacyPrefRes,
        userPrefRes,
      ] = await Promise.all([
        sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
        sb.from("user_skills").select("*, skills(*)").eq("user_id", userId),
        sb.from("availability").select("*").eq("user_id", userId),
        sb.from("credits").select("*").eq("user_id", userId).maybeSingle(),
        sb.from("credit_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        sb.from("sessions").select("*").or(`learner_id.eq.${userId},mentor_id.eq.${userId}`).order("created_at", { ascending: false }),
        sb.from("connection_requests").select("*").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order("created_at", { ascending: false }),
        sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        sb.from("reviews").select("*").or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`).order("created_at", { ascending: false }),
        sb.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle(),
        sb.from("privacy_preferences").select("*").eq("user_id", userId).maybeSingle(),
        sb.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      ]);

      const exportData: UserDataExport = {
        exportDate: new Date().toISOString(),
        userId,
        profile: profileRes.data || null,
        skills: skillsRes.data || [],
        availability: availRes.data || [],
        credits: creditsRes.data || null,
        creditTransactions: txRes.data || [],
        sessions: sessionsRes.data || [],
        connectionRequests: connectRes.data || [],
        notifications: notifRes.data || [],
        reviews: reviewsRes.data || [],
        preferences: {
          notifications: notifPrefRes.data || null,
          privacy: privacyPrefRes.data || null,
          general: userPrefRes.data || null,
        },
      };

      return { data: exportData, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to generate user data export.",
      };
    }
  },

  /**
   * Deactivates the user account (hides profile and pauses incoming requests).
   */
  async deactivateAccount(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    try {
      const sb = resolveClient(client);
      const { data: authData } = await sb.auth.getUser();
      if (authData?.user && authData.user.id !== userId) {
        return { data: null, error: "Unauthorized: You can only deactivate your own account." };
      }

      const { error } = await sb
        .from("privacy_preferences")
        .upsert(
          {
            user_id: userId,
            profile_visibility: "hidden",
            allow_connection_requests: "none",
            show_online_status: false,
            show_availability: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to deactivate account.",
      };
    }
  },

  /**
   * Permanently deletes user account data in cascading order and signs out.
   * Requires strict confirmation verification.
   */
  async deleteAccount(
    userId: string,
    confirmationPhrase: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user ID format." };
    }

    if (confirmationPhrase.trim().toUpperCase() !== "DELETE MY ACCOUNT") {
      return {
        data: null,
        error: "Confirmation phrase does not match. Please type 'DELETE MY ACCOUNT' to confirm.",
      };
    }

    try {
      const sb = resolveClient(client);
      const { data: authData } = await sb.auth.getUser();
      if (authData?.user && authData.user.id !== userId) {
        return { data: null, error: "Unauthorized: You can only delete your own account." };
      }

      // Explicitly delete user profile, which cascades to user_skills, availability,
      // preferences, credits, transactions, etc. due to foreign key ON DELETE CASCADE.
      const { error: profileErr } = await sb
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileErr) {
        return { data: null, error: profileErr.message };
      }

      // Sign out auth session
      await sb.auth.signOut();

      return { data: true, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to permanently delete account.",
      };
    }
  },
};
