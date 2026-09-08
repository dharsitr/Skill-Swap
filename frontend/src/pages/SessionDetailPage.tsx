import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useSession,
  useStartSession,
  useCompleteSession,
  useCancelSession,
} from '@/hooks/useSessions';
import { useSettleSession } from '@/hooks/useWallet';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useCreateConversation } from '@/hooks/useChat';
import { useSessionReviewStatus } from '@/hooks/useReviews';
import { useSessionDispute } from '@/hooks/useSafety';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { StarRating } from '@/components/reviews/StarRating';
import { DisputeModal } from '@/components/safety/DisputeModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Building,
  Play,
  CheckCircle,
  Ban,
  Clock,
  AlertCircle,
  Coins,
  Check,
  MessageSquare,
  Video,
  Star,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

import type { SessionStatus } from '@/types/api';

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading, isError, error } = useSession(id || '');
  const { data: profile } = useCurrentProfile();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [settlementMessage, setSettlementMessage] = useState<string | null>(null);
  const [settlementError, setSettlementError] = useState<string | null>(null);

  const { data: reviewStatus, refetch: refetchReviewStatus } = useSessionReviewStatus(id || '');
  const { data: disputeData, refetch: refetchDispute } = useSessionDispute(id || '');

  const { mutateAsync: startSession, isPending: isStarting } = useStartSession();
  const { mutateAsync: completeSession, isPending: isCompleting } = useCompleteSession();
  const { mutateAsync: cancelSession, isPending: isCancelling } = useCancelSession();
  const { mutateAsync: settleSession, isPending: isSettling } = useSettleSession();
  const { mutateAsync: createConversation, isPending: isCreatingChat } = useCreateConversation();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#1E293B] rounded w-32" />
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 space-y-4">
          <div className="h-6 bg-[#1E293B] rounded w-1/3" />
          <div className="h-20 bg-[#1E293B]/40 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="space-y-6">
        <Link to="/sessions">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8F5ED]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sessions</span>
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error?.message || 'Session not found or you are not authorized to view it.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentUserId = profile?.userId;
  const isTeacher = currentUserId === session.teacher.id;
  const isLearner = currentUserId === session.learner.id;

  const handleMessagePartner = async () => {
    if (!session) return;
    const partnerId = isTeacher ? session.learner.id : session.teacher.id;
    try {
      const conv = await createConversation(partnerId);
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      console.error('Failed to open chat:', err);
      navigate('/messages');
    }
  };

  const handleStart = async () => {
    try {
      await startSession(session.id);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleComplete = async () => {
    try {
      await completeSession(session.id);
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const handleSettle = async () => {
    setSettlementMessage(null);
    setSettlementError(null);
    try {
      await settleSession(session.id);
      setSettlementMessage('Session credits settled and escrow released successfully!');
    } catch (err: any) {
      setSettlementError(err?.message || 'Failed to settle session credits.');
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelSession(session.id);
      setCancelModalOpen(false);
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <Badge variant="info" className="gap-1 font-semibold text-xs">
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            Scheduled
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="warning" className="gap-1 font-semibold text-xs animate-pulse">
            <Play className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" className="gap-1 font-semibold text-xs">
            <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="gap-1 font-semibold text-xs">
            <Ban className="w-3.5 h-3.5 text-[#94A3B8]" />
            Cancelled
          </Badge>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <div>
        <Link to="/sessions">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8F5ED]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sessions</span>
          </Button>
        </Link>
      </div>

      {/* Main Session Detail Card */}
      <div className="rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.22)] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8]">Session ID: {session.id.slice(0, 8)}...</span>
              {getStatusBadge(session.status)}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8F5ED] font-display">
              {session.skill.name}
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Scheduled for {formatDate(session.scheduledAt || session.createdAt)}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMessagePartner}
              disabled={isCreatingChat}
              className="text-xs gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Message Peer</span>
            </Button>

            {(session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS') && (
              <Link to={`/sessions/${session.id}/call`}>
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs font-semibold gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#06131A] shadow-md"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Video Call</span>
                </Button>
              </Link>
            )}

            {session.status === 'SCHEDULED' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={isCancelling}
                  className="text-xs text-[#94A3B8] hover:text-red-400"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStart}
                  disabled={isStarting}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Session
                </Button>
              </>
            )}

            {session.status === 'IN_PROGRESS' && (
              <Button
                variant="default"
                size="sm"
                onClick={handleComplete}
                disabled={isCompleting}
                className="text-xs font-semibold gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Complete Session
              </Button>
            )}
          </div>
        </div>

        {/* Settlement notifications */}
        {settlementMessage && (
          <Alert variant="success">
            <Check className="w-4 h-4" />
            <AlertDescription className="text-xs">{settlementMessage}</AlertDescription>
          </Alert>
        )}

        {settlementError && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs">{settlementError}</AlertDescription>
          </Alert>
        )}

        {/* Participants Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Teacher */}
          <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider">
              Student Teacher
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#10B981] font-bold text-sm">
                {session.teacher.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#F8F5ED] flex items-center gap-1.5">
                  {session.teacher.displayName}
                  {isTeacher && <Badge variant="default" className="text-[9px] py-0">You</Badge>}
                </h3>
                <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                  <Building className="w-3 h-3 text-[#10B981]" />
                  {session.teacher.collegeName}
                </p>
              </div>
            </div>
          </div>

          {/* Learner */}
          <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-wider">
              Student Learner
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#38BDF8] font-bold text-sm">
                {session.learner.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#F8F5ED] flex items-center gap-1.5">
                  {session.learner.displayName}
                  {isLearner && <Badge variant="info" className="text-[9px] py-0">You</Badge>}
                </h3>
                <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                  <Building className="w-3 h-3 text-[#38BDF8]" />
                  {session.learner.collegeName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 6 Credit Settlement Card */}
        <div className="p-5 rounded-xl bg-[#1E293B]/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8F5ED]">Skill Credit Escrow</h3>
              <p className="text-xs text-[#94A3B8]">
                1 Credit is held in safe escrow and awarded to the teacher upon verified session completion.
              </p>
            </div>
          </div>

          {session.status === 'COMPLETED' && isTeacher && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSettle}
              disabled={isSettling}
              className="text-xs font-semibold gap-1.5 shrink-0"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Claim Credit</span>
            </Button>
          )}
        </div>

        {/* Phase 10 Reviews & Ratings Section */}
        {session.status === 'COMPLETED' && (
          <div className="p-5 rounded-xl bg-[#1E293B]/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F8F5ED]">Session Rating & Review</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Rate your learning or teaching partner to build campus trust and reputation.
                  </p>
                </div>
              </div>

              {reviewStatus?.hasReviewed ? (
                <div className="text-right">
                  <Badge variant="success" className="text-xs gap-1">
                    <Check className="w-3 h-3" /> Reviewed
                  </Badge>
                </div>
              ) : reviewStatus?.eligible ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setReviewModalOpen(true)}
                  className="text-xs font-semibold gap-1.5 shrink-0 bg-amber-500 hover:bg-amber-600 text-neutral-950"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Rate & Review</span>
                </Button>
              ) : null}
            </div>

            {reviewStatus?.hasReviewed && reviewStatus.review && (
              <div className="mt-3 p-3.5 rounded-lg bg-[#111827]/80 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-300">Your Submitted Feedback</span>
                  <StarRating rating={reviewStatus.review.rating} size="sm" readOnly />
                </div>
                {reviewStatus.review.comment && (
                  <p className="text-neutral-400 italic">"{reviewStatus.review.comment}"</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phase 10 Safety & Dispute Actions */}
        <div className="p-4 rounded-xl bg-[#111827]/60 border border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-neutral-400">
            <ShieldAlert className="w-4 h-4 text-neutral-500" />
            <span>Need assistance or encountered an issue with this exchange?</span>
          </div>

          {disputeData ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-400 font-medium">
                Dispute Status: {disputeData.status}
              </span>
              <Badge variant="warning" className="text-[10px]">Case Active</Badge>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisputeModalOpen(true)}
              className="text-xs gap-1.5 border-slate-700 text-neutral-400 hover:text-neutral-200"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Report a Problem</span>
            </Button>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {session && (
        <ReviewModal
          isOpen={reviewModalOpen}
          sessionId={session.id}
          partnerName={isTeacher ? session.learner.displayName : session.teacher.displayName}
          skillName={session.skill.name}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => refetchReviewStatus()}
        />
      )}

      {/* Dispute Modal */}
      {session && (
        <DisputeModal
          isOpen={disputeModalOpen}
          sessionId={session.id}
          skillName={session.skill.name}
          onClose={() => setDisputeModalOpen(false)}
          onSuccess={() => refetchDispute()}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#F8F5ED]">Cancel Session?</h3>
            <p className="text-xs text-[#94A3B8]">
              Are you sure you want to cancel this scheduled exchange session?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                className="text-xs"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                className="text-xs font-semibold"
              >
                Cancel Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
