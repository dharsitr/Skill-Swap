"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states/EmptyState";
import {
  sessionService,
  SessionWithRelations,
} from "@/lib/supabase/services/sessionService";
import { BookingModal } from "@/components/sessions/BookingModal";
import { SessionDetailsModal } from "@/components/sessions/SessionDetailsModal";
import { reviewService } from "@/lib/supabase/services/reviewService";
import { ReviewWithProfiles } from "@/types";
import { ReviewModal } from "@/components/reviews";
import {
  Calendar,
  Clock,
  Plus,
  Coins,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Loader2,
  Sparkles,
  BookOpen,
  Filter,
  Video,
  Star,
} from "lucide-react";

type StatusTab = "upcoming" | "pending" | "completed" | "all";
type RoleFilter = "all" | "teaching" | "learning";

export default function SessionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Sessions state
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusTab, setStatusTab] = useState<StatusTab>("upcoming");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithRelations | null>(null);

  // Reviews state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState<SessionWithRelations | null>(null);
  const [sessionReviews, setSessionReviews] = useState<Record<string, ReviewWithProfiles>>({});

  // Quick Action in progress
  const [quickActionId, setQuickActionId] = useState<string | null>(null);

  // Fetch sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await sessionService.getUserSessions(user.id);
      if (res.error) {
        setError(res.error);
      } else {
        const loadedSessions = res.data || [];
        setSessions(loadedSessions);

        // Fetch existing reviews for completed sessions
        const completed = loadedSessions.filter((s) => s.status === "completed");
        if (completed.length > 0) {
          const revResults = await Promise.all(
            completed.map((s) => reviewService.getSessionReview(s.id, user.id))
          );
          const map: Record<string, ReviewWithProfiles> = {};
          revResults.forEach((r, idx) => {
            if (r.data) {
              map[completed[idx].id] = r.data;
            }
          });
          setSessionReviews(map);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadSessions();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading, loadSessions]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      upcoming: sessions.filter((s) => s.status === "confirmed").length,
      pending: sessions.filter((s) => s.status === "pending").length,
      completed: sessions.filter((s) => s.status === "completed").length,
      all: sessions.length,
    };
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      // Status filter
      if (statusTab === "upcoming" && sess.status !== "confirmed") return false;
      if (statusTab === "pending" && sess.status !== "pending") return false;
      if (statusTab === "completed" && sess.status !== "completed") return false;

      // Role filter
      if (roleFilter === "teaching" && sess.teacher_id !== user?.id) return false;
      if (roleFilter === "learning" && sess.learner_id !== user?.id) return false;

      return true;
    });
  }, [sessions, statusTab, roleFilter, user?.id]);

  // Quick actions
  const handleQuickConfirm = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    if (!user) return;
    setQuickActionId(sessId);
    try {
      const res = await sessionService.confirmSession(sessId, user.id);
      if (res.data?.success) {
        await loadSessions();
      } else {
        alert(res.error || res.data?.message || "Failed to confirm session");
      }
    } finally {
      setQuickActionId(null);
    }
  };

  const handleQuickReject = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    if (!user) return;
    setQuickActionId(sessId);
    try {
      const res = await sessionService.rejectSession(sessId, user.id);
      if (res.data?.success) {
        await loadSessions();
      } else {
        alert(res.error || res.data?.message || "Failed to decline session");
      }
    } finally {
      setQuickActionId(null);
    }
  };

  const handleQuickCancel = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm("Are you sure you want to cancel this session request?")) return;
    setQuickActionId(sessId);
    try {
      const res = await sessionService.cancelSession(sessId, user.id);
      if (res.data?.success) {
        await loadSessions();
      } else {
        alert(res.error || res.data?.message || "Failed to cancel session");
      }
    } finally {
      setQuickActionId(null);
    }
  };

  const handleQuickComplete = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    if (!user) return;
    setQuickActionId(sessId);
    try {
      const res = await sessionService.completeSession(sessId, user.id);
      if (res.data?.success) {
        await loadSessions();
      } else {
        alert(res.error || res.data?.message || "Failed to complete session");
      }
    } finally {
      setQuickActionId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Sessions & Swaps"
        description="Schedule, track, and manage your 1-on-1 skill exchange sessions backed by credits."
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setBookingModalOpen(true)}
            className="font-bold shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Book New Session
          </Button>
        }
      />

      {/* Controls Bar: Status Tabs + Role Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
          {(
            [
              { key: "upcoming", label: "Upcoming" },
              { key: "pending", label: "Pending Requests" },
              { key: "completed", label: "Completed" },
              { key: "all", label: "All Sessions" },
            ] as const
          ).map((tab) => {
            const count = tabCounts[tab.key];
            const isActive = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold px-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          {(["all", "teaching", "learning"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition-all cursor-pointer ${
                roleFilter === role
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {role === "all" ? "All Roles" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadSessions}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="w-40 h-4 bg-slate-200 rounded" />
                  <div className="w-60 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-24 h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((sess) => {
            const isTeacher = sess.teacher_id === user?.id;
            const isLearner = sess.learner_id === user?.id;
            const partner = isTeacher ? sess.learner : sess.teacher;
            const scheduledDate = new Date(sess.scheduled_at);
            const dateStr = scheduledDate.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const timeStr = scheduledDate.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
            const isQuickBusy = quickActionId === sess.id;

            return (
              <Card
                key={sess.id}
                onClick={() => {
                  setSelectedSession(sess);
                  setDetailsModalOpen(true);
                }}
                className="p-5 rounded-2xl border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Partner & Session Info */}
                  <div className="flex items-start sm:items-center gap-4">
                    {partner?.avatar_url ? (
                      <img
                        src={partner.avatar_url}
                        alt={partner.display_name || "Partner"}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {sess.skill?.name || "Skill Swap"}
                        </h4>

                        {/* Role Badge */}
                        <Badge
                          variant={isTeacher ? "indigo" : "secondary"}
                          size="sm"
                          className="font-semibold"
                        >
                          {isTeacher ? "Teaching" : "Learning"}
                        </Badge>

                        {/* Status Badge */}
                        {sess.status === "confirmed" && (
                          <Badge variant="success" size="sm" className="font-semibold">
                            Confirmed
                          </Badge>
                        )}
                        {sess.status === "pending" && (
                          <Badge variant="outline" size="sm" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold">
                            Pending Approval
                          </Badge>
                        )}
                        {sess.status === "completed" && (
                          <Badge variant="default" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                            Completed
                          </Badge>
                        )}
                        {sess.status === "cancelled" && (
                          <Badge variant="default" size="sm" className="bg-slate-100 text-slate-600 font-semibold">
                            Cancelled
                          </Badge>
                        )}
                        {sess.status === "rejected" && (
                          <Badge variant="outline" size="sm" className="bg-rose-50 text-rose-700 border-rose-200 font-semibold">
                            Declined
                          </Badge>
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          with <strong className="text-slate-800">{partner?.display_name || "Partner"}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {timeStr} ({sess.duration || 30}m)
                        </span>
                        <span>•</span>
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {sess.credit_amount || 10} Credits
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Contextual Action Buttons */}
                  <div
                    className="flex items-center gap-2 self-end md:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pending & Current User is Teacher: Quick Accept / Decline */}
                    {sess.status === "pending" && isTeacher && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isQuickBusy}
                          onClick={(e) => handleQuickReject(e, sess.id)}
                          className="text-rose-600 hover:bg-rose-50 border-slate-200 text-xs font-semibold"
                        >
                          {isQuickBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Decline"}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isQuickBusy}
                          onClick={(e) => handleQuickConfirm(e, sess.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                        >
                          {isQuickBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Accept
                        </Button>
                      </>
                    )}

                    {/* Pending & Current User is Learner: Quick Cancel */}
                    {sess.status === "pending" && isLearner && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isQuickBusy}
                        onClick={(e) => handleQuickCancel(e, sess.id)}
                        className="text-slate-600 hover:bg-slate-100 border-slate-200 text-xs font-semibold"
                      >
                        {isQuickBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Cancel Request"}
                      </Button>
                    )}

                    {/* Confirmed: Quick Join Call & Complete */}
                    {sess.status === "confirmed" && (
                      <>
                        <Link
                          href={`/dashboard/sessions/${sess.id}/room`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Call
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isQuickBusy}
                          onClick={(e) => handleQuickComplete(e, sess.id)}
                          className="text-xs font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 flex items-center gap-1"
                        >
                          {isQuickBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          Complete
                        </Button>
                      </>
                    )}

                    {/* Completed: Leave or Edit Review */}
                    {sess.status === "completed" && (
                      <Button
                        variant={sessionReviews[sess.id] ? "outline" : "primary"}
                        size="sm"
                        onClick={() => {
                          setReviewSession(sess);
                          setReviewModalOpen(true);
                        }}
                        className={
                          sessionReviews[sess.id]
                            ? "text-amber-700 bg-amber-50/70 border-amber-200 hover:bg-amber-100/70 text-xs font-semibold flex items-center gap-1"
                            : "bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                        }
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {sessionReviews[sess.id]
                          ? `Rated ${sessionReviews[sess.id].rating}★`
                          : "Leave Review"}
                      </Button>
                    )}

                    {/* Details button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(sess);
                        setDetailsModalOpen(true);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Calendar className="h-8 w-8 text-indigo-500" />}
          title={
            statusTab === "upcoming"
              ? "No upcoming sessions scheduled"
              : statusTab === "pending"
              ? "No pending session requests"
              : statusTab === "completed"
              ? "No completed sessions yet"
              : "No sessions found"
          }
          description={
            statusTab === "upcoming"
              ? "Ready to swap skills? Book a session with a mentor from your discover feed or book one directly."
              : statusTab === "pending"
              ? "You do not have any incoming or outgoing session requests waiting for approval."
              : "Explore our community of mentors and start exchanging skills 1-on-1."
          }
          actionLabel="Book a Session"
          onAction={() => setBookingModalOpen(true)}
          className="p-12 bg-white rounded-3xl border border-slate-200"
        />
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onBookingSuccess={() => {
          loadSessions();
          setStatusTab("pending");
        }}
      />

      {/* Session Details Modal */}
      {selectedSession && user && (
        <SessionDetailsModal
          session={selectedSession}
          currentUserId={user.id}
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedSession(null);
          }}
          onSessionUpdated={() => {
            loadSessions();
          }}
        />
      )}

      {/* Review Modal */}
      {reviewSession && user && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setReviewSession(null);
          }}
          sessionId={reviewSession.id}
          reviewerId={user.id}
          revieweeId={
            reviewSession.teacher_id === user.id
              ? reviewSession.learner_id
              : reviewSession.teacher_id
          }
          partnerName={
            (reviewSession.teacher_id === user.id
              ? reviewSession.learner?.display_name
              : reviewSession.teacher?.display_name) || "Swap Partner"
          }
          partnerAvatar={
            reviewSession.teacher_id === user.id
              ? reviewSession.learner?.avatar_url
              : reviewSession.teacher?.avatar_url
          }
          sessionTopic={reviewSession.skill?.name || "Skill Swap"}
          existingReview={sessionReviews[reviewSession.id] || null}
          onReviewSubmitted={() => {
            loadSessions();
          }}
        />
      )}
    </div>
  );
}
