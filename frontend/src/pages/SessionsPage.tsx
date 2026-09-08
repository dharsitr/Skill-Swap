import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useSessions,
  useStartSession,
  useCompleteSession,
  useCancelSession,
} from '@/hooks/useSessions';
import { useCurrentProfile } from '@/hooks/useProfile';
import { SessionCard } from '@/components/session/SessionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { SessionStatus } from '@/types/api';

export const SessionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = (searchParams.get('status') as SessionStatus) || undefined;
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = 9;

  const { data: profile } = useCurrentProfile();

  // Confirm cancel dialog
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    sessionId: string;
  }>({
    isOpen: false,
    sessionId: '',
  });

  const { data, isLoading, isError, error } = useSessions({
    status: statusFilter,
    page,
    size,
  });

  const { mutateAsync: startSession, isPending: isStarting } = useStartSession();
  const { mutateAsync: completeSession, isPending: isCompleting } = useCompleteSession();
  const { mutateAsync: cancelSession, isPending: isCancelling } = useCancelSession();

  const handleStatusFilter = (status?: SessionStatus) => {
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

  const handleStart = async (id: string) => {
    try {
      await startSession(id);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeSession(id);
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const handleOpenCancel = (id: string) => {
    setCancelModal({ isOpen: true, sessionId: id });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.sessionId) return;
    try {
      await cancelSession(cancelModal.sessionId);
      setCancelModal({ isOpen: false, sessionId: '' });
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  const sessions = data?.items || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 text-[10px]">
              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              Skill Exchanges
            </Badge>
            <span className="text-xs text-[#94A3B8]">• Session Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] mt-1.5 font-display">
            My Sessions
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Manage your peer teaching and learning sessions, start active sessions, and track completions.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-xs text-[#94A3B8] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#10B981]" /> Status:
          </span>
          <button
            onClick={() => handleStatusFilter(undefined)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !statusFilter
                ? 'bg-[#10B981] text-[#06131A] shadow-sm'
                : 'bg-[#111827] text-[#94A3B8] border border-slate-800 hover:border-slate-700 hover:text-[#F8F5ED]'
            }`}
          >
            All Sessions
          </button>
          {(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as SessionStatus[]).map((st) => {
            const label = st === 'IN_PROGRESS' ? 'In Progress' : st.charAt(0) + st.slice(1).toLowerCase();
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => handleStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#1E293B] text-[#F8F5ED] font-semibold border border-slate-700/60 shadow-sm'
                    : 'bg-[#111827] text-[#94A3B8] border border-slate-800 hover:border-slate-700 hover:text-[#F8F5ED]'
                }`}
              >
                {label}
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
            {error?.message || 'Failed to fetch sessions.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse p-5 space-y-3">
              <div className="h-4 bg-[#1E293B] rounded w-28" />
              <div className="h-16 bg-[#1E293B]/40 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Sessions Grid */}
      {!isLoading && !isError && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              currentUserId={profile?.userId}
              onStart={handleStart}
              onComplete={handleComplete}
              onCancel={handleOpenCancel}
              isProcessing={isStarting || isCompleting || isCancelling}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && sessions.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-slate-700 text-[#10B981] flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F8F5ED]">No sessions found</h3>
            <p className="text-xs text-[#94A3B8]">
              {statusFilter
                ? `You have no ${statusFilter.toLowerCase()} sessions.`
                : 'Accept an incoming exchange proposal or have your request accepted to create a session.'}
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

      {/* Cancel Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#F8F5ED]">Cancel Session?</h3>
            <p className="text-xs text-[#94A3B8]">
              Are you sure you want to cancel this scheduled exchange session? Both participants will be notified.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCancelModal({ isOpen: false, sessionId: '' })}
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
