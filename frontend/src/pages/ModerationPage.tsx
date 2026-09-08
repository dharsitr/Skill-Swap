import React, { useState } from 'react';
import {
  useModerationDisputes,
  useModerationReports,
  useUpdateDisputeStatus,
  useUpdateReportStatus,
} from '@/hooks/useModeration';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  HelpCircle,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type {
  DisputeStatus,
  ModerationDisputeDetailResponse,
  ModerationReportDetailResponse,
  ReportStatus,
} from '@/types/api';

export const ModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'disputes'>('reports');
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | undefined>(undefined);
  const [disputeStatusFilter, setDisputeStatusFilter] = useState<DisputeStatus | undefined>(undefined);

  // Selected item for review
  const [selectedReport, setSelectedReport] = useState<ModerationReportDetailResponse | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<ModerationDisputeDetailResponse | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: reportsPage,
    isLoading: isReportsLoading,
    refetch: refetchReports,
  } = useModerationReports(reportStatusFilter);

  const {
    data: disputesPage,
    isLoading: isDisputesLoading,
    refetch: refetchDisputes,
  } = useModerationDisputes(disputeStatusFilter);

  const { mutateAsync: updateReportStatus, isPending: isUpdatingReport } = useUpdateReportStatus();
  const { mutateAsync: updateDisputeStatus, isPending: isUpdatingDispute } = useUpdateDisputeStatus();

  const handleReportAction = async (status: ReportStatus) => {
    if (!selectedReport) return;
    setActionError(null);
    try {
      const updated = await updateReportStatus({
        id: selectedReport.id,
        request: {
          status,
          moderatorNotes: moderatorNotes.trim() || undefined,
        },
      });
      setSelectedReport(updated);
      setModeratorNotes('');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update report status.');
    }
  };

  const handleDisputeAction = async (status: DisputeStatus) => {
    if (!selectedDispute) return;
    setActionError(null);
    try {
      const updated = await updateDisputeStatus({
        id: selectedDispute.id,
        request: {
          status,
          moderatorNotes: moderatorNotes.trim() || undefined,
        },
      });
      setSelectedDispute(updated);
      setModeratorNotes('');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update dispute status.');
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F8F5ED]">Moderation & Safety Console</h1>
              <p className="text-xs text-[#94A3B8]">Review reported users, session disputes, and maintain platform trust</p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#1E293B]/70 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('reports');
              setSelectedReport(null);
              setSelectedDispute(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'reports'
                ? 'bg-[#10B981] text-[#06131A] shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            User Reports
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('disputes');
              setSelectedReport(null);
              setSelectedDispute(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'disputes'
                ? 'bg-[#10B981] text-[#06131A] shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Session Disputes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-300">Filter Status:</span>
              {activeTab === 'reports' ? (
                <select
                  value={reportStatusFilter || ''}
                  onChange={(e) => setReportStatusFilter((e.target.value as ReportStatus) || undefined)}
                  className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-[#10B981]"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              ) : (
                <select
                  value={disputeStatusFilter || ''}
                  onChange={(e) => setDisputeStatusFilter((e.target.value as DisputeStatus) || undefined)}
                  className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-[#10B981]"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={() => (activeTab === 'reports' ? refetchReports() : refetchDisputes())}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-[#1E293B]"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Reports List */}
          {activeTab === 'reports' && (
            <div className="space-y-2.5">
              {isReportsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                </div>
              ) : !reportsPage?.items?.length ? (
                <div className="p-8 text-center bg-[#111827]/40 border border-slate-800 rounded-2xl text-xs text-neutral-400">
                  No reports found for this filter.
                </div>
              ) : (
                reportsPage.items.map((rep) => {
                  const isSelected = selectedReport?.id === rep.id;
                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => {
                        setSelectedReport(rep);
                        setModeratorNotes(rep.moderatorNotes || '');
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#1E293B] border-[#10B981] shadow-lg'
                          : 'bg-[#111827]/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[#F8F5ED] truncate">
                          {rep.reportedUserName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            rep.status === 'OPEN'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : rep.status === 'UNDER_REVIEW'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : rep.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-red-400 font-medium mb-1">
                        Reason: {rep.reason.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>By {rep.reporterName}</span>
                        <span>{formatDate(rep.createdAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Disputes List */}
          {activeTab === 'disputes' && (
            <div className="space-y-2.5">
              {isDisputesLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                </div>
              ) : !disputesPage?.items?.length ? (
                <div className="p-8 text-center bg-[#111827]/40 border border-slate-800 rounded-2xl text-xs text-neutral-400">
                  No disputes found for this filter.
                </div>
              ) : (
                disputesPage.items.map((disp) => {
                  const isSelected = selectedDispute?.id === disp.id;
                  return (
                    <button
                      key={disp.id}
                      type="button"
                      onClick={() => {
                        setSelectedDispute(disp);
                        setModeratorNotes(disp.moderatorNotes || '');
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#1E293B] border-[#10B981] shadow-lg'
                          : 'bg-[#111827]/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[#F8F5ED] truncate">
                          {disp.skillName || 'Session Dispute'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            disp.status === 'OPEN'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : disp.status === 'UNDER_REVIEW'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : disp.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                          }`}
                        >
                          {disp.status}
                        </span>
                      </div>
                      <p className="text-xs text-amber-400 font-medium mb-1">
                        Reason: {disp.reason.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>By {disp.createdByName}</span>
                        <span>{formatDate(disp.createdAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Detail & Action Column (7 cols) */}
        <div className="lg:col-span-7">
          {activeTab === 'reports' && selectedReport ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#F8F5ED]">Report Details</h3>
                  <p className="text-xs text-[#94A3B8]">Case ID: {selectedReport.id}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    selectedReport.status === 'OPEN'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : selectedReport.status === 'UNDER_REVIEW'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : selectedReport.status === 'RESOLVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                  }`}
                >
                  Status: {selectedReport.status}
                </span>
              </div>

              {actionError && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs">{actionError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-neutral-500">Reported User:</span>
                  <div className="font-semibold text-neutral-200">{selectedReport.reportedUserName}</div>
                </div>
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-neutral-500">Reporter:</span>
                  <div className="font-semibold text-neutral-200">{selectedReport.reporterName}</div>
                </div>
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1 col-span-2">
                  <span className="text-neutral-500">Violation Reason:</span>
                  <div className="font-semibold text-red-400">{selectedReport.reason.replace(/_/g, ' ')}</div>
                </div>
              </div>

              {selectedReport.description && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-neutral-400">Reporter Statement:</span>
                  <p className="p-3.5 bg-[#1E293B]/60 rounded-xl border border-slate-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {/* Moderator Notes & Status Update Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-neutral-300">
                  Moderator Notes & Resolution Summary
                </label>
                <textarea
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Record findings, actions taken, or resolution rationale..."
                  rows={3}
                  className="w-full bg-[#1E293B]/70 border border-slate-700/80 rounded-xl p-3 text-xs text-[#F8F5ED] placeholder-neutral-500 focus:outline-none focus:border-[#10B981] resize-none"
                />

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isUpdatingReport}
                    onClick={() => handleReportAction('UNDER_REVIEW')}
                    className="text-xs gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Mark Under Review
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={isUpdatingReport}
                    onClick={() => handleReportAction('RESOLVED')}
                    className="text-xs gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#06131A]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve Report
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isUpdatingReport}
                    onClick={() => handleReportAction('DISMISSED')}
                    className="text-xs gap-1.5 bg-neutral-700 hover:bg-neutral-600 text-white"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Dismiss Report
                  </Button>
                </div>
              </div>
            </div>
          ) : activeTab === 'disputes' && selectedDispute ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#F8F5ED]">Session Dispute Details</h3>
                  <p className="text-xs text-[#94A3B8]">Dispute ID: {selectedDispute.id}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    selectedDispute.status === 'OPEN'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : selectedDispute.status === 'UNDER_REVIEW'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : selectedDispute.status === 'RESOLVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                  }`}
                >
                  Status: {selectedDispute.status}
                </span>
              </div>

              {actionError && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs">{actionError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-neutral-500">Teacher:</span>
                  <div className="font-semibold text-neutral-200">{selectedDispute.teacherName}</div>
                </div>
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-neutral-500">Learner:</span>
                  <div className="font-semibold text-neutral-200">{selectedDispute.learnerName}</div>
                </div>
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-neutral-500">Skill:</span>
                  <div className="font-semibold text-neutral-200">{selectedDispute.skillName || 'Skill Exchange'}</div>
                </div>
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-neutral-500">Filed By:</span>
                  <div className="font-semibold text-neutral-200">{selectedDispute.createdByName}</div>
                </div>
                <div className="p-3 bg-[#1E293B]/40 rounded-xl border border-slate-800 space-y-1 col-span-2">
                  <span className="text-neutral-500">Dispute Reason:</span>
                  <div className="font-semibold text-amber-400">{selectedDispute.reason.replace(/_/g, ' ')}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-neutral-400">Statement:</span>
                <p className="p-3.5 bg-[#1E293B]/60 rounded-xl border border-slate-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {selectedDispute.description}
                </p>
              </div>

              {/* Moderator Notes & Dispute Resolution Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-neutral-300">
                  Moderator Notes & Settlement Decision
                </label>
                <textarea
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Record resolution notes, credit adjustments, or closing decisions..."
                  rows={3}
                  className="w-full bg-[#1E293B]/70 border border-slate-700/80 rounded-xl p-3 text-xs text-[#F8F5ED] placeholder-neutral-500 focus:outline-none focus:border-[#10B981] resize-none"
                />

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isUpdatingDispute}
                    onClick={() => handleDisputeAction('UNDER_REVIEW')}
                    className="text-xs gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Mark Under Review
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={isUpdatingDispute}
                    onClick={() => handleDisputeAction('RESOLVED')}
                    className="text-xs gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#06131A]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve & Close
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isUpdatingDispute}
                    onClick={() => handleDisputeAction('REJECTED')}
                    className="text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject Dispute
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 text-center bg-[#111827]/30 border border-dashed border-slate-800 rounded-2xl text-xs text-neutral-500">
              <Shield className="w-10 h-10 text-neutral-700 mb-3" />
              Select a {activeTab === 'reports' ? 'report' : 'dispute'} from the list to review details and take moderation action.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
