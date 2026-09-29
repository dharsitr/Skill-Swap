"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  notificationService,
  NotificationType,
} from "@/lib/supabase/services/notificationService";
import { NotificationDbRow } from "@/types/database.types";
import {
  Bell,
  CheckCircle2,
  Calendar,
  Clock,
  Coins,
  UserPlus,
  Video,
  X,
  Trash2,
  Check,
  CheckCheck,
  Loader2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Star,
} from "lucide-react";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onUnreadCountChange?: (count: number) => void;
}

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

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onUnreadCountChange,
}) => {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationDbRow[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Sync unread count to parent
  useEffect(() => {
    if (onUnreadCountChange) {
      const unread = notifications.filter((n) => !n.read).length;
      onUnreadCountChange(unread);
    }
  }, [notifications, onUnreadCountChange]);

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      const res = await notificationService.getUserNotifications(currentUserId);
      if (res.data) {
        setNotifications(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadNotifications();
    }
  }, [isOpen, currentUserId, loadNotifications]);

  // Subscribe to real-time notification changes
  useEffect(() => {
    if (!currentUserId || !isOpen) return;

    const unsubscribe = notificationService.subscribeToNotifications(currentUserId, {
      onNewNotification: (newNotif) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      },
      onNotificationUpdated: (updNotif) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === updNotif.id ? updNotif : n))
        );
      },
    });

    return () => unsubscribe();
  }, [currentUserId, isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!currentUserId || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await notificationService.markAllAsRead(currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Handled
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Mark single as read
  const handleMarkSingleRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Delete notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Click notification to navigate
  const handleNotificationClick = async (notif: NotificationDbRow) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    onClose();
    if (notif.link_url) {
      router.push(notif.link_url);
    } else {
      router.push("/dashboard/sessions");
    }
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.read : true
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              <p className="text-[11px] text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "All caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "unread"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-3 bg-slate-200 rounded" />
                    <div className="w-48 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                    isUnread ? "bg-indigo-50/40 hover:bg-indigo-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs truncate ${
                          isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatNotificationTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Action pill if link exists */}
                    {notif.link_url && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 group-hover:underline">
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Quick Row Actions */}
                  <div className="flex items-center gap-1 self-start opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkSingleRead(e, notif.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(e, notif.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                  You&apos;ll be notified when peers book sessions or accept swap proposals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
