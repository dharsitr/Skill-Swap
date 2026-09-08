import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number | null;
  maxStars?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  readOnly = false,
  size = 'md',
  onChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const currentVal = hoverRating !== null ? hoverRating : rating || 0;

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={rating ? `${rating} out of ${maxStars} stars` : 'No ratings yet'}
    >
      {Array.from({ length: maxStars }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= currentVal;

        if (readOnly) {
          return (
            <Star
              key={starNumber}
              className={`${starSizes[size]} transition-colors ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-neutral-700'
              }`}
              aria-hidden="true"
            />
          );
        }

        return (
          <button
            key={starNumber}
            type="button"
            role="radio"
            aria-checked={rating === starNumber}
            aria-label={`${starNumber} star${starNumber > 1 ? 's' : ''}`}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded p-0.5 transition-transform hover:scale-110"
            onClick={() => onChange?.(starNumber)}
            onMouseEnter={() => setHoverRating(starNumber)}
            onMouseLeave={() => setHoverRating(null)}
          >
            <Star
              className={`${starSizes[size]} transition-colors ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-neutral-600 hover:text-amber-300'
              }`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
};
