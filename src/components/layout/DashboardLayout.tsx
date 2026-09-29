"use client";

import React, { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Avatar } from "@/components/ui/avatar";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { notificationService } from "@/lib/supabase/services/notificationService";
import { Bell, ChevronDown, Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { onboardingData } = useApp();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || onboardingData.fullName || "Dharsit";
  const avatarSrc = profile?.avatar_url || onboardingData.avatarUrl;

  // Sync unread notification count & auto-check 24h reminders
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    // Initial fetch of unread count
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount(user.id);
        if (isMounted && typeof res.data === "number") setUnreadCount(res.data);
      } catch {
        // Handled gracefully
      }
    };

    fetchUnread();

    // Check for any upcoming session reminders (within 24h)
    notificationService.checkSessionReminders(user.id).then(() => {
      if (isMounted) fetchUnread();
    });

    // Real-time subscription to notifications
    const unsubscribe = notificationService.subscribeToNotifications(user.id, {
      onNewNotification: () => {
        if (isMounted) {
          setUnreadCount((prev) => prev + 1);
        }
      },
      onNotificationUpdated: () => {
        if (isMounted) {
          fetchUnread();
        }
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.id]);

  // Generate page title segment
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[1] || "overview";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Drawer Navigation */}
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              {currentSegment !== "overview" && (
                <>
                  <span>/</span>
                  <span className="text-indigo-600 font-bold capitalize">
                    {currentSegment.replace("-", " ")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Credit Balance Link Chip */}
            <CreditBalance asLink variant="chip" size="sm" />

            {/* Notification Bell */}
            <button
              onClick={() => setNotifModalOpen(true)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-in zoom-in-50 duration-200">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Chip */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all select-none"
            >
              <Avatar
                src={avatarSrc}
                alt={displayName}
                size="sm"
                isOnline={true}
              />
              <span className="text-xs font-bold text-slate-900 hidden sm:inline-block">
                {displayName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Dashboard Page Content */}
        <main className="p-4 sm:p-8 max-w-6xl w-full mx-auto flex-1">{children}</main>
      </div>

      {/* Notifications Drawer / Modal */}
      {user && (
        <NotificationCenter
          isOpen={notifModalOpen}
          onClose={() => setNotifModalOpen(false)}
          currentUserId={user.id}
          onUnreadCountChange={setUnreadCount}
        />
      )}
    </div>
  );
}
