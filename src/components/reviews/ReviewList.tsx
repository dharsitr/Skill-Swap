"use client";

import React from "react";
import { ReviewWithProfiles } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { EmptyState } from "@/components/ui/states/EmptyState";
import { MessageSquareQuote, Calendar } from "lucide-react";

interface ReviewListProps {
  reviews: ReviewWithProfiles[];
  isLoading?: boolean;
  className?: string;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 animate-pulse flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-200 rounded" />
              <div className="h-10 w-full bg-slate-200 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquareQuote className="h-7 w-7 text-indigo-500" />}
        title="No peer reviews yet"
        description="After completing swap sessions, peer ratings and written testimonials will appear here."
        className="py-8"
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reviews.map((rev) => {
        const reviewerName = rev.reviewer?.displayName || "SkillSwap Peer";
        const reviewerAvatar = rev.reviewer?.avatarUrl || undefined;
        const reviewerHeadline = rev.reviewer?.headline || "Verified Member";

        return (
          <div
            key={rev.id}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={reviewerAvatar}
                  alt={reviewerName}
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {reviewerName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {reviewerHeadline}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <StarRating rating={rev.rating} size="sm" />
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1 font-medium">
                  <Calendar className="w-3 h-3 text-slate-300" />
                  {formatRelativeTime(rev.createdAt)}
                </div>
              </div>
            </div>

            {rev.comment && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                &ldquo;{rev.comment}&rdquo;
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
