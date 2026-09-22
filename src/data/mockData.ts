export interface SkillItem {
  id: string;
  name: string;
  category: "Code" | "Design" | "Business" | "Language" | "Music" | "Other";
  icon: string;
  learners: string;
  badgeColor: string;
}

export const POPULAR_SKILLS: SkillItem[] = [
  { id: "python", name: "Python", category: "Code", icon: "Code2", learners: "12.4k learners", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { id: "ui-ux", name: "UI/UX Design", category: "Design", icon: "Palette", learners: "9.8k learners", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { id: "react", name: "React & Next.js", category: "Code", icon: "Boxes", learners: "15.1k learners", badgeColor: "bg-blue-50 text-blue-600 border-blue-100" },
  { id: "figma", name: "Figma", category: "Design", icon: "PenTool", learners: "8.2k learners", badgeColor: "bg-purple-50 text-purple-600 border-purple-100" },
  { id: "spanish", name: "Spanish", category: "Language", icon: "Languages", learners: "6.5k learners", badgeColor: "bg-amber-50 text-amber-600 border-amber-100" },
  { id: "speaking", name: "Public Speaking", category: "Business", icon: "Mic", learners: "4.9k learners", badgeColor: "bg-rose-50 text-rose-600 border-rose-100" },
  { id: "guitar", name: "Acoustic Guitar", category: "Music", icon: "Music", learners: "3.7k learners", badgeColor: "bg-teal-50 text-teal-600 border-teal-100" },
  { id: "marketing", name: "Digital Marketing", category: "Business", icon: "TrendingUp", learners: "7.1k learners", badgeColor: "bg-orange-50 text-orange-600 border-orange-100" },
  { id: "french", name: "French", category: "Language", icon: "Globe", learners: "5.3k learners", badgeColor: "bg-sky-50 text-sky-600 border-sky-100" },
  { id: "product-mgmt", name: "Product Strategy", category: "Business", icon: "Compass", learners: "6.0k learners", badgeColor: "bg-violet-50 text-violet-600 border-violet-100" },
  { id: "photography", name: "Photography", category: "Design", icon: "Camera", learners: "4.4k learners", badgeColor: "bg-pink-50 text-pink-600 border-pink-100" },
  { id: "data-science", name: "Data Science", category: "Code", icon: "BarChart3", learners: "10.2k learners", badgeColor: "bg-cyan-50 text-cyan-600 border-cyan-100" },
];

export const SKILL_CATEGORIES = ["All", "Code", "Design", "Business", "Language", "Music"] as const;

export const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
];

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const TIME_SLOTS = [
  "Morning (9:00 AM – 12:00 PM)",
  "Afternoon (12:00 PM – 4:00 PM)",
  "Evening (4:00 PM – 8:00 PM)",
  "Night (8:00 PM – 11:00 PM)",
] as const;

export const SESSION_DURATIONS = ["30 minutes", "45 minutes", "60 minutes"] as const;

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

export const UPCOMING_SESSIONS: SessionItem[] = [
  {
    id: "sess-1",
    topic: "React Fundamentals & State Management",
    partnerName: "Alex Johnson",
    partnerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    partnerRole: "Senior Frontend Engineer",
    role: "learning",
    time: "Today • 6:00 PM",
    duration: "45 min",
    date: "2026-09-21",
    status: "upcoming",
  },
  {
    id: "sess-2",
    topic: "UI/UX Design Systems in Figma",
    partnerName: "Priya Sharma",
    partnerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    partnerRole: "Staff Product Designer",
    role: "teaching",
    time: "Tomorrow • 4:00 PM",
    duration: "60 min",
    date: "2026-09-22",
    status: "upcoming",
  },
  {
    id: "sess-3",
    topic: "Conversational Spanish & Pronunciation",
    partnerName: "Mateo Rossi",
    partnerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    partnerRole: "Language Coach",
    role: "learning",
    time: "Friday • 7:30 PM",
    duration: "30 min",
    date: "2026-09-25",
    status: "upcoming",
  },
  {
    id: "sess-4",
    topic: "Python Automation Scripts",
    partnerName: "Sarah Connor",
    partnerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    partnerRole: "DevOps Specialist",
    role: "teaching",
    time: "Last week • Sep 14",
    duration: "45 min",
    date: "2026-09-14",
    status: "completed",
  },
];

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

export const MOCK_MENTORS: MentorProfile[] = [
  {
    id: "m-1",
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    headline: "Senior Frontend Engineer @ TechCorp",
    rating: 4.9,
    swapsCompleted: 34,
    teaches: ["React & Next.js", "TypeScript", "Tailwind CSS"],
    wantsToLearn: ["Python", "Machine Learning"],
    location: "San Francisco, USA",
    availableDays: ["Monday", "Wednesday"],
  },
  {
    id: "m-2",
    name: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    headline: "Design Systems Lead & Design Advocate",
    rating: 5.0,
    swapsCompleted: 48,
    teaches: ["UI/UX Design", "Figma", "Design Systems"],
    wantsToLearn: ["React & Next.js", "Acoustic Guitar"],
    location: "Bengaluru, India",
    availableDays: ["Tuesday", "Thursday", "Saturday"],
  },
  {
    id: "m-3",
    name: "Mateo Rossi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    headline: "Polyglot & Cultural Coach",
    rating: 4.8,
    swapsCompleted: 29,
    teaches: ["Spanish", "French", "Public Speaking"],
    wantsToLearn: ["Data Science", "Python"],
    location: "Madrid, Spain",
    availableDays: ["Friday", "Sunday"],
  },
  {
    id: "m-4",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    headline: "Product Marketing & Growth Consultant",
    rating: 4.9,
    swapsCompleted: 41,
    teaches: ["Digital Marketing", "Product Strategy"],
    wantsToLearn: ["UI/UX Design", "Figma"],
    location: "Berlin, Germany",
    availableDays: ["Monday", "Tuesday", "Friday"],
  },
];

export interface ChatMessage {
  id: string;
  sender: "user" | "peer";
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  peerName: string;
  peerAvatar: string;
  peerRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-alex",
    peerName: "Alex Johnson",
    peerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    peerRole: "Senior Frontend Engineer",
    lastMessage: "Looking forward to our React session today at 6:00 PM!",
    lastMessageTime: "2:15 PM",
    unreadCount: 1,
    messages: [
      { id: "m-1", sender: "peer", text: "Hey Dharsit! Glad we matched for the React session.", timestamp: "2:10 PM" },
      { id: "m-2", sender: "user", text: "Hi Alex! Really excited to dive into Next.js Server Components.", timestamp: "2:12 PM" },
      { id: "m-3", sender: "peer", text: "Looking forward to our React session today at 6:00 PM!", timestamp: "2:15 PM" },
    ],
  },
  {
    id: "conv-priya",
    peerName: "Priya Sharma",
    peerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    peerRole: "Staff Product Designer",
    lastMessage: "I reviewed your Figma token files, they look very structured!",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    messages: [
      { id: "p-1", sender: "user", text: "Hey Priya, sent over the design file link for tomorrow.", timestamp: "Yesterday 4:00 PM" },
      { id: "p-2", sender: "peer", text: "I reviewed your Figma token files, they look very structured!", timestamp: "Yesterday 5:30 PM" },
    ],
  },
  {
    id: "conv-mateo",
    peerName: "Mateo Rossi",
    peerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    peerRole: "Language Coach",
    lastMessage: "¡Hola! Are we still good for Friday Spanish practice?",
    lastMessageTime: "Sep 19",
    unreadCount: 0,
    messages: [
      { id: "mat-1", sender: "peer", text: "¡Hola! Are we still good for Friday Spanish practice?", timestamp: "Sep 19 11:00 AM" },
      { id: "mat-2", sender: "user", text: "Yes, definitely! See you on Friday at 7:30 PM.", timestamp: "Sep 19 11:45 AM" },
    ],
  },
];

export interface WalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: "earned" | "spent" | "bonus";
  status: "Completed" | "Pending";
}

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  { id: "tx-1", title: "Welcome Onboarding Reward", date: "Sep 21, 2026", amount: 50, type: "bonus", status: "Completed" },
  { id: "tx-2", title: "Taught: Python Automation to Sarah", date: "Sep 14, 2026", amount: 2, type: "earned", status: "Completed" },
  { id: "tx-3", title: "Learned: Figma Auto-layout with Priya", date: "Sep 10, 2026", amount: -2, type: "spent", status: "Completed" },
  { id: "tx-4", title: "Taught: UI Prototyping to Ken", date: "Sep 05, 2026", amount: 2, type: "earned", status: "Completed" },
];

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

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  teachingSkills: ["Python", "UI/UX Design"],
  learningSkills: ["React & Next.js", "Figma"],
  fullName: "Dharsit R",
  headline: "Full Stack Learner & Designer",
  bio: "Curious builder passionate about full-stack web applications, modern interaction design, and mutual peer mentoring.",
  avatarUrl: AVATAR_OPTIONS[0],
  location: "Chennai, India",
  timezone: "Asia/Kolkata (IST, GMT+5:30)",
  availableDays: ["Monday", "Wednesday", "Friday"],
  preferredSlots: ["Evening (4:00 PM – 8:00 PM)"],
  sessionDuration: "45 minutes",
};
