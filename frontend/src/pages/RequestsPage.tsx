import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useIncomingRequests,
  useOutgoingRequests,
  useAcceptExchangeRequest,
  useRejectExchangeRequest,
  useCancelExchangeRequest,
} from '@/hooks/useExchangeRequests';
import { ExchangeRequestCard } from '@/components/exchange/ExchangeRequestCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Inbox,
  Send,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { ExchangeRequestStatus } from '@/types/api';

export const RequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'incoming' | 'outgoing') || 'incoming';
  const statusFilter = (searchParams.get('status') as ExchangeRequestStatus) || undefined;
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = 9;

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'reject' | 'cancel';
    requestId: string;
  }>({
    isOpen: false,
    type: 'reject',
    requestId: '',
  });

  const {
    data: incomingData,
    isLoading: incomingLoading,
    isError: incomingError,
    error: incomingErr,
  } = useIncomingRequests({
    status: statusFilter,
    page,
    size,
  });

  const {
    data: outgoingData,
    isLoading: outgoingLoading,
    isError: outgoingError,
    error: outgoingErr,
  } = useOutgoingRequests({
    status: statusFilter,
    page,
    size,
  });

  const { mutateAsync: acceptRequest, isPending: isAccepting } = useAcceptExchangeRequest();
  const { mutateAsync: rejectRequest, isPending: isRejecting } = useRejectExchangeRequest();
  const { mutateAsync: cancelRequest, isPending: isCancelling } = useCancelExchangeRequest();

  const handleTabChange = (tab: 'incoming' | 'outgoing') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.set('page', '0');
      return next;
    });
  };

  const handleStatusFilter = (status?: ExchangeRequestStatus) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (status) {
        next.set('status', status);
      } else {
        next.delete('status');
      }
      next.set('page', '0');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptRequest(id);
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleOpenReject = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'reject',
      requestId: id,
    });
  };

  const handleOpenCancel = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'cancel',
      requestId: id,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.requestId) return;

    try {
      if (confirmDialog.type === 'reject') {
        await rejectRequest(confirmDialog.requestId);
      } else {
        await cancelRequest(confirmDialog.requestId);
      }
      setConfirmDialog({ isOpen: false, type: 'reject', requestId: '' });
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const currentData = activeTab === 'incoming' ? incomingData : outgoingData;
  const isLoading = activeTab === 'incoming' ? incomingLoading : outgoingLoading;
  const isError = activeTab === 'incoming' ? incomingError : outgoingError;
  const currentError = activeTab === 'incoming' ? incomingErr : outgoingErr;

  const requests = currentData?.items || [];
  const totalPages = currentData?.totalPages || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 text-[10px]">
              <Inbox className="w-3.5 h-3.5 text-[#10B981]" />
              Skill Exchanges
            </Badge>
            <span className="text-xs text-[#94A3B8]">• Proposals & Offers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] mt-1.5 font-display">
            Exchange Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Review incoming proposals from peers or track outgoing requests you sent to other students.
          </p>
        </div>
      </div>

      {/* Tabs & Status Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Main Direction Tabs: Incoming / Outgoing */}
        <div className="inline-flex p-1 rounded-xl bg-[#111827] border border-slate-800 self-start">
          <button
            onClick={() => handleTabChange('incoming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'incoming'
                ? 'bg-[#10B981] text-[#06131A] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Incoming Offers</span>
            {incomingData && incomingData.totalElements > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#06131A] text-white">
                {incomingData.totalElements}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('outgoing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'outgoing'
                ? 'bg-[#10B981] text-[#06131A] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sent by Me</span>
            {outgoingData && outgoingData.totalElements > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#06131A] text-white">
                {outgoingData.totalElements}
              </span>
            )}
          </button>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#94A3B8] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-[#10B981]" />
            Status:
          </span>

          {[
            { label: 'All', value: undefined },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Accepted', value: 'ACCEPTED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ].map((item) => {
            const isSelected = statusFilter === item.value;
            return (
              <button
                key={item.label}
                onClick={() => handleStatusFilter(item.value as ExchangeRequestStatus | undefined)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#1E293B] text-[#F8F5ED] font-semibold border border-slate-700/60 shadow-sm'
                    : 'bg-[#111827] text-[#94A3B8] hover:text-[#F8F5ED] hover:bg-[#1E293B] border border-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-xs">
            {currentError?.message || 'Failed to fetch exchange requests.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#1E293B]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-[#1E293B] rounded w-28" />
                  <div className="h-3 bg-[#1E293B]/60 rounded w-36" />
                </div>
              </div>
              <div className="h-16 bg-[#1E293B]/40 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Requests Grid */}
      {!isLoading && !isError && requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <ExchangeRequestCard
              key={request.id}
              request={request}
              type={activeTab}
              onAccept={handleAccept}
              onReject={handleOpenReject}
              onCancel={handleOpenCancel}
              isProcessing={isAccepting || isRejecting || isCancelling}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && requests.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-slate-700 text-[#10B981] flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F8F5ED]">No {activeTab} requests found</h3>
            <p className="text-xs text-[#94A3B8]">
              {statusFilter
                ? `There are no ${statusFilter.toLowerCase()} requests in this view.`
                : activeTab === 'incoming'
                ? 'When student peers propose skill exchanges with you, they will appear here.'
                : 'Explore discovery candidates and propose your first skill exchange.'}
            </p>
          </div>
          {statusFilter && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusFilter(undefined)}
              className="text-xs"
            >
              Clear Filter
            </Button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-[#94A3B8]">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => handlePageChange(page - 1)}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => handlePageChange(page + 1)}
              className="h-8 text-xs gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F8F5ED]">
                {confirmDialog.type === 'reject' ? 'Decline Exchange Request?' : 'Cancel Exchange Request?'}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {confirmDialog.type === 'reject'
                  ? 'Are you sure you want to decline this skill exchange proposal? The requester will be notified.'
                  : 'Are you sure you want to cancel this outgoing request?'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDialog({ isOpen: false, type: 'reject', requestId: '' })}
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
                {confirmDialog.type === 'reject' ? 'Decline Proposal' : 'Cancel Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
