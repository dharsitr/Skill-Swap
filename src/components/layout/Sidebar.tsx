"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
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
  Coins,
  Sparkles,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { sessionService, chatService } from "@/lib/supabase/services";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Coins,
  Calendar,
  MessageSquare,
  User,
  Settings,
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { onboardingData, showToast } = useApp();
  const { user, profile, signOut } = useAuth();

  const [sessionCount, setSessionCount] = React.useState<number>(0);
  const [unreadMessageCount, setUnreadMessageCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (!user?.id) {
      setSessionCount(0);
      setUnreadMessageCount(0);
      return;
    }

    let isMounted = true;
    Promise.all([
      sessionService.getUserSessions(user.id),
      chatService.getUserConversations(user.id),
    ])
      .then(([sessRes, convRes]) => {
        if (!isMounted) return;
        if (sessRes.data) {
          const activeSessions = sessRes.data.filter(
            (s) => s.status === "confirmed" || s.status === "pending"
          ).length;
          setSessionCount(activeSessions);
        }
        if (convRes.data) {
          const totalUnread = convRes.data.reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadMessageCount(totalUnread);
        }
      })
      .catch(() => {
        // Fallback to 0
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || onboardingData.fullName || "Dharsit R";
  const avatarSrc = profile?.avatar_url || onboardingData.avatarUrl;

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await signOut();
    showToast("You have been signed out successfully.", "info");
    onNavigate?.();
    router.push("/login");
  };

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

                {(() => {
                  const badge =
                    item.id === "sessions" && sessionCount > 0
                      ? sessionCount
                      : item.id === "messages" && unreadMessageCount > 0
                      ? unreadMessageCount
                      : undefined;

                  if (!badge) return null;

                  return (
                    <span
                      className={cn(
                        "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
                        isActive ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {badge}
                    </span>
                  );
                })()}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User Mini-Card */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <Link
            href="/dashboard/profile"
            onClick={onNavigate}
            className="flex items-center gap-2.5 min-w-0 flex-1"
          >
            <Avatar src={avatarSrc} alt={displayName} size="sm" isOnline={true} />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {displayName}
              </span>
              <div className="mt-0.5">
                <CreditBalance size="sm" variant="plain" />
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
