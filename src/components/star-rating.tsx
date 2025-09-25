import { memo, useMemo } from 'react';
import Star from "../icons/star";

export interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

const StarRating = memo(({ 
  rating, 
  maxStars = 5, 
  size = 'md', 
  showNumber = false,
  className = ""
}: StarRatingProps) => {
  // Memoize calculations for performance
  const normalizedRating = useMemo(() => Math.max(0, Math.min(rating, maxStars)), [rating, maxStars]);
  
  // Size configurations matching the design system
  const sizeConfig = useMemo(() => ({
    sm: { starSize: 14, textSize: 'text-sm', gap: 'gap-1' },
    md: { starSize: 16, textSize: 'text-base', gap: 'gap-1.5' },
    lg: { starSize: 20, textSize: 'text-lg', gap: 'gap-2' }
  }), []);
  
  const config = sizeConfig[size];
  
  // Memoize stars generation for performance
  const stars = useMemo(() => Array.from({ length: maxStars }, (_, index) => {
    const starNumber = index + 1;
    const isFilled = starNumber <= normalizedRating;
    const isPartiallyFilled = starNumber > normalizedRating && starNumber - 1 < normalizedRating;
    
    return (
      <div key={index} className="relative transform transition-all duration-200 hover:scale-110">
        {/* Background star (empty) */}
        <Star
          filled={false}
          size={config.starSize}
          className="text-text-gray-300 transition-colors duration-200"
        />
        
        {/* Filled star overlay with animation */}
        {(isFilled || isPartiallyFilled) && (
          <div 
            className="absolute top-0 left-0 overflow-hidden transition-all duration-300"
            style={{
              width: isPartiallyFilled 
                ? `${((normalizedRating - (starNumber - 1)) * 100)}%`
                : '100%'
            }}
          >
            <Star
              filled={true}
              size={config.starSize}
              className="text-primary-100 transition-colors duration-200"
            />
          </div>
        )}
      </div>
    );
  }), [maxStars, normalizedRating, config]);

  return (
    <div className={`flex items-center ${config.gap} ${className} transform transition-all duration-300`}>
      <div className="flex items-center gap-0.5">
        {stars}
      </div>
      {showNumber && (
        <span className={`${config.textSize} font-medium text-text-gray font-jost ml-1 transition-all duration-300`}>
          {normalizedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
});

export default StarRating;