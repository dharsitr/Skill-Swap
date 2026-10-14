"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/states/LoadingState";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { Avatar } from "@/components/ui/avatar";
import {
  notificationService,
  NotificationType,
} from "@/lib/supabase/services/notificationService";
import { NotificationDbRow } from "@/types/database.types";
import { playNotificationChime } from "@/lib/utils";
import {
  Bell,
  CheckCircle2,
  Calendar,
  Clock,
  Coins,
  UserPlus,
  Video,
  Trash2,
  Check,
  CheckCheck,
  Loader2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Star,
  Send,
  Radio,
  Search,
  Filter,
  Plus,
  User,
  Info,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

type FilterTab = "all" | "unread" | "sessions" | "connections" | "credits" | "reviews" | "system";

const PRESET_TEMPLATES = [
  {
    type: "session_confirmed" as NotificationType,
    title: "Session Confirmed",
    message: "Your React & Next.js exchange with Alex Chen has been confirmed for tomorrow at 4:00 PM.",
    linkUrl: "/dashboard/sessions",
  },
  {
    type: "credit_received" as NotificationType,
    title: "10 Credits Received",
    message: "You earned 10 skill credits for completing your Python mentorship session.",
    linkUrl: "/dashboard/credits",
  },
  {
    type: "connection_request" as NotificationType,
    title: "New Connection Request",
    message: "Sarah Miller wants to connect and swap UI/UX Design for your Python skills.",
    linkUrl: "/dashboard/discover",
  },
  {
    type: "review_received" as NotificationType,
    title: "New 5-Star Review Received",
    message: '"Incredible teacher! Explained full-stack architecture clearly in 30 minutes."',
    linkUrl: "/dashboard/profile",
  },
  {
    type: "session_reminder" as NotificationType,
    title: "Upcoming Session in 1 Hour",
    message: "Your video swap room is ready. Click below to review notes before entering.",
    linkUrl: "/dashboard/sessions",
  },
  {
    type: "system" as NotificationType,
    title: "Welcome to Realtime SkillSwap",
    message: "Realtime messaging, notifications, and instant peer matching are now active.",
    linkUrl: "/dashboard",
  },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case "session_booking":
    case "session_confirmed":
    case "session_completed":
      return <Calendar className="w-4 h-4 text-indigo-600" />;
    case "session_reminder":
      return <Video className="w-4 h-4 text-emerald-600" />;
    case "connection_request":
    case "connection_accepted":
      return <UserPlus className="w-4 h-4 text-blue-600" />;
    case "credit_received":
      return <Coins className="w-4 h-4 text-amber-600" />;
    case "review_received":
      return <Star className="w-4 h-4 fill-amber-400 text-amber-500" />;
    case "message":
      return <MessageSquare className="w-4 h-4 text-violet-600" />;
    default:
      return <Sparkles className="w-4 h-4 text-indigo-600" />;
  }
}

function getNotificationBadge(type: string) {
  switch (type) {
    case "session_booking":
    case "session_confirmed":
    case "session_completed":
    case "session_reminder":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">Session</span>;
    case "connection_request":
    case "connection_accepted":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">Connection</span>;
    case "credit_received":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">Wallet</span>;
    case "review_received":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Review</span>;
    case "message":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100">Message</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">System</span>;
  }
}

function formatNotificationTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useApp();

  const [notifications, setNotifications] = useState<NotificationDbRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [newlyArrivedId, setNewlyArrivedId] = useState<string | null>(null);

  // Actions loading
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Send Notification Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [peers, setPeers] = useState<{ id: string; display_name: string; avatar_url: string | null }[]>([]);
  const [targetType, setTargetType] = useState<"self" | "peer">("self");
  const [selectedPeerId, setSelectedPeerId] = useState<string>("");
  const [formType, setFormType] = useState<NotificationType>("session_confirmed");
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");

  // Load notifications from DB
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await notificationService.getUserNotifications(user.id);
      if (res.data) {
        setNotifications(res.data);
      }
    } catch {
      showToast("Failed to fetch notifications.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Load peers for compose target dropdown
  useEffect(() => {
    if (!user?.id) return;
    notificationService.getRecentPeers(user.id).then((res) => {
      if (res.data && res.data.length > 0) {
        setPeers(res.data);
        setSelectedPeerId(res.data[0].id);
      }
    });
  }, [user?.id]);

  // Real-time Supabase subscription
  useEffect(() => {
    if (!user?.id) return;

    setIsRealtimeConnected(true);

    const unsubscribe = notificationService.subscribeToNotifications(user.id, {
      onNewNotification: (newNotif) => {
        playNotificationChime();
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setNewlyArrivedId(newNotif.id);
        setTimeout(() => setNewlyArrivedId(null), 3000);
      },
      onNotificationUpdated: (updNotif) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === updNotif.id ? updNotif : n))
        );
      },
      onNotificationDeleted: (deletedId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
      },
    });

    return () => {
      setIsRealtimeConnected(false);
      unsubscribe();
    };
  }, [user?.id]);

  // Counts
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === "unread" && n.read) return false;
      if (activeTab === "sessions" && !n.type.startsWith("session")) return false;
      if (activeTab === "connections" && !n.type.startsWith("connection")) return false;
      if (activeTab === "credits" && n.type !== "credit_received") return false;
      if (activeTab === "reviews" && n.type !== "review_received") return false;
      if (activeTab === "system" && n.type !== "system" && n.type !== "message") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!user?.id || isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      const res = await notificationService.markAllAsRead(user.id);
      if (res.data) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        showToast("All notifications marked as read.", "success");
      }
    } catch {
      showToast("Failed to mark all as read.", "error");
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!user?.id || isClearingAll || notifications.length === 0) return;
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;

    setIsClearingAll(true);
    try {
      const res = await notificationService.clearAllNotifications(user.id);
      if (res.data) {
        setNotifications([]);
        showToast("All notifications cleared.", "info");
      }
    } catch {
      showToast("Failed to clear notifications.", "error");
    } finally {
      setIsClearingAll(false);
    }
  };

  // Toggle single notification read state
  const handleToggleRead = async (e: React.MouseEvent, notif: NotificationDbRow) => {
    e.stopPropagation();
    try {
      if (!notif.read) {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      }
    } catch {
      // Handled
    }
  };

  // Delete single notification
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Notification deleted.", "info");
    } catch {
      showToast("Failed to delete notification.", "error");
    }
  };

  // Click row to navigate
  const handleRowClick = async (notif: NotificationDbRow) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  // Apply template
  const handleApplyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setFormType(tpl.type);
    setFormTitle(tpl.title);
    setFormMessage(tpl.message);
    setFormLinkUrl(tpl.linkUrl);
  };

  // Send realtime notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!formTitle.trim()) {
      showToast("Please enter a notification title.", "error");
      return;
    }
    if (!formMessage.trim()) {
      showToast("Please enter a notification message.", "error");
      return;
    }

    const recipientId = targetType === "self" ? user.id : selectedPeerId;
    if (!recipientId) {
      showToast("Please select a recipient.", "error");
      return;
    }

    setIsSending(true);
    try {
      const res = await notificationService.createNotification({
        userId: recipientId,
        type: formType,
        title: formTitle.trim(),
        message: formMessage.trim(),
        linkUrl: formLinkUrl.trim() || null,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      showToast(
        targetType === "self"
          ? "Realtime notification sent to yourself!"
          : "Realtime notification delivered to peer!",
        "success"
      );

      // Reset form
      setFormTitle("");
      setFormMessage("");
      setFormLinkUrl("");
      setComposerOpen(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to deliver realtime notification.",
        "error"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Notifications & Realtime Alerts"
        description="Instant updates for session bookings, peer connections, reviews, and platform activity."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Realtime Active</span>
            </div>

            {/* Send Notification Button */}
            <Button
              onClick={() => {
                handleApplyTemplate(PRESET_TEMPLATES[0]);
                setComposerOpen(true);
              }}
              variant="primary"
              size="sm"
              className="group flex items-center gap-1.5 shadow-md shadow-indigo-500/20 font-bold"
            >
              <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              <span>Send Notification</span>
            </Button>
          </div>
        }
      />

      {/* Control Card: Tabs, Search, and Bulk Actions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        {/* Top Row: Search and Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title, message, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                )}
                <span>Mark All Read</span>
              </Button>
            )}

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={isClearingAll}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              >
                {isClearingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>Clear All</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {[
            { id: "all", label: "All", count: notifications.length },
            { id: "unread", label: "Unread", count: unreadCount },
            { id: "sessions", label: "Sessions", count: notifications.filter((n) => n.type.startsWith("session")).length },
            { id: "connections", label: "Connections", count: notifications.filter((n) => n.type.startsWith("connection")).length },
            { id: "credits", label: "Credits", count: notifications.filter((n) => n.type === "credit_received").length },
            { id: "reviews", label: "Reviews", count: notifications.filter((n) => n.type === "review_received").length },
            { id: "system", label: "System", count: notifications.filter((n) => n.type === "system" || n.type === "message").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : tab.id === "unread" && tab.count > 0
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-200/80 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Stream Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Connecting to realtime notifications..." />
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.read;
            const isHighlighted = newlyArrivedId === notif.id;

            return (
              <div
                key={notif.id}
                onClick={() => handleRowClick(notif)}
                className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all duration-300 cursor-pointer group relative ${
                  isHighlighted
                    ? "bg-emerald-50/80 ring-2 ring-emerald-400"
                    : isUnread
                    ? "bg-indigo-50/30 hover:bg-indigo-50/60"
                    : "hover:bg-slate-50/90"
                }`}
              >
                {/* Unread Left Indicator Bar */}
                {isUnread && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r-full" />
                )}

                {/* Category Icon */}
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Content Body */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {getNotificationBadge(notif.type)}
                    <h3
                      className={`text-sm tracking-tight truncate ${
                        isUnread ? "font-bold text-slate-900" : "font-medium text-slate-800"
                      }`}
                    >
                      {notif.title}
                    </h3>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {notif.message}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatNotificationTime(notif.created_at)}
                    </span>

                    {notif.link_url && (
                      <div className="flex items-center gap-1 font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                        <span>View Details</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Row Actions */}
                <div className="flex items-center gap-1 self-start opacity-70 group-hover:opacity-100 transition-opacity">
                  {isUnread && (
                    <button
                      onClick={(e) => handleToggleRead(e, notif)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10">
            <EmptyState
              icon={<Bell className="w-8 h-8 text-indigo-500" />}
              title={
                activeTab === "unread"
                  ? "All caught up!"
                  : searchQuery
                  ? "No matching notifications"
                  : "No notifications yet"
              }
              description={
                activeTab === "unread"
                  ? "You have reviewed all your alerts. New peer requests and session bookings will arrive here in real time."
                  : searchQuery
                  ? `No updates matched "${searchQuery}". Try a different keyword.`
                  : "Your notifications stream is quiet. Send a test notification now to see realtime delivery in action!"
              }
              actionLabel="Send Realtime Notification"
              onAction={() => {
                handleApplyTemplate(PRESET_TEMPLATES[0]);
                setComposerOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Composer Modal: Send Realtime Notification */}
      <Modal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="Send Realtime Notification"
        description="Dispatch an instant notification to test realtime delivery across tabs, browsers, or peers."
        maxWidth="lg"
      >
        <form onSubmit={handleSendNotification} className="space-y-4 pt-1">
          {/* Target Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Deliver Notification To
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("self")}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  targetType === "self"
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Send to Myself</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Test instant live alert in this session
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("peer")}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  targetType === "peer"
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Send to a Peer</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select a connected skill peer
                  </p>
                </div>
              </button>
            </div>

            {targetType === "peer" && (
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Recipient Peer
                </label>
                {peers.length > 0 ? (
                  <select
                    value={selectedPeerId}
                    onChange={(e) => setSelectedPeerId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {peers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} ({p.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No other registered peer profiles found. You can send to yourself to test!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Preset Templates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Template
              </label>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Event Category
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as NotificationType)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="session_confirmed">Session Confirmed (Calendar)</option>
              <option value="session_booking">Session Booking Request</option>
              <option value="session_reminder">Session Reminder (Video)</option>
              <option value="connection_request">Connection Request (User)</option>
              <option value="credit_received">Credit Transfer (Wallet)</option>
              <option value="review_received">Peer Review (Rating)</option>
              <option value="message">Direct Message (Chat)</option>
              <option value="system">System Announcement (Sparkles)</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notification Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Session Confirmed for Tomorrow"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notification Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              maxLength={1000}
              placeholder="Describe the update or session details..."
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Action Link URL (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. /dashboard/sessions or /dashboard/credits"
              value={formLinkUrl}
              onChange={(e) => setFormLinkUrl(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setComposerOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSending}
              className="flex items-center gap-1.5 font-bold shadow-md shadow-indigo-500/20"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Delivering...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Realtime Notification</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
