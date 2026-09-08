import React, { useState } from 'react';
import { useCreateReport } from '@/hooks/useSafety';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2, ShieldAlert, X } from 'lucide-react';
import type { ReportReason } from '@/types/api';

interface ReportModalProps {
  isOpen: boolean;
  reportedUserId: string;
  reportedUserName: string;
  sessionId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment', description: 'Bullying, threats, or unwanted repeated contact' },
  { value: 'INAPPROPRIATE_BEHAVIOR', label: 'Inappropriate Behavior', description: 'Unprofessional or offensive behavior during exchange' },
  { value: 'SPAM', label: 'Spam', description: 'Commercial solicitations, automated messages, or repetitive junk' },
  { value: 'FRAUD', label: 'Fraud / Scam', description: 'Deceptive behavior or attempting to steal credits/account access' },
  { value: 'ABUSE', label: 'Abuse', description: 'Abusive language or mistreatment of peer students' },
  { value: 'OFFENSIVE_CONTENT', label: 'Offensive Content', description: 'Hate speech, obscenity, or inappropriate profile content' },
  { value: 'SAFETY_CONCERN', label: 'Safety Concern', description: 'Immediate threat to campus safety or user well-being' },
  { value: 'OTHER', label: 'Other', description: 'Other safety issues not listed above' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  reportedUserId,
  reportedUserName,
  sessionId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE_BEHAVIOR');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { mutateAsync: createReport, isPending } = useCreateReport();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await createReport({
        reportedUserId,
        sessionId,
        reason,
        description: description.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-neutral-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-base font-bold text-[#F8F5ED]">
                Report {reportedUserName}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Confidential report submitted to campus moderators
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close report dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-100">Report Submitted</h3>
            <p className="text-xs text-neutral-400 max-w-xs">
              Thank you for keeping SkillSwap safe. Our moderation team will review this report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">
                Why are you reporting this user?
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      reason === r.value
                        ? 'bg-red-500/10 border-red-500/40 text-neutral-100'
                        : 'bg-[#1E293B]/40 border-slate-800 text-neutral-300 hover:bg-[#1E293B]/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 text-red-500 focus:ring-red-500"
                    />
                    <div className="text-left">
                      <div className="text-xs font-semibold">{r.label}</div>
                      <div className="text-[11px] text-neutral-400">{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="report-description" className="text-xs font-semibold text-neutral-300">
                  Additional Details <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-neutral-500">{description.length}/2000</span>
              </div>
              <textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Provide any relevant context, time of incident, or message details..."
                className="w-full bg-[#1E293B]/70 border border-slate-700/80 rounded-xl p-3 text-xs text-[#F8F5ED] placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isPending}
                className="text-xs font-semibold gap-1.5 bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
