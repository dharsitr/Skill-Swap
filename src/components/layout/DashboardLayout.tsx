"use client";

import React, { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, Menu, Sparkles, CheckCircle2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { onboardingData, userCredits } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

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
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setNotifModalOpen(true)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            {/* User Profile Chip */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all select-none"
            >
              <Avatar
                src={onboardingData.avatarUrl}
                alt={onboardingData.fullName}
                size="sm"
                isOnline={true}
              />
              <span className="text-xs font-bold text-slate-900 hidden sm:inline-block">
                {onboardingData.fullName || "Dharsit"}
              </span>
              <span className="text-xs font-semibold text-indigo-600 hidden md:inline-block">
                🪙 {userCredits}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Dashboard Page Content */}
        <main className="p-4 sm:p-8 max-w-6xl w-full mx-auto flex-1">{children}</main>
      </div>

      {/* Notifications Modal */}
      <Modal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        title="Notifications"
        description="Stay updated with incoming swap requests and peer session reminders."
      >
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs">
            <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Priya Sharma accepted your UI/UX swap request</div>
              <div className="text-slate-500 mt-0.5">Session scheduled for tomorrow at 4:00 PM.</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Welcome bonus credited</div>
              <div className="text-slate-500 mt-0.5">50 credits have been deposited to your account.</div>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setNotifModalOpen(false)}>
            Mark all as read
          </Button>
        </div>
      </Modal>
    </div>
  );
}
