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
