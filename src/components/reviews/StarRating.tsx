"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showValue?: boolean;
  totalCount?: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  interactive = false,
  onChange,
  size = "md",
  showValue = false,
  totalCount,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  const textSizeClasses = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-xs font-bold",
    lg: "text-sm font-bold",
    xl: "text-base font-extrabold",
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`flex items-center gap-0.5 ${interactive ? "cursor-pointer" : ""}`}
        role={interactive ? "radiogroup" : "img"}
        aria-label={`Rating: ${rating} out of ${maxStars} stars`}
      >
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = currentRating >= starValue;
          const isHalf =
            !interactive &&
            currentRating > starValue - 1 &&
            currentRating < starValue;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`p-0 bg-transparent border-0 outline-none transition-transform ${
                interactive ? "hover:scale-125 focus:scale-125 cursor-pointer" : "cursor-default"
              }`}
              aria-label={`${starValue} star`}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors duration-150 ${
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : isHalf
                    ? "fill-amber-300 text-amber-400"
                    : "fill-slate-100 text-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className={`text-slate-800 ${textSizeClasses[size]}`}>
          {rating > 0 ? rating.toFixed(1) : "New"}
          {typeof totalCount === "number" && totalCount > 0 && (
            <span className="text-slate-400 font-normal ml-1">({totalCount})</span>
          )}
        </span>
      )}
    </div>
  );
};
