import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  SkillDbRow,
  UserSkillRow,
  UserSkillInsert,
  SkillType,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

export interface UserSkillWithDetails extends UserSkillRow {
  skill?: SkillDbRow;
}

export const skillService = {
  /**
   * Retrieves all available skills.
   */
  async getAllSkills(client?: SupabaseClient<Database>): Promise<ServiceResult<SkillDbRow[]>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("skills")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Retrieves skills filtered by category.
   */
  async getSkillsByCategory(
    category: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SkillDbRow[]>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("skills")
      .select("*")
      .eq("category", category)
      .order("name", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Searches skills by name or category.
   */
  async searchSkills(
    query: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SkillDbRow[]>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getAllSkills(client);
    }

    const { data, error } = await sb
      .from("skills")
      .select("*")
      .or(`name.ilike.%${trimmed}%,category.ilike.%${trimmed}%`)
      .order("name", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Retrieves skills associated with a specific user.
   */
  async getUserSkills(
    userId: string,
    type?: SkillType,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<UserSkillWithDetails[]>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    let query = sb
      .from("user_skills")
      .select(`
        *,
        skill:skills (*)
      `)
      .eq("user_id", userId);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: (data as unknown as UserSkillWithDetails[]) ?? [],
      error: null,
    };
  },

  /**
   * Adds a skill to a user's profile (teach or learn).
   */
  async addUserSkill(
    payload: UserSkillInsert,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<UserSkillRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("user_skills")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Removes a skill association from a user.
   */
  async removeUserSkill(
    userSkillId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { error } = await sb
      .from("user_skills")
      .delete()
      .eq("id", userSkillId);

    if (error) {
      return { data: false, error: error.message };
    }

    return { data: true, error: null };
  },
};
