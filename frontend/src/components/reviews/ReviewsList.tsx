import React from 'react';
import { StarRating } from './StarRating';
import type { ReviewResponse } from '@/types/api';
import { MessageSquareOff } from 'lucide-react';

interface ReviewsListProps {
  reviews: ReviewResponse[];
  isLoading?: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-[#1E293B]/40 border border-slate-800 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1E293B]" />
              <div className="h-4 bg-[#1E293B] rounded w-24" />
            </div>
            <div className="h-3 bg-[#1E293B]/60 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-[#111827]/40 border border-slate-800/80 space-y-3">
        <MessageSquareOff className="w-8 h-8 text-neutral-600" />
        <p className="text-xs text-neutral-400">No reviews yet.</p>
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const initial = review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : 'S';

        return (
          <div
            key={review.id}
            className="p-4 rounded-xl bg-[#1E293B]/40 border border-slate-800/80 space-y-2.5 transition-colors hover:border-slate-700/90"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {review.reviewerAvatarUrl ? (
                  <img
                    src={review.reviewerAvatarUrl}
                    alt={review.reviewerName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1E293B] border border-slate-700 flex items-center justify-center text-[#10B981] font-bold text-xs">
                    {initial}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-[#F8F5ED]">
                    {review.reviewerName}
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>

              <StarRating rating={review.rating} size="sm" readOnly />
            </div>

            {review.comment && (
              <p className="text-xs text-neutral-300 leading-relaxed pl-10 whitespace-pre-wrap">
                {review.comment}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
