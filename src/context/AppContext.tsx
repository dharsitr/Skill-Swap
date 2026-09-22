"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  INITIAL_ONBOARDING_STATE,
  OnboardingState,
  UPCOMING_SESSIONS,
  SessionItem,
  INITIAL_CONVERSATIONS,
  Conversation,
  INITIAL_TRANSACTIONS,
  WalletTransaction,
} from "@/data/mockData";

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

const STORAGE_KEY = "skillswap_state_v2";

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed[key] !== undefined ? parsed[key] : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() => getStoredValue("activeScreen", "landing"));
  const [activeTab, setActiveTab] = useState<string>(() => getStoredValue("activeTab", "dashboard"));
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [onboardingData, setOnboardingData] = useState<OnboardingState>(() =>
    getStoredValue("onboardingData", INITIAL_ONBOARDING_STATE)
  );
  const [onboardingStep, setOnboardingStep] = useState<number>(() => getStoredValue("onboardingStep", 1));
  const [userCredits, setUserCredits] = useState<number>(() => getStoredValue("userCredits", 42));
  const [welcomeCreditsAwarded, setWelcomeCreditsAwarded] = useState<boolean>(() =>
    getStoredValue("welcomeCreditsAwarded", false)
  );
  const [sessions, setSessions] = useState<SessionItem[]>(() => getStoredValue("sessions", UPCOMING_SESSIONS));
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
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
  }, [onboardingData, onboardingStep, userCredits, welcomeCreditsAwarded, activeScreen, activeTab, sessions]);

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
    }
    setOnboardingData(INITIAL_ONBOARDING_STATE);
    setOnboardingStep(1);
    setUserCredits(42);
    setWelcomeCreditsAwarded(false);
    setSessions(UPCOMING_SESSIONS);
    setConversations(INITIAL_CONVERSATIONS);
    setActiveScreen("landing");
    setActiveTab("dashboard");
    showToast("Demo reset to initial state.", "info");
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
