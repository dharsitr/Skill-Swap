import { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import {
  Database,
  ConversationRow,
  MessageRow,
  ProfileRow,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

import {
  sanitizeChatMessage,
  isValidUuid,
  checkRateLimit,
} from "@/lib/security/sanitize";

export interface ChatMessage extends MessageRow {
  sender?: ProfileRow | null;
}

export interface ConversationWithDetails {
  id: string;
  createdAt: string;
  updatedAt: string;
  peer: ProfileRow;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
}

export const chatService = {
  /**
   * Retrieves all conversations for the given user, enriched with peer details,
   * the latest message, and unread counts.
   */
  async getUserConversations(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ConversationWithDetails[]>> {
    if (!checkConfigured()) {
      return { data: [], error: null };
    }

    try {
      const sb = resolveClient(client);

      // 1. Get all conversation IDs the user participates in
      const { data: myParticipations, error: partErr } = await sb
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId);

      if (partErr) {
        return { data: null, error: partErr.message };
      }

      if (!myParticipations || myParticipations.length === 0) {
        return { data: [], error: null };
      }

      const convIds = myParticipations.map((p) => p.conversation_id);

      // 2. Fetch conversations, all participants, and recent messages in parallel
      const [convsRes, allParticipantsRes, messagesRes] = await Promise.all([
        sb.from("conversations").select("*").in("id", convIds),
        sb
          .from("conversation_participants")
          .select("conversation_id, user_id, profile:profiles(*)")
          .in("conversation_id", convIds),
        sb
          .from("messages")
          .select("*, sender:profiles(*)")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false }),
      ]);

      if (convsRes.error) return { data: null, error: convsRes.error.message };
      if (allParticipantsRes.error) return { data: null, error: allParticipantsRes.error.message };

      const conversations = (convsRes.data || []) as ConversationRow[];
      const allParticipants = allParticipantsRes.data || [];
      const allMessages = (messagesRes.data || []) as ChatMessage[];

      // 3. Assemble ConversationWithDetails list
      const detailsList: ConversationWithDetails[] = [];

      for (const conv of conversations) {
        // Identify the peer participant
        const peerParticipant = allParticipants.find(
          (p) => p.conversation_id === conv.id && p.user_id !== userId
        );

        const peerProfile = (peerParticipant?.profile as unknown as ProfileRow) || {
          id: peerParticipant?.user_id || "unknown",
          display_name: "Community Peer",
          username: "peer",
          headline: null,
          bio: null,
          avatar_url: null,
          location: null,
          timezone: null,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        };

        // Find messages in this conversation
        const convMessages = allMessages.filter((m) => m.conversation_id === conv.id);
        const lastMessage = convMessages.length > 0 ? convMessages[0] : null;

        // Unread count: messages sent by peer where read_at is null
        const unreadCount = convMessages.filter(
          (m) => m.sender_id !== userId && !m.read_at
        ).length;

        detailsList.push({
          id: conv.id,
          createdAt: conv.created_at,
          updatedAt: lastMessage?.created_at || conv.updated_at,
          peer: peerProfile,
          lastMessage,
          unreadCount,
        });
      }

      // Sort by latest message/activity timestamp descending
      detailsList.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return { data: detailsList, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load conversations.",
      };
    }
  },

  /**
   * Retrieves messages for a specific conversation in chronological order.
   */
  async getConversationMessages(
    conversationId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ChatMessage[]>> {
    if (!checkConfigured()) {
      return { data: [], error: null };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("messages")
        .select("*, sender:profiles(*)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: (data || []) as ChatMessage[], error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load messages.",
      };
    }
  },

  /**
   * Sends a message into a conversation.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<ChatMessage>> {
    if (!isValidUuid(conversationId) || !isValidUuid(senderId)) {
      return { data: null, error: "Invalid conversation or sender identifier." };
    }

    // Rate limiting: max 20 messages per 10-second window
    const rateCheck = checkRateLimit(`chat_${senderId}`, 20, 10000);
    if (!rateCheck.allowed) {
      return {
        data: null,
        error: `You are sending messages too quickly. Please wait ${rateCheck.retryAfterSeconds}s.`,
      };
    }

    const sanitized = sanitizeChatMessage(content);
    if (!sanitized) {
      return { data: null, error: "Message content cannot be empty." };
    }
    if (sanitized.length > 3000) {
      return { data: null, error: "Message exceeds maximum length of 3000 characters." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          id: `local-msg-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: senderId,
          content: sanitized,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          read_at: null,
        },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);

      const { data, error } = await sb
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: sanitized,
        })
        .select("*, sender:profiles(*)")
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Update conversation updated_at
      await sb
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return { data: data as ChatMessage, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to send message.",
      };
    }
  },

  /**
   * Retrieves an existing 1-on-1 conversation ID between two users,
   * or atomically creates one if none exists.
   */
  async getOrCreateConversation(
    userAId: string,
    userBId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<string>> {
    if (userAId === userBId) {
      return { data: null, error: "You cannot start a conversation with yourself." };
    }

    if (!checkConfigured()) {
      return { data: `local-conv-${userAId}-${userBId}`, error: null };
    }

    try {
      const sb = resolveClient(client);

      // Attempt atomic stored function RPC
      const { data: convId, error: rpcErr } = await sb.rpc("get_or_create_conversation", {
        p_user_a: userAId,
        p_user_b: userBId,
      });

      if (!rpcErr && convId) {
        return { data: convId, error: null };
      }

      // Fallback: check manually
      const { data: participationsA } = await sb
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userAId);

      if (participationsA && participationsA.length > 0) {
        const convIdsA = participationsA.map((p) => p.conversation_id);
        const { data: matchB } = await sb
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", userBId)
          .in("conversation_id", convIdsA)
          .maybeSingle();

        if (matchB) {
          return { data: matchB.conversation_id, error: null };
        }
      }

      // Insert new conversation and participants
      const { data: newConv, error: newConvErr } = await sb
        .from("conversations")
        .insert({})
        .select("id")
        .single();

      if (newConvErr || !newConv) {
        return { data: null, error: newConvErr?.message || "Failed to create conversation." };
      }

      await sb.from("conversation_participants").insert([
        { conversation_id: newConv.id, user_id: userAId },
        { conversation_id: newConv.id, user_id: userBId },
      ]);

      return { data: newConv.id, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to open conversation.",
      };
    }
  },

  /**
   * Marks unread messages in a conversation as read.
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<number>> {
    if (!checkConfigured()) {
      return { data: 0, error: null };
    }

    try {
      const sb = resolveClient(client);

      // Phase 17: Check user preferences for read receipts
      const { data: pref } = await sb
        .from("user_preferences")
        .select("read_receipts_enabled")
        .eq("user_id", userId)
        .maybeSingle();

      const readReceiptsEnabled = pref?.read_receipts_enabled ?? true;
      const nowIso = new Date().toISOString();

      // If user disabled read receipts, DO NOT stamp messages.read_at.
      // Only advance the participant's last_read_at timestamp to clear their unread counter.
      if (!readReceiptsEnabled) {
        await sb
          .from("conversation_participants")
          .update({ last_read_at: nowIso })
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);

        return { data: 0, error: null };
      }

      // If read receipts are enabled, attempt atomic RPC
      const { data, error: rpcErr } = await sb.rpc("mark_messages_read", {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });

      if (!rpcErr && typeof data === "number") {
        return { data, error: null };
      }

      // Fallback: update messages directly
      const { error: updErr } = await sb
        .from("messages")
        .update({ read_at: nowIso })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("read_at", null);

      if (updErr) {
        return { data: null, error: updErr.message };
      }

      await sb
        .from("conversation_participants")
        .update({ last_read_at: nowIso })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      return { data: 1, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to mark messages as read.",
      };
    }
  },


  /**
   * Subscribes to real-time message inserts and updates for a specific conversation.
   * Returns a cleanup function to unsubscribe and remove the channel.
   */
  subscribeToConversation(
    conversationId: string,
    callbacks: {
      onNewMessage: (message: ChatMessage) => void;
      onMessageUpdated?: (message: MessageRow) => void;
    },
    client?: SupabaseClient<Database>
  ): () => void {
    if (!checkConfigured()) {
      return () => {};
    }

    const sb = resolveClient(client);
    const channelName = `conversation:${conversationId}`;

    const channel: RealtimeChannel = sb
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newRow = payload.new as MessageRow;
          // Optionally fetch sender profile to enrich the message
          try {
            const { data: sender } = await sb
              .from("profiles")
              .select("*")
              .eq("id", newRow.sender_id)
              .maybeSingle();

            callbacks.onNewMessage({
              ...newRow,
              sender: sender || null,
            });
          } catch {
            callbacks.onNewMessage(newRow as ChatMessage);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (callbacks.onMessageUpdated) {
            callbacks.onMessageUpdated(payload.new as MessageRow);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  },
};
