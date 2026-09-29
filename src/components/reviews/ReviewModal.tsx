"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { reviewService } from "@/lib/supabase/services/reviewService";
import { ReviewWithProfiles } from "@/types";
import {
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Trash2,
  GraduationCap,
} from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  partnerName: string;
  partnerAvatar?: string | null;
  sessionTopic?: string;
  existingReview?: ReviewWithProfiles | null;
  onReviewSubmitted: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Poor — Did not meet expectations",
  2: "Fair — Needed improvement",
  3: "Good — Helpful swap session",
  4: "Very Good — Great experience and knowledge sharing",
  5: "Outstanding! — Exceptional mentor and highly insightful",
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  reviewerId,
  revieweeId,
  partnerName,
  partnerAvatar,
  sessionTopic,
  existingReview,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [comment, setComment] = useState<string>(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state if existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else {
      setRating(5);
      setComment("");
    }
    setError(null);
    setSuccessMessage(null);
  }, [existingReview, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (comment.length > 1000) {
      setError("Your review cannot exceed 1000 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (existingReview) {
        // Update review
        const res = await reviewService.updateReview(
          {
            reviewId: existingReview.id,
            rating,
            comment,
          },
          reviewerId
        );

        if (res.error) {
          setError(res.error);
          return;
        }

        setSuccessMessage("Your review has been updated!");
      } else {
        // Create new review
        const res = await reviewService.createReview({
          sessionId,
          reviewerId,
          revieweeId,
          rating,
          comment,
        });

        if (res.error) {
          setError(res.error);
          return;
        }

        setSuccessMessage("Thank you! Your review was submitted successfully.");
      }

      setTimeout(() => {
        onReviewSubmitted();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    if (!confirm("Are you sure you want to delete your review?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await reviewService.deleteReview(existingReview.id, reviewerId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccessMessage("Your review was deleted.");
      setTimeout(() => {
        onReviewSubmitted();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingReview ? "Edit Session Review" : "Leave Session Review"}
      description={`Share your feedback for your completed swap with ${partnerName}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {/* Partner / Session Banner */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={partnerAvatar || undefined}
              alt={partnerName}
              size="md"
              className="shrink-0"
            />
            <div className="min-w-0 text-xs">
              <span className="font-bold text-slate-900 block truncate">
                {partnerName}
              </span>
              {sessionTopic && (
                <span className="text-indigo-700 font-semibold truncate flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {sessionTopic}
                </span>
              )}
            </div>
          </div>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-100 shadow-2xs">
            Completed Swap
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Star Rating Selector */}
        <div className="space-y-2 text-center py-2 bg-slate-50/70 rounded-2xl border border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Rate Your Experience
          </label>

          <div className="flex justify-center">
            <StarRating
              rating={rating}
              size="xl"
              interactive={true}
              onChange={setRating}
            />
          </div>

          <p className="text-xs font-semibold text-indigo-600 min-h-[18px]">
            {RATING_DESCRIPTIONS[rating] || "Select 1 to 5 stars"}
          </p>
        </div>

        {/* 2. Written Review Feedback */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <label htmlFor="review-comment" className="uppercase tracking-wider">
              Written Testimonial (Optional)
            </label>
            <span
              className={`text-[11px] font-normal ${
                comment.length > 900 ? "text-amber-600 font-semibold" : "text-slate-400"
              }`}
            >
              {comment.length} / 1000
            </span>
          </div>

          <textarea
            id="review-comment"
            rows={4}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`What did you learn? How was ${partnerName}'s communication and mentorship?`}
            className="w-full p-3.5 text-xs text-slate-800 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2">
          {existingReview ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || isDeleting}
              onClick={handleDelete}
              className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs font-semibold flex items-center gap-1"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting || isDeleting}
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isDeleting}
              className="font-bold text-xs shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  {existingReview ? "Update Review" : "Submit Review"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
