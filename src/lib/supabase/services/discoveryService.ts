import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  AvailabilityRow,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { DAY_NAME_MAP } from "./availabilityService";
import { MOCK_MENTORS } from "@/data/mockData";

export interface DiscoverableSkill {
  id: string;
  name: string;
  category: string;
  type: "teach" | "learn";
}

export interface DiscoverableAvailability {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
}

export interface DiscoverableUser {
  id: string;
  displayName: string;
  username: string | null;
  headline: string;
  bio: string;
  avatarUrl: string | null;
  location: string;
  timezone: string;
  teachSkills: DiscoverableSkill[];
  learnSkills: DiscoverableSkill[];
  availability: DiscoverableAvailability[];
  availableDays: string[];
  createdAt: string;
}

export const discoveryService = {
  /**
   * Fetches all discoverable peer users from Supabase, excluding the current user.
   * Joins profiles, user_skills (with skill details), and availability in optimized batches.
   */
  async getDiscoverableUsers(
    currentUserId?: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<DiscoverableUser[]>> {
    if (!checkConfigured()) {
      return { data: this.getFallbackDiscoverableUsers(currentUserId), error: null };
    }

    try {
      const sb = resolveClient(client);

      // 1. Fetch profiles (excluding current user)
      let query = sb
        .from("profiles")
        .select("id, username, display_name, headline, bio, avatar_url, location, timezone, created_at")
        .order("created_at", { ascending: false });

      if (currentUserId) {
        query = query.neq("id", currentUserId);
      }

      const { data: profiles, error: profileErr } = await query;

      if (profileErr) {
        return { data: null, error: profileErr.message };
      }

      if (!profiles || profiles.length === 0) {
        // Fallback for local development when database has only 0 or 1 user
        return { data: this.getFallbackDiscoverableUsers(currentUserId), error: null };
      }

      const profileIds = profiles.map((p) => p.id);

      // 2. Batch fetch user_skills with skills join
      const { data: userSkillsData } = await sb
        .from("user_skills")
        .select(`
          id,
          user_id,
          type,
          skill:skills (
            id,
            name,
            category
          )
        `)
        .in("user_id", profileIds);

      // 3. Batch fetch availability
      const { data: availData } = await sb
        .from("availability")
        .select("id, user_id, day_of_week, start_time, end_time")
        .in("user_id", profileIds)
        .order("day_of_week", { ascending: true });

      // Group skills by user_id
      const teachMap = new Map<string, DiscoverableSkill[]>();
      const learnMap = new Map<string, DiscoverableSkill[]>();

      interface RawUserSkill {
        id: string;
        user_id: string;
        type: "teach" | "learn";
        skill: { id: string; name: string; category: string } | null;
      }

      ((userSkillsData || []) as unknown as RawUserSkill[]).forEach((item) => {
        if (!item.skill) return;
        const skillObj: DiscoverableSkill = {
          id: item.skill.id,
          name: item.skill.name,
          category: item.skill.category,
          type: item.type,
        };

        if (item.type === "teach") {
          const list = teachMap.get(item.user_id) || [];
          list.push(skillObj);
          teachMap.set(item.user_id, list);
        } else {
          const list = learnMap.get(item.user_id) || [];
          list.push(skillObj);
          learnMap.set(item.user_id, list);
        }
      });

      // Group availability by user_id
      const availMap = new Map<string, DiscoverableAvailability[]>();
      ((availData || []) as AvailabilityRow[]).forEach((item) => {
        const list = availMap.get(item.user_id) || [];
        list.push({
          id: item.id,
          dayOfWeek: item.day_of_week,
          dayName: DAY_NAME_MAP[item.day_of_week] || `Day ${item.day_of_week}`,
          startTime: item.start_time,
          endTime: item.end_time,
        });
        availMap.set(item.user_id, list);
      });

      // 4. Batch fetch privacy preferences (Phase 17)
      const { data: privacyData } = await sb
        .from("privacy_preferences")
        .select("*")
        .in("user_id", profileIds);

      const privacyMap = new Map(privacyData?.map((pr) => [pr.user_id, pr]) || []);

      // If any users have 'connections' visibility, check if current user is connected
      const connectedUserIds = new Set<string>();
      if (currentUserId) {

        const { data: connData } = await sb
          .from("connection_requests")
          .select("sender_id, receiver_id")
          .eq("status", "accepted")
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

        if (connData) {
          connData.forEach((c) => {
            if (c.sender_id === currentUserId) connectedUserIds.add(c.receiver_id);
            if (c.receiver_id === currentUserId) connectedUserIds.add(c.sender_id);
          });
        }
      }

      // Combine into DiscoverableUser objects respecting privacy preferences
      const users: DiscoverableUser[] = [];
      for (const p of profiles) {
        const pref = privacyMap.get(p.id);

        // Check profile visibility preference
        if (pref?.profile_visibility === "hidden") {
          continue;
        }
        if (pref?.profile_visibility === "connections") {
          if (!currentUserId || !connectedUserIds.has(p.id)) {
            continue;
          }
        }

        const rawAvail = availMap.get(p.id) || [];
        // If show_availability is disabled, hide availability
        const userAvail = pref && pref.show_availability === false ? [] : rawAvail;
        const uniqueDays = Array.from(new Set(userAvail.map((a) => a.dayName)));

        users.push({
          id: p.id,
          displayName: p.display_name || p.username || "Anonymous Mentor",
          username: p.username,
          headline: p.headline || "SkillSwap Member",
          bio: p.bio || "Passionate about mutual learning and sharing expertise.",
          avatarUrl: p.avatar_url,
          location: p.location || "Remote",
          timezone: p.timezone || "UTC",
          teachSkills: teachMap.get(p.id) || [],
          learnSkills: learnMap.get(p.id) || [],
          availability: userAvail,
          availableDays: uniqueDays,
          createdAt: p.created_at,
        });
      }


      // If database has very few profiles (e.g., just testing), supplement with fallback peers
      if (users.length < 3) {
        const fallbacks = this.getFallbackDiscoverableUsers(currentUserId);
        const existingIds = new Set(users.map((u) => u.id));
        const filteredFallbacks = fallbacks.filter((f) => !existingIds.has(f.id));
        return { data: [...users, ...filteredFallbacks], error: null };
      }

      return { data: users, error: null };
    } catch {
      return {
        data: this.getFallbackDiscoverableUsers(currentUserId),
        error: null,
      };
    }
  },

  /**
   * Fetches public profile for a single user.
   */
  async getUserPublicProfile(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<DiscoverableUser | null>> {
    if (!checkConfigured()) {
      const fallback = this.getFallbackDiscoverableUsers().find((u) => u.id === userId);
      return { data: fallback || null, error: null };
    }

    try {
      const sb = resolveClient(client);

      const { data: profile, error: profileErr } = await sb
        .from("profiles")
        .select("id, username, display_name, headline, bio, avatar_url, location, timezone, created_at")
        .eq("id", userId)
        .single();

      if (profileErr || !profile) {
        const fallback = this.getFallbackDiscoverableUsers().find((u) => u.id === userId);
        return { data: fallback || null, error: null };
      }

      // Fetch user skills
      const { data: userSkills } = await sb
        .from("user_skills")
        .select(`
          id,
          type,
          skill:skills (
            id,
            name,
            category
          )
        `)
        .eq("user_id", userId);

      // Fetch availability
      const { data: avail } = await sb
        .from("availability")
        .select("id, day_of_week, start_time, end_time")
        .eq("user_id", userId)
        .order("day_of_week", { ascending: true });

      const teachSkills: DiscoverableSkill[] = [];
      const learnSkills: DiscoverableSkill[] = [];

      interface RawSingleSkill {
        id: string;
        type: "teach" | "learn";
        skill: { id: string; name: string; category: string } | null;
      }

      ((userSkills || []) as unknown as RawSingleSkill[]).forEach((item) => {
        if (!item.skill) return;
        const s: DiscoverableSkill = {
          id: item.skill.id,
          name: item.skill.name,
          category: item.skill.category,
          type: item.type,
        };
        if (item.type === "teach") teachSkills.push(s);
        else learnSkills.push(s);
      });

      const availability: DiscoverableAvailability[] = ((avail || []) as AvailabilityRow[]).map((a) => ({
        id: a.id,
        dayOfWeek: a.day_of_week,
        dayName: DAY_NAME_MAP[a.day_of_week] || `Day ${a.day_of_week}`,
        startTime: a.start_time,
        endTime: a.end_time,
      }));

      const availableDays = Array.from(new Set(availability.map((a) => a.dayName)));

      const publicUser: DiscoverableUser = {
        id: profile.id,
        displayName: profile.display_name || profile.username || "SkillSwap Peer",
        username: profile.username,
        headline: profile.headline || "SkillSwap Mentor",
        bio: profile.bio || "Enthusiastic about exchanging knowledge.",
        avatarUrl: profile.avatar_url,
        location: profile.location || "Remote",
        timezone: profile.timezone || "UTC",
        teachSkills,
        learnSkills,
        availability,
        availableDays,
        createdAt: profile.created_at,
      };

      return { data: publicUser, error: null };
    } catch {
      const fallback = this.getFallbackDiscoverableUsers().find((u) => u.id === userId);
      return { data: fallback || null, error: null };
    }
  },

  /**
   * Translates MOCK_MENTORS into typed DiscoverableUser structure for reliable development.
   */
  getFallbackDiscoverableUsers(excludeUserId?: string): DiscoverableUser[] {
    return MOCK_MENTORS.filter((m) => m.id !== excludeUserId).map((m) => ({
      id: m.id,
      displayName: m.name,
      username: m.name.toLowerCase().replace(/\s+/g, "_"),
      headline: m.headline,
      bio: `${m.name} is an experienced mentor specializing in ${m.teaches.join(", ")}. Passionate about sharing knowledge and learning from peers.`,
      avatarUrl: m.avatar,
      location: m.location,
      timezone: "UTC+00:00",
      teachSkills: m.teaches.map((skillName, idx) => ({
        id: `mock-skill-t-${idx}-${skillName}`,
        name: skillName,
        category: "General",
        type: "teach",
      })),
      learnSkills: m.wantsToLearn.map((skillName, idx) => ({
        id: `mock-skill-l-${idx}-${skillName}`,
        name: skillName,
        category: "General",
        type: "learn",
      })),
      availability: m.availableDays.map((dayName, idx) => ({
        id: `mock-avail-${idx}-${dayName}`,
        dayOfWeek: idx + 1,
        dayName,
        startTime: "09:00:00",
        endTime: "17:00:00",
      })),
      availableDays: m.availableDays,
      createdAt: new Date().toISOString(),
    }));
  },
};
