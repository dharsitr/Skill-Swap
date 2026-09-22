import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  SessionDbRow,
  SessionDbInsert,
  SessionStatus,
  ProfileRow,
  SkillDbRow,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

export interface SessionWithRelations extends SessionDbRow {
  teacher?: ProfileRow;
  learner?: ProfileRow;
  skill?: SkillDbRow;
}

export const sessionService = {
  /**
   * Retrieves all sessions where the user is either the teacher or the learner.
   */
  async getUserSessions(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionWithRelations[]>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("sessions")
      .select(`
        *,
        teacher:profiles!sessions_teacher_id_fkey (*),
        learner:profiles!sessions_learner_id_fkey (*),
        skill:skills (*)
      `)
      .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
      .order("scheduled_at", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: (data as unknown as SessionWithRelations[]) ?? [],
      error: null,
    };
  },

  /**
   * Retrieves a single session by ID.
   */
  async getSessionById(
    sessionId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionWithRelations>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("sessions")
      .select(`
        *,
        teacher:profiles!sessions_teacher_id_fkey (*),
        learner:profiles!sessions_learner_id_fkey (*),
        skill:skills (*)
      `)
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: (data as unknown as SessionWithRelations) ?? null,
      error: null,
    };
  },

  /**
   * Creates a new session record.
   */
  async createSession(
    payload: SessionDbInsert,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionDbRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("sessions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Updates status of an existing session (pending, confirmed, completed, cancelled).
   */
  async updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SessionDbRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("sessions")
      .update({ status })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },
};
