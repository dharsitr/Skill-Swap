export type SkillCategory = "Code" | "Design" | "Business" | "Language" | "Music" | "Other";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  icon: string;
  learnersCount: string;
  badgeColor?: string;
  description?: string;
}

export type SkillRole = "teaching" | "learning";

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  role: SkillRole;
  proficiencyLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience?: number;
}

export interface Availability {
  id?: string;
  userId: string;
  days: string[];
  preferredSlots: string[];
  sessionDuration: string;
}

export type SessionStatus = "upcoming" | "completed" | "cancelled";

export interface Session {
  id: string;
  topic: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerRole: string;
  role: SkillRole;
  scheduledAt: string;
  duration: string;
  date: string;
  status: SessionStatus;
  meetingUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  headline: string;
  bio: string;
  location: string;
  timezone: string;
  credits: number;
  rating: number;
  swapsCompleted: number;
  createdAt: string;
}

export type NotificationType = "swap_request" | "session_reminder" | "bonus" | "system";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface OnboardingData {
  teachingSkills: string[];
  learningSkills: string[];
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  timezone: string;
  availableDays: string[];
  preferredSlots: string[];
  sessionDuration: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "peer";
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  peerId?: string;
  peerName: string;
  peerAvatar: string;
  peerRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface WalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: "earned" | "spent" | "bonus";
  status: "Completed" | "Pending";
}

export interface Review {
  id: string;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1-5 integer
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithProfiles extends Review {
  reviewer?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    headline: string | null;
  };
  reviewee?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    headline: string | null;
  };
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewInput {
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  reviewId: string;
  rating: number;
  comment?: string;
}

export interface SessionItem {
  id: string;
  topic: string;
  partnerName: string;
  partnerAvatar: string;
  partnerRole: string;
  role: "teaching" | "learning";
  time: string;
  duration: string;
  date: string;
  status: "upcoming" | "completed" | "cancelled";
}

export interface WalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: "earned" | "spent" | "bonus";
  status: "Completed" | "Pending";
}

export interface OnboardingState {
  teachingSkills: string[];
  learningSkills: string[];
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  timezone: string;
  availableDays: string[];
  preferredSlots: string[];
  sessionDuration: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  rating: number;
  swapsCompleted: number;
  teaches: string[];
  wantsToLearn: string[];
  location: string;
  availableDays: string[];
}

