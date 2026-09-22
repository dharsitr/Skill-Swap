"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Avatar } from "@/components/ui/avatar";
import { DASHBOARD_NAV_ITEMS } from "@/constants/config";
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Calendar,
  MessageSquare,
  User,
  Settings,
  Sparkles,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Calendar,
  MessageSquare,
  User,
  Settings,
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { onboardingData, userCredits } = useApp();

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-30 select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="p-6 pb-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">
              Skill<span className="text-indigo-600">Swap</span>
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
            // Check active: exact match or prefix
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left",
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

                {"badge" in item && item.badge && (
                  <span
                    className={cn(
                      "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
                      isActive ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User Mini-Card */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
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

          <Link
            href="/login"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </Link>
      </div>
    </aside>
  );
}
