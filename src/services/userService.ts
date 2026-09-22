import { User, OnboardingData } from "@/types";
import { DEFAULT_AVATARS } from "@/constants/config";

const MOCK_USER: User = {
  id: "user-1",
  name: "Dharsit R",
  email: "dharsit@example.com",
  avatarUrl: DEFAULT_AVATARS[0],
  headline: "Full Stack Learner & Designer",
  bio: "Curious builder passionate about full-stack web applications, modern interaction design, and mutual peer mentoring.",
  location: "Chennai, India",
  timezone: "Asia/Kolkata (IST, GMT+5:30)",
  credits: 42,
  rating: 5.0,
  swapsCompleted: 12,
  createdAt: "2026-01-15T00:00:00Z",
};

export const userService = {
  async getCurrentUser(): Promise<User> {
    // Simulated async fetch (ready for Supabase auth.getUser())
    return Promise.resolve({ ...MOCK_USER });
  },

  async updateProfile(partial: Partial<User>): Promise<User> {
    Object.assign(MOCK_USER, partial);
    return Promise.resolve({ ...MOCK_USER });
  },

  async syncOnboardingProfile(data: OnboardingData): Promise<User> {
    MOCK_USER.name = data.fullName;
    MOCK_USER.headline = data.headline;
    MOCK_USER.bio = data.bio;
    MOCK_USER.avatarUrl = data.avatarUrl;
    MOCK_USER.location = data.location;
    MOCK_USER.timezone = data.timezone;
    return Promise.resolve({ ...MOCK_USER });
  },
};
