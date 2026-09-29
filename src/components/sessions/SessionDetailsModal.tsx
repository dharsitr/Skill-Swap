"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Loader2,
  BookOpen,
  MessageSquare,
  Video,
  Star,
} from "lucide-react";
import {
  sessionService,
  SessionWithRelations,
} from "@/lib/supabase/services/sessionService";
import { reviewService } from "@/lib/supabase/services/reviewService";
import { ReviewWithProfiles } from "@/types";
import { ReviewModal } from "@/components/reviews";

interface SessionDetailsModalProps {
  session: SessionWithRelations | null;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  currentUserId,
  isOpen,
  onClose,
  onSessionUpdated,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [existingReview, setExistingReview] = useState<ReviewWithProfiles | null>(null);

  // Fetch review if session is completed
  React.useEffect(() => {
    if (isOpen && session && session.status === "completed" && currentUserId) {
      reviewService.getSessionReview(session.id, currentUserId).then((res) => {
        if (res.data) setExistingReview(res.data);
      });
    }
  }, [isOpen, session, currentUserId]);

  if (!isOpen || !session) return null;

  const isTeacher = session.teacher_id === currentUserId;
  const isLearner = session.learner_id === currentUserId;
  const partnerId = isTeacher ? session.learner_id : session.teacher_id;

  const scheduledDate = new Date(session.scheduled_at);
  const formattedDate = scheduledDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pending Approval
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  const handleConfirm = async () => {
    try {
      setLoadingAction("confirm");
      setError(null);
      const res = await sessionService.confirmSession(session.id, currentUserId);
      if (!res.data?.success) {
        setError(res.error || res.data?.message || "Failed to confirm session");
        return;
      }
      onSessionUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    try {
      setLoadingAction("reject");
      setError(null);
      const res = await sessionService.rejectSession(session.id, currentUserId);
      if (!res.data?.success) {
        setError(res.error || res.data?.message || "Failed to decline session");
        return;
      }
      onSessionUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancel = async () => {
    try {
      setLoadingAction("cancel");
      setError(null);
      const res = await sessionService.cancelSession(session.id, currentUserId);
      if (!res.data?.success) {
        setError(res.error || res.data?.message || "Failed to cancel session");
        return;
      }
      setShowCancelConfirm(false);
      onSessionUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleComplete = async () => {
    try {
      setLoadingAction("complete");
      setError(null);
      const res = await sessionService.completeSession(session.id, currentUserId);
      if (!res.data?.success) {
        setError(res.error || res.data?.message || "Failed to complete session");
        return;
      }
      onSessionUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Session Details</h2>
            {getStatusBadge(session.status)}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Skill / Topic Banner */}
          <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Topic / Skill</p>
                <h3 className="text-base font-semibold text-white">
                  {session.skill?.name || "Skill Session"}
                </h3>
              </div>
            </div>
            {session.skill?.category && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                {session.skill.category}
              </span>
            )}
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-3">
            {/* Teacher */}
            <div
              className={`p-3.5 rounded-xl border ${
                isTeacher
                  ? "bg-indigo-500/5 border-indigo-500/30"
                  : "bg-zinc-800/30 border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Teacher
                </span>
                {isTeacher && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {session.teacher?.avatar_url ? (
                  <img
                    src={session.teacher.avatar_url}
                    alt={session.teacher.display_name || "Teacher"}
                    className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.teacher?.display_name || "Teacher"}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    @{session.teacher?.username || "user"}
                  </p>
                </div>
              </div>
            </div>

            {/* Learner */}
            <div
              className={`p-3.5 rounded-xl border ${
                isLearner
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-zinc-800/30 border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Learner
                </span>
                {isLearner && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {session.learner?.avatar_url ? (
                  <img
                    src={session.learner.avatar_url}
                    alt={session.learner.display_name || "Learner"}
                    className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.learner?.display_name || "Learner"}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    @{session.learner?.username || "user"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Economy Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-zinc-800/30 border border-zinc-800/80 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Date</span>
              </div>
              <p className="font-medium text-zinc-200">{formattedDate}</p>
            </div>

            <div className="p-3 bg-zinc-800/30 border border-zinc-800/80 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Time & Duration</span>
              </div>
              <p className="font-medium text-zinc-200">
                {formattedTime} ({session.duration || 30}m)
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-zinc-300">Skill Credit Value</span>
            </div>
            <span className="text-sm font-bold text-amber-400">
              {session.credit_amount || 10} Credits
            </span>
          </div>

          {/* Informational Guidance based on state */}
          {session.status === "pending" && isTeacher && (
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
              <span className="font-semibold">Action required:</span> Please review this session request. Confirming will deduct {session.credit_amount || 10} credits from {session.learner?.display_name || "the learner"} and lock in the scheduled time.
            </div>
          )}

          {session.status === "pending" && isLearner && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              Awaiting confirmation from {session.teacher?.display_name || "the mentor"}. Your {session.credit_amount || 10} credits will only be deducted once the teacher accepts.
            </div>
          )}

          {session.status === "confirmed" && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
              This session is locked in! When you finish meeting, either participant can click <strong>&quot;Mark as Completed&quot;</strong> to release the {session.credit_amount || 10} credits to the teacher.
            </div>
          )}

          {session.status === "completed" && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between gap-3">
              <div>
                This session was marked completed and skill credits have been exchanged.
                {existingReview
                  ? " You have submitted a review for this session."
                  : " Don't forget to leave feedback for your peer!"}
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                {existingReview ? `Rated ${existingReview.rating}★` : "Leave Review"}
              </button>
            </div>
          )}

          {/* Cancel Confirmation Prompt */}
          {showCancelConfirm && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Cancel this session?</p>
                  <p className="text-xs text-zinc-300 mt-1">
                    {session.status === "confirmed"
                      ? `Cancelling will automatically refund ${session.credit_amount || 10} credits back to the learner.`
                      : "This request will be cancelled immediately."}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={!!loadingAction}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Keep Session
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={!!loadingAction}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-1.5"
                >
                  {loadingAction === "cancel" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Yes, Cancel Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
            >
              Close
            </button>
            {partnerId && (
              <Link
                href={`/dashboard/messages?userId=${partnerId}`}
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Teacher Pending Actions */}
            {session.status === "pending" && isTeacher && !showCancelConfirm && (
              <>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!!loadingAction}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-2"
                >
                  {loadingAction === "reject" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!!loadingAction}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  {loadingAction === "confirm" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Session
                </button>
              </>
            )}

            {/* Learner Pending Actions */}
            {session.status === "pending" && isLearner && !showCancelConfirm && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={!!loadingAction}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors flex items-center gap-2"
              >
                {loadingAction === "cancel" && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancel Request
              </button>
            )}

            {/* Confirmed Actions for either participant */}
            {session.status === "confirmed" && !showCancelConfirm && (
              <>
                <Link
                  href={`/dashboard/sessions/${session.id}/room`}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/30"
                >
                  <Video className="w-4 h-4" />
                  Join Room
                </Link>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!!loadingAction}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  {loadingAction === "complete" && <Loader2 className="w-4 h-4 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4" />
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={!!loadingAction}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Completed: Leave or Edit Review */}
            {session.status === "completed" && (
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/20"
              >
                <Star className="w-4 h-4 fill-current" />
                {existingReview ? `Edit Review (${existingReview.rating}★)` : "Leave Review"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {session && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          sessionId={session.id}
          reviewerId={currentUserId}
          revieweeId={partnerId}
          partnerName={
            (isTeacher
              ? session.learner?.display_name
              : session.teacher?.display_name) || "Swap Partner"
          }
          partnerAvatar={
            isTeacher
              ? session.learner?.avatar_url
              : session.teacher?.avatar_url
          }
          sessionTopic={session.skill?.name || "Skill Swap"}
          existingReview={existingReview}
          onReviewSubmitted={() => {
            reviewService.getSessionReview(session.id, currentUserId).then((res) => {
              if (res.data) setExistingReview(res.data);
            });
            onSessionUpdated();
          }}
        />
      )}
    </div>
  );
};
