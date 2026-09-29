import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  ConnectionRequestRow,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { notificationService } from "./notificationService";
import {
  sanitizeConnectionMessage,
  isValidUuid,
  checkRateLimit,
} from "@/lib/security/sanitize";

export interface ConnectionStatusResult {
  state: "none" | "pending_sent" | "pending_received" | "accepted" | "declined";
  requestId?: string;
}

export const connectionService = {
  /**
   * Sends a connection request from senderId to receiverId.
   * Prevents duplicate requests.
   */
  async sendConnectionRequest(
    senderId: string,
    receiverId: string,
    message?: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ConnectionRequestRow>> {
    if (!senderId || !receiverId) {
      return { data: null, error: "Sender ID and Receiver ID are required." };
    }

    if (senderId === receiverId) {
      return { data: null, error: "You cannot send a connection request to yourself." };
    }

    // Handle demo / fallback mentors during development
    if (receiverId.startsWith("m-") || receiverId.startsWith("mock-")) {
      return {
        data: {
          id: `mock-req-${Date.now()}`,
          sender_id: senderId,
          receiver_id: receiverId,
          status: "pending",
          message: message ? sanitizeConnectionMessage(message) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    if (!isValidUuid(senderId) || !isValidUuid(receiverId)) {
      return { data: null, error: "Invalid sender or receiver ID format." };
    }

    // Rate limiting: max 10 connection requests per minute per user
    const rateCheck = checkRateLimit(`connect_${senderId}`, 10, 60000);
    if (!rateCheck.allowed) {
      return {
        data: null,
        error: `Too many requests sent. Please wait ${rateCheck.retryAfterSeconds}s before sending another.`,
      };
    }

    const sanitizedMessage = message ? sanitizeConnectionMessage(message) : null;

    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    try {
      const sb = resolveClient(client);

      // Phase 17: Check receiver privacy settings
      const { data: receiverPref } = await sb
        .from("privacy_preferences")
        .select("allow_connection_requests")
        .eq("user_id", receiverId)
        .maybeSingle();

      if (receiverPref?.allow_connection_requests === "none") {
        return {
          data: null,
          error: "This user is not accepting connection requests at this time.",
        };
      }

      // Check existing connection request between this pair in either direction
      const { data: existing, error: checkErr } = await sb
        .from("connection_requests")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        )
        .order("created_at", { ascending: false })
        .limit(1);


      if (checkErr) {
        return { data: null, error: checkErr.message };
      }

      if (existing && existing.length > 0) {
        const req = existing[0];
        if (req.status === "pending") {
          return {
            data: null,
            error:
              req.sender_id === senderId
                ? "You have already sent a pending connection request to this mentor."
                : "This user has already sent you a connection request.",
          };
        }
        if (req.status === "accepted") {
          return { data: null, error: "You are already connected with this peer." };
        }
      }

      const { data, error: insertErr } = await sb
        .from("connection_requests")
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          status: "pending",
          message: sanitizedMessage,
        })
        .select()
        .single();

      if (insertErr) {
        return { data: null, error: insertErr.message };
      }

      // Notify the receiver asynchronously
      notificationService
        .createNotification({
          userId: receiverId,
          type: "connection_request",
          title: "New Connection Request",
          content: "A peer wants to connect and swap skills with you.",
          linkUrl: "/dashboard/discover",
          referenceId: data.id,
        })
        .catch(() => {});

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to send connection request.",
      };
    }
  },

  /**
   * Gets connection status between two specific users.
   */
  async getConnectionStatus(
    currentUserId: string,
    targetUserId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ConnectionStatusResult>> {
    if (!checkConfigured()) {
      return { data: { state: "none" }, error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error: fetchErr } = await sb
        .from("connection_requests")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchErr) {
        return { data: { state: "none" }, error: fetchErr.message };
      }

      if (!data || data.length === 0) {
        return { data: { state: "none" }, error: null };
      }

      const req = data[0];
      if (req.status === "accepted") {
        return { data: { state: "accepted", requestId: req.id }, error: null };
      }
      if (req.status === "pending") {
        if (req.sender_id === currentUserId) {
          return { data: { state: "pending_sent", requestId: req.id }, error: null };
        } else {
          return { data: { state: "pending_received", requestId: req.id }, error: null };
        }
      }
      if (req.status === "declined") {
        return { data: { state: "declined", requestId: req.id }, error: null };
      }

      return { data: { state: "none" }, error: null };
    } catch (err) {
      return {
        data: { state: "none" },
        error: err instanceof Error ? err.message : "Error checking connection status",
      };
    }
  },

  /**
   * Retrieves all target user IDs that the current user has sent a pending request to.
   * Useful for batch-populating button states in the discovery grid.
   */
  async getSentPendingUserIds(
    senderId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<string[]>> {
    if (!checkConfigured()) {
      return { data: [], error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error: fetchErr } = await sb
        .from("connection_requests")
        .select("receiver_id")
        .eq("sender_id", senderId)
        .eq("status", "pending");

      if (fetchErr) {
        return { data: [], error: fetchErr.message };
      }

      const ids = (data || []).map((r) => r.receiver_id);
      return { data: ids, error: null };
    } catch {
      return { data: [], error: null };
    }
  },

  /**
   * Cancels a pending connection request sent by sender.
   */
  async cancelRequest(
    requestId: string,
    senderId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: false, error: "Supabase is not configured." };
    }

    try {
      const sb = resolveClient(client);
      const { error: updateErr } = await sb
        .from("connection_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId)
        .eq("sender_id", senderId);

      if (updateErr) {
        return { data: false, error: updateErr.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to cancel request.",
      };
    }
  },

  /**
   * Responds to an incoming connection request (accept or decline).
   * Notifies the sender when accepted.
   */
  async respondToRequest(
    requestId: string,
    receiverId: string,
    accept: boolean,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: true, error: null };
    }

    try {
      const sb = resolveClient(client);

      const status = accept ? "accepted" : "declined";
      const { data: updated, error: updateErr } = await sb
        .from("connection_requests")
        .update({ status })
        .eq("id", requestId)
        .eq("receiver_id", receiverId)
        .select()
        .single();

      if (updateErr) {
        return { data: false, error: updateErr.message };
      }

      if (accept && updated) {
        // Notify the original sender
        notificationService
          .createNotification({
            userId: updated.sender_id,
            type: "connection_accepted",
            title: "Connection Request Accepted",
            content: "Your connection request was accepted! You can now chat and book sessions together.",
            linkUrl: `/dashboard/messages?userId=${receiverId}`,
            referenceId: requestId,
          })
          .catch(() => {});
      }

      return { data: true, error: null };
    } catch (err) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to respond to request.",
      };
    }
  },
};
