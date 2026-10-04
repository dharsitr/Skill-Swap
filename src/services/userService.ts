import { User, OnboardingData } from "@/types";
import { DEFAULT_AVATARS } from "@/constants/config";
import { supabase } from "@/lib/supabase/client";
import { profileService } from "@/lib/supabase/services";

const FALLBACK_USER: User = {
  id: "user-default",
  name: "",
  email: "",
  avatarUrl: DEFAULT_AVATARS[0],
  headline: "",
  bio: "",
  location: "",
  timezone: "",
  credits: 0,
  rating: 0,
  swapsCompleted: 0,
  createdAt: new Date().toISOString(),
};

export const userService = {
  async getCurrentUser(): Promise<User> {
    try {
      if (supabase.isConfigured()) {
        const { data: { user } } = await supabase.client.auth.getUser();
        if (user) {
          const { data: profile } = await profileService.getProfile(user.id);
          return {
            ...FALLBACK_USER,
            id: user.id,
            email: user.email || FALLBACK_USER.email,
            name: profile?.display_name || user.user_metadata?.full_name || FALLBACK_USER.name,
            headline: profile?.headline || FALLBACK_USER.headline,
            avatarUrl: profile?.avatar_url || FALLBACK_USER.avatarUrl,
            bio: profile?.bio || FALLBACK_USER.bio,
            location: profile?.location || FALLBACK_USER.location,
            timezone: profile?.timezone || FALLBACK_USER.timezone,
            createdAt: user.created_at || FALLBACK_USER.createdAt,
          };
        }
      }
    } catch {
      // Return fallback user on network/configuration error
    }

    return { ...FALLBACK_USER };
  },

  async updateProfile(partial: Partial<User>): Promise<User> {
    try {
      if (supabase.isConfigured()) {
        const { data: { user } } = await supabase.client.auth.getUser();
        if (user) {
          await profileService.updateProfile(user.id, {
            display_name: partial.name,
            bio: partial.bio,
            avatar_url: partial.avatarUrl,
            headline: partial.headline,
            location: partial.location,
            timezone: partial.timezone,
          });
        }
      }
    } catch {
      // Non-blocking
    }

    Object.assign(FALLBACK_USER, partial);
    return Promise.resolve({ ...FALLBACK_USER });
  },

  async syncOnboardingProfile(data: OnboardingData): Promise<User> {
    FALLBACK_USER.name = data.fullName;
    FALLBACK_USER.headline = data.headline;
    FALLBACK_USER.bio = data.bio;
    FALLBACK_USER.avatarUrl = data.avatarUrl;
    FALLBACK_USER.location = data.location;
    FALLBACK_USER.timezone = data.timezone;
    return Promise.resolve({ ...FALLBACK_USER });
  },
};
