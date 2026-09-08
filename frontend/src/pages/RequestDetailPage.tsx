import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useExchangeRequest,
  useAcceptExchangeRequest,
  useRejectExchangeRequest,
  useCancelExchangeRequest,
} from '@/hooks/useExchangeRequests';
import { useCurrentProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Building,
  Clock,
  Check,
  X,
  Ban,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { ExchangeRequestStatus } from '@/types/api';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: request, isLoading, isError, error } = useExchangeRequest(id || '');
  const { data: profile } = useCurrentProfile();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'reject' | 'cancel';
  }>({
    isOpen: false,
    type: 'reject',
  });

  const { mutateAsync: acceptRequest, isPending: isAccepting } = useAcceptExchangeRequest();
  const { mutateAsync: rejectRequest, isPending: isRejecting } = useRejectExchangeRequest();
  const { mutateAsync: cancelRequest, isPending: isCancelling } = useCancelExchangeRequest();

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

  if (isError || !request) {
    return (
      <div className="space-y-6">
        <Link to="/requests">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8F5ED]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Requests</span>
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error?.message || 'Exchange request not found or you are not authorized to view it.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentUserId = profile?.userId;
  const isRequester = currentUserId === request.requester.id;
  const isRecipient = currentUserId === request.recipient.id;

  const handleAccept = async () => {
    try {
      await acceptRequest(request.id);
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmDialog.type === 'reject') {
        await rejectRequest(request.id);
      } else {
        await cancelRequest(request.id);
      }
      setConfirmDialog({ isOpen: false, type: 'reject' });
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const getStatusBadge = (status: ExchangeRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" className="gap-1 font-semibold text-xs">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            Pending Review
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="success" className="gap-1 font-semibold text-xs">
            <Check className="w-3.5 h-3.5 text-[#10B981]" />
            Accepted
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1 font-semibold text-xs">
            <X className="w-3.5 h-3.5 text-red-400" />
            Declined
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
        <Link to="/requests">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8F5ED]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Requests</span>
          </Button>
        </Link>
      </div>

      {/* Main Request Detail Header Card */}
      <div className="rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.22)] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8]">Request ID: {request.id.slice(0, 8)}...</span>
              {getStatusBadge(request.status)}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8F5ED] font-display">
              Skill Exchange Proposal
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Created on {formatDate(request.createdAt)}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isRecipient && request.status === 'PENDING' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDialog({ isOpen: true, type: 'reject' })}
                  disabled={isAccepting || isRejecting}
                  className="text-xs text-[#94A3B8] hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Decline
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAccept}
                  disabled={isAccepting || isRejecting}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept Exchange
                </Button>
              </>
            )}

            {isRequester && request.status === 'PENDING' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDialog({ isOpen: true, type: 'cancel' })}
                disabled={isCancelling}
                className="text-xs text-[#94A3B8] hover:text-red-400"
              >
                <Ban className="w-3.5 h-3.5 mr-1" />
                Cancel Request
              </Button>
            )}
          </div>
        </div>

        {/* Participants Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Requester (Learner) */}
          <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-wider">
              Student Seeking Learning (Requester)
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#38BDF8] font-bold text-sm">
                  {request.requester.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#F8F5ED] flex items-center gap-1.5">
                    {request.requester.displayName}
                    {isRequester && <Badge variant="outline" className="text-[9px] py-0">You</Badge>}
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#10B981]" />
                    {request.requester.collegeName}
                  </p>
                </div>
              </div>
              <Link to={`/users/${request.requester.id}`} className="text-[#94A3B8] hover:text-[#F8F5ED]">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Recipient (Teacher) */}
          <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider">
              Teacher (Recipient)
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#10B981] font-bold text-sm">
                  {request.recipient.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#F8F5ED] flex items-center gap-1.5">
                    {request.recipient.displayName}
                    {isRecipient && <Badge variant="outline" className="text-[9px] py-0">You</Badge>}
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#10B981]" />
                    {request.recipient.collegeName}
                  </p>
                </div>
              </div>
              <Link to={`/users/${request.recipient.id}`} className="text-[#94A3B8] hover:text-[#F8F5ED]">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Target Skill Information */}
        <div className="p-5 rounded-xl bg-[#1E293B]/50 border border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider">
            Exchange Topic / Subject
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#F8F5ED]">{request.skill.name}</h2>
              {request.skill.categoryName && (
                <p className="text-xs text-[#94A3B8]">{request.skill.categoryName}</p>
              )}
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1E293B] border border-slate-700 text-[#CBD5E1] self-start sm:self-auto">
              Level: {request.skill.proficiency}
            </span>
          </div>
        </div>

        {/* Message */}
        {request.message && (
          <div className="p-4 rounded-xl bg-[#1E293B]/40 border border-slate-800 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">
              Introductory Note
            </span>
            <p className="text-xs sm:text-sm text-[#CBD5E1] italic leading-relaxed">
              &ldquo;{request.message}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#F8F5ED]">
              {confirmDialog.type === 'reject' ? 'Decline Proposal?' : 'Cancel Request?'}
            </h3>
            <p className="text-xs text-[#94A3B8]">
              {confirmDialog.type === 'reject'
                ? 'Are you sure you want to decline this exchange request?'
                : 'Are you sure you want to cancel this request?'}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDialog({ isOpen: false, type: 'reject' })}
                className="text-xs"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmAction}
                className="text-xs font-semibold"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
