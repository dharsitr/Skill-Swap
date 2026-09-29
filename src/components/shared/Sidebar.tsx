"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Calendar,
  MessageSquare,
  Wallet,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  className?: string;
}

export function Sidebar({ activeTab = "dashboard", onSelectTab, className }: SidebarProps) {
  const { onboardingData, userCredits, setActiveScreen } = useApp();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "discover", label: "Discover", icon: Compass },
    { id: "my-skills", label: "My Skills", icon: GraduationCap },
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-30 select-none",
        className
      )}
    >
      {/* Top Header */}
      <div>
        <div className="p-6 pb-5 flex items-center justify-between">
          <div
            onClick={() => setActiveScreen("landing")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900">
                Skill<span className="text-indigo-600">Swap</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer text-left",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Credits Card */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar src={onboardingData.avatarUrl} alt={onboardingData.fullName} size="sm" isOnline={true} />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {onboardingData.fullName || "Dharsit R"}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                <span>🪙</span> {userCredits} Credits
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveScreen("landing")}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
