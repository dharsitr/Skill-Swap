export const APP_CONFIG = {
  name: "SkillSwap",
  tagline: "Learn something. Teach something.",
  description: "The 1-on-1 peer skill exchange network powered by time credits.",
  welcomeCredits: 50,
  defaultCredits: 42,
  creditRatePerHour: 2, // 1 credit per 30 mins
} as const;

export const DASHBOARD_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
  { id: "discover", label: "Discover", href: "/dashboard/discover", iconName: "Compass" },
  { id: "skills", label: "My Skills", href: "/dashboard/skills", iconName: "GraduationCap" },
  { id: "sessions", label: "Sessions", href: "/dashboard/sessions", iconName: "Calendar", badge: "2" },
  { id: "messages", label: "Messages", href: "/dashboard/messages", iconName: "MessageSquare", badge: "3" },
  { id: "profile", label: "Profile", href: "/dashboard/profile", iconName: "User" },
  { id: "settings", label: "Settings", href: "/dashboard/settings", iconName: "Settings" },
] as const;

export const SKILL_CATEGORIES = [
  "All",
  "Code",
  "Design",
  "Business",
  "Language",
  "Music",
] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const TIME_SLOTS = [
  "Morning (9:00 AM – 12:00 PM)",
  "Afternoon (12:00 PM – 4:00 PM)",
  "Evening (4:00 PM – 8:00 PM)",
  "Night (8:00 PM – 11:00 PM)",
] as const;

export const SESSION_DURATIONS = [
  "30 minutes",
  "45 minutes",
  "60 minutes",
] as const;

export const LOCATIONS = [
  "Chennai, India",
  "Bengaluru, India",
  "San Francisco, USA",
  "New York, USA",
  "London, UK",
  "Berlin, Germany",
  "Singapore",
  "Remote / Online",
] as const;

export const TIMEZONES = [
  "Asia/Kolkata (IST, GMT+5:30)",
  "America/New_York (EST, GMT-5)",
  "America/Los_Angeles (PST, GMT-8)",
  "Europe/London (BST, GMT+1)",
  "Europe/Berlin (CET, GMT+2)",
  "Asia/Singapore (SGT, GMT+8)",
] as const;

export const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
] as const;
