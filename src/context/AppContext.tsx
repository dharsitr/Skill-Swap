"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  OnboardingState,
  SessionItem,
  Conversation,
  WalletTransaction,
} from "@/types";
import { AVATAR_OPTIONS } from "@/constants/config";

export type { OnboardingState, SessionItem, Conversation, WalletTransaction };

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  teachingSkills: [],
  learningSkills: [],
  fullName: "",
  headline: "",
  bio: "",
  avatarUrl: AVATAR_OPTIONS[0],
  location: "",
  timezone: "",
  availableDays: [],
  preferredSlots: [],
  sessionDuration: "45 minutes",
};

export const UPCOMING_SESSIONS: SessionItem[] = [];
export const INITIAL_CONVERSATIONS: Conversation[] = [];
export const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

export type ActiveScreen = "landing" | "auth" | "onboarding" | "dashboard";

interface AppContextType {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
  onboardingData: OnboardingState;
  updateOnboardingData: (partial: Partial<OnboardingState>) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  userCredits: number;
  setUserCredits: (credits: number | ((prev: number) => number)) => void;
  welcomeCreditsAwarded: boolean;
  awardWelcomeCredits: () => void;
  sessions: SessionItem[];
  addSession: (session: SessionItem) => void;
  cancelSession: (sessionId: string) => void;
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
  transactions: WalletTransaction[];
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  toast: { message: string; type: "success" | "info" | "error" } | null;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "skillswap_state_v3";

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("landing");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [onboardingData, setOnboardingData] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [welcomeCreditsAwarded, setWelcomeCreditsAwarded] = useState<boolean>(false);
  const [sessions, setSessions] = useState<SessionItem[]>(UPCOMING_SESSIONS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount (SSR-safe, prevents hydration mismatches)
  useEffect(() => {
    try {
      localStorage.removeItem("skillswap_state_v2");
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed.activeScreen) setActiveScreen(parsed.activeScreen);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.onboardingData) setOnboardingData(parsed.onboardingData);
        if (parsed.onboardingStep !== undefined) setOnboardingStep(parsed.onboardingStep);
        if (parsed.userCredits !== undefined) setUserCredits(parsed.userCredits);
        if (parsed.welcomeCreditsAwarded !== undefined) setWelcomeCreditsAwarded(parsed.welcomeCreditsAwarded);
        if (parsed.sessions) setSessions(parsed.sessions);
      }
    } catch {
      // Ignore parse/storage errors
    }
    setIsLoaded(true);
  }, []);

  // Sync state changes to localStorage only after initial client load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          onboardingData,
          onboardingStep,
          userCredits,
          welcomeCreditsAwarded,
          activeScreen,
          activeTab,
          sessions,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [isLoaded, onboardingData, onboardingStep, userCredits, welcomeCreditsAwarded, activeScreen, activeTab, sessions]);

  const updateOnboardingData = (partial: Partial<OnboardingState>) => {
    setOnboardingData((prev) => ({ ...prev, ...partial }));
  };

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const awardWelcomeCredits = () => {
    if (!welcomeCreditsAwarded) {
      setUserCredits((prev) => prev + 50);
      setWelcomeCreditsAwarded(true);
      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          title: "Welcome Onboarding Bonus",
          date: "Today",
          amount: 50,
          type: "bonus",
          status: "Completed",
        },
        ...prev,
      ]);
    }
  };

  const addSession = (session: SessionItem) => {
    setSessions((prev) => [session, ...prev]);
    showToast(`Session booked with ${session.partnerName}!`);
  };

  const cancelSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast("Session cancelled.");
  };

  const sendMessage = (conversationId: string, text: string) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: "user" as const,
      text: text.trim(),
      timestamp: "Just now",
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: text.trim(),
            lastMessageTime: "Just now",
            messages: [...c.messages, userMsg],
          };
        }
        return c;
      })
    );

    // Simulated peer auto-reply after 1.2s for realism
    setTimeout(() => {
      const replies = [
        "Sounds great, let's definitely cover that during our session!",
        "Thanks for the update! Looking forward to swapping skills.",
        "Perfect! I've marked it down on my calendar.",
        "Got it! Let me know if you want to prepare anything in advance.",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const peerMsg = {
        id: `msg-peer-${Date.now()}`,
        sender: "peer" as const,
        text: randomReply,
        timestamp: "Just now",
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              lastMessage: randomReply,
              lastMessageTime: "Just now",
              messages: [...c.messages, peerMsg],
            };
          }
          return c;
        })
      );
    }, 1200);
  };

  const resetDemo = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("skillswap_state_v2");
    }
    setOnboardingData(INITIAL_ONBOARDING_STATE);
    setOnboardingStep(1);
    setUserCredits(0);
    setWelcomeCreditsAwarded(false);
    setSessions([]);
    setConversations([]);
    setTransactions([]);
    setActiveScreen("landing");
    setActiveTab("dashboard");
    showToast("Application state cleared.", "info");
  };

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        activeTab,
        setActiveTab,
        authMode,
        setAuthMode,
        onboardingData,
        updateOnboardingData,
        onboardingStep,
        setOnboardingStep,
        userCredits,
        setUserCredits,
        welcomeCreditsAwarded,
        awardWelcomeCredits,
        sessions,
        addSession,
        cancelSession,
        conversations,
        sendMessage,
        transactions,
        showToast,
        toast,
        resetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
