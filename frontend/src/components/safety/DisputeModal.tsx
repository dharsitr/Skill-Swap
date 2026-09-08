import React, { useState } from 'react';
import { useCreateDispute } from '@/hooks/useSafety';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, HelpCircle, Loader2, X } from 'lucide-react';
import type { DisputeReason } from '@/types/api';

interface DisputeModalProps {
  isOpen: boolean;
  sessionId: string;
  skillName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const DISPUTE_REASONS: { value: DisputeReason; label: string; description: string }[] = [
  { value: 'SESSION_DID_NOT_HAPPEN', label: 'Session Did Not Happen', description: 'The partner did not join or was a no-show' },
  { value: 'SESSION_INCOMPLETE', label: 'Session Incomplete', description: 'Session ended prematurely or was abruptly disconnected' },
  { value: 'INAPPROPRIATE_BEHAVIOR', label: 'Inappropriate Behavior', description: 'Unprofessional or disruptive behavior during call' },
  { value: 'TECHNICAL_ISSUE', label: 'Technical Failure', description: 'Severe audio/video connection failures prevented teaching' },
  { value: 'CREDIT_ISSUE', label: 'Credits / Settlement Issue', description: 'Credit escrow or session balance discrepancy' },
  { value: 'MISCONDUCT', label: 'Academic Misconduct / Fraud', description: 'Cheating or malicious behavior' },
  { value: 'OTHER', label: 'Other Problem', description: 'Other issue not listed above' },
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  sessionId,
  skillName,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<DisputeReason>('SESSION_DID_NOT_HAPPEN');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { mutateAsync: createDispute, isPending } = useCreateDispute();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = description.trim();
    if (!trimmed) {
      setErrorMessage('Please describe the issue you encountered during this session.');
      return;
    }

    try {
      await createDispute({
        sessionId,
        reason,
        description: trimmed,
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to file dispute. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-modal-title"
    >
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-neutral-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="dispute-modal-title" className="text-base font-bold text-[#F8F5ED]">
                Report Session Problem
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Raise a dispute for {skillName} session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close dispute dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-100">Dispute Raised</h3>
            <p className="text-xs text-neutral-400 max-w-xs">
              Your dispute has been sent to our campus moderation team for investigation.
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
                What problem occurred?
              </label>
              <div className="space-y-2">
                {DISPUTE_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      reason === r.value
                        ? 'bg-amber-500/10 border-amber-500/40 text-neutral-100'
                        : 'bg-[#1E293B]/40 border-slate-800 text-neutral-300 hover:bg-[#1E293B]/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dispute-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
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
                <label htmlFor="dispute-description" className="text-xs font-semibold text-neutral-300">
                  Detailed Explanation <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-neutral-500">{description.length}/2000</span>
              </div>
              <textarea
                id="dispute-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                required
                rows={3}
                placeholder="Explain what happened during the session in detail..."
                className="w-full bg-[#1E293B]/70 border border-slate-700/80 rounded-xl p-3 text-xs text-[#F8F5ED] placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
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
                variant="default"
                size="sm"
                disabled={isPending}
                className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Dispute</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
