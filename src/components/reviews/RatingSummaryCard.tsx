"use client";

import React from "react";
import { RatingSummary } from "@/types";
import { StarRating } from "./StarRating";
import { Star, Award } from "lucide-react";

interface RatingSummaryCardProps {
  summary: RatingSummary;
  className?: string;
}

export const RatingSummaryCard: React.FC<RatingSummaryCardProps> = ({
  summary,
  className = "",
}) => {
  const { averageRating, totalReviews, distribution } = summary;

  return (
    <div
      className={`p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left: Overall Rating Hero */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center justify-center p-4 min-w-[100px] rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {totalReviews > 0 ? averageRating.toFixed(1) : "—"}
            </span>
            <div className="mt-1">
              <StarRating rating={averageRating} size="sm" />
            </div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mt-1.5">
              {totalReviews > 0 ? "Rating Score" : "New Peer"}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-600" />
              Community Reputation
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              {totalReviews > 0
                ? `Calculated from ${totalReviews} verified post-session peer review${
                    totalReviews === 1 ? "" : "s"
                  }.`
                : "Complete 1-on-1 swap sessions to receive ratings and build your reputation."}
            </p>
          </div>
        </div>

        {/* Right: 5-Star Distribution Bars */}
        <div className="flex-1 max-w-sm space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-slate-500 font-semibold flex items-center justify-end gap-1">
                  {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </span>

                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-8 text-[11px] text-slate-400 text-right font-medium">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
