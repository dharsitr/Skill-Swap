import React, { useState } from 'react';
import { useCreateReview } from '@/hooks/useReviews';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2, X } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  sessionId: string;
  partnerName: string;
  skillName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  sessionId,
  partnerName,
  skillName,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: createReview, isPending } = useCreateReview();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5.');
      return;
    }

    try {
      await createReview({
        sessionId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit review. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-neutral-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 id="review-modal-title" className="text-lg font-bold text-[#F8F5ED]">
              Rate & Review Session
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {skillName} with {partnerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close review dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Selector */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              How was your experience?
            </label>
            <StarRating
              rating={rating}
              size="lg"
              readOnly={false}
              onChange={(newRating) => setRating(newRating)}
            />
            <span className="text-xs text-amber-400 font-medium">
              {rating === 5 && 'Excellent'}
              {rating === 4 && 'Good'}
              {rating === 3 && 'Average'}
              {rating === 2 && 'Poor'}
              {rating === 1 && 'Very Poor'}
            </span>
          </div>

          {/* Optional Comment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="review-comment" className="text-xs font-semibold text-neutral-300">
                Written Feedback <span className="text-neutral-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-neutral-500">{comment.length}/1000</span>
            </div>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Share what went well, communication, clarity of explanation..."
              className="w-full bg-[#1E293B]/70 border border-slate-700/80 rounded-xl p-3 text-xs text-[#F8F5ED] placeholder-neutral-500 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] resize-none"
            />
          </div>

          {/* Action Buttons */}
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
              className="text-xs font-semibold gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#06131A]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
