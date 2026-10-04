import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  SkillDbRow,
  UserSkillRow,
  UserSkillInsert,
  SkillType,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { POPULAR_SKILLS } from "@/constants/config";

export interface UserSkillWithDetails extends UserSkillRow {
  skill?: SkillDbRow;
}

export const skillService = {
  /**
   * Retrieves all available skills.
   * If the skills table is empty, gracefully seeds the core default skills.
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

    // If table is completely empty, seed default skills for smooth first-run experience
    if (!data || data.length === 0) {
      try {
        const seedPayload = POPULAR_SKILLS.map((s) => ({
          name: s.name,
          category: s.category,
        }));
        const { data: seeded, error: seedError } = await sb
          .from("skills")
          .upsert(seedPayload, { onConflict: "name" })
          .select();

        if (!seedError && seeded) {
          return { data: seeded, error: null };
        }
      } catch {
        // Fallback to empty if seeding fails due to permissions
      }
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

    if (category === "All") {
      return this.getAllSkills(client);
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
   * Finds an existing skill by name (case-insensitive) or creates a new entry in the catalog.
   */
  async findOrCreateSkill(
    name: string,
    category = "Other",
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<SkillDbRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const trimmed = name.trim();

    // 1. Search for existing match
    const { data: existing } = await sb
      .from("skills")
      .select("*")
      .ilike("name", trimmed)
      .maybeSingle();

    if (existing) {
      return { data: existing, error: null };
    }

    // 2. Insert new skill
    const { data: created, error: insertError } = await sb
      .from("skills")
      .insert({ name: trimmed, category })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: created, error: null };
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
   * Adds a skill to a user's profile (teach or learn) with duplicate checking.
   */
  async addUserSkill(
    payload: UserSkillInsert,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<UserSkillRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);

    // Duplicate check
    const { data: existing } = await sb
      .from("user_skills")
      .select("*")
      .eq("user_id", payload.user_id)
      .eq("skill_id", payload.skill_id)
      .eq("type", payload.type)
      .maybeSingle();

    if (existing) {
      return { data: existing, error: null };
    }

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

  /**
   * Synchronizes all teaching and learning skills for a user.
   * Useful for onboarding and full profile updates.
   */
  async syncUserSkills(
    userId: string,
    teachSkillNames: string[],
    learnSkillNames: string[],
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<boolean>> {
    if (!checkConfigured()) {
      return { data: false, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);

    try {
      // 1. Resolve or create all skill records
      const allNames = Array.from(new Set([...teachSkillNames, ...learnSkillNames]));
      const skillMap = new Map<string, string>(); // name -> id

      for (const name of allNames) {
        if (!name.trim()) continue;
        const res = await this.findOrCreateSkill(name.trim(), "Other", client);
        if (res.data) {
          skillMap.set(name.trim().toLowerCase(), res.data.id);
        }
      }

      // 2. Remove previous skills for this user
      await sb.from("user_skills").delete().eq("user_id", userId);

      // 3. Build new records
      const insertRows: UserSkillInsert[] = [];

      teachSkillNames.forEach((name) => {
        const id = skillMap.get(name.trim().toLowerCase());
        if (id) {
          insertRows.push({
            user_id: userId,
            skill_id: id,
            type: "teach",
          });
        }
      });

      learnSkillNames.forEach((name) => {
        const id = skillMap.get(name.trim().toLowerCase());
        if (id) {
          insertRows.push({
            user_id: userId,
            skill_id: id,
            type: "learn",
          });
        }
      });

      if (insertRows.length > 0) {
        const { error: insertError } = await sb.from("user_skills").insert(insertRows);
        if (insertError) {
          return { data: false, error: insertError.message };
        }
      }

      return { data: true, error: null };
    } catch (err) {
      return {
        data: false,
        error: err instanceof Error ? err.message : "Failed to sync user skills.",
      };
    }
  },
};
