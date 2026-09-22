"use client";

import React from "react";
import { useApp, ActiveScreen } from "@/context/AppContext";
import { Sparkles, Compass, UserCheck, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppViewSwitcher() {
  const { activeScreen, setActiveScreen, onboardingStep, resetDemo } = useApp();

  const screens: { id: ActiveScreen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "landing", label: "Landing", icon: Sparkles },
    { id: "auth", label: "Login / Signup", icon: UserCheck },
    { id: "onboarding", label: `Onboarding (${onboardingStep}/5)`, icon: Compass },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <aside
      aria-label="Screen switcher"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-1.5 select-none text-xs"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 hidden sm:inline-block">
        Screens:
      </span>
      {screens.map((s) => {
        const Icon = s.icon;
        const isActive = activeScreen === s.id;

        return (
          <button
            key={s.id}
            onClick={() => {
              setActiveScreen(s.id);
              if (s.id === "onboarding" && onboardingStep === 5) {
                // Keep step or allow browsing
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer",
              isActive
                ? "bg-indigo-600 text-white shadow-xs shadow-indigo-500/50"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{s.label}</span>
          </button>
        );
      })}

      <div className="h-3.5 w-px bg-slate-700 mx-0.5 hidden sm:block" />

      <button
        onClick={resetDemo}
        className="px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-full font-bold transition-all text-[11px] cursor-pointer"
        title="Reset mock state to defaults"
      >
        Reset Demo
      </button>
    </aside>
  );
}
