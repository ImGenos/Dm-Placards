import { useState, memo, useCallback } from 'react';
import StarRating from './star-rating';

export interface Review {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface ReviewCardProps {
  review: Review;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

const ReviewCard = memo(({ 
  review, 
  isExpanded: controlledExpanded,
  onToggleExpand,
  className = ""
}: ReviewCardProps) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggleExpand = useCallback(
    onToggleExpand || (() => setInternalExpanded(!internalExpanded)), 
    [onToggleExpand, internalExpanded]
  );
  
  // Text truncation logic
  const maxLength = 150;
  const shouldTruncate = review.text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? review.text.slice(0, maxLength) + '...'
    : review.text;
  
  // Format the date
  const formatDate = (timeDescription: string) => {
    // Google provides relative time like "2 weeks ago", "a month ago"
    return timeDescription;
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-card border border-text-gray-300 transition-all duration-300 ease-in-out hover:shadow-lg ${className}`}>
      {/* Header with author info and rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Author photo with optimized loading */}
          {review.profile_photo_url ? (
            <img
              src={review.profile_photo_url}
              alt={`Photo de ${review.author_name}`}
              className="w-10 h-10 rounded-full object-cover transition-all duration-300 hover:scale-110"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // Hide image if it fails to load and show fallback
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-white font-semibold font-jost transition-all duration-300 hover:scale-110"
            style={{ display: review.profile_photo_url ? 'none' : 'flex' }}
          >
            {review.author_name.charAt(0).toUpperCase()}
          </div>
          
          {/* Author name and date */}
          <div>
            <h4 className="font-semibold text-text-blue font-jost text-base transition-colors duration-200 hover:text-primary-100">
              {review.author_name}
            </h4>
            <p className="text-sm text-text-gray font-jost">
              {formatDate(review.relative_time_description)}
            </p>
          </div>
        </div>
        
        {/* Rating */}
        <StarRating rating={review.rating} size="sm" />
      </div>
      
      {/* Review text with smooth transitions */}
      <div className="mb-4">
        <p className={`text-text-gray-200 font-jost leading-relaxed transition-all duration-300 ${
          isExpanded ? 'max-h-none' : 'max-h-20 overflow-hidden'
        }`}>
          {displayText}
        </p>
        
        {/* Read more/less button with enhanced mobile touch */}
        {shouldTruncate && (
          <button
            onClick={handleToggleExpand}
            className="mt-2 text-primary-100 hover:text-primary-200 font-medium font-jost text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:ring-opacity-50 rounded px-2 py-1 -mx-2 -my-1 transform hover:scale-105 active:scale-95 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Réduire le commentaire' : 'Lire la suite'}
          >
            <span className="inline-flex items-center gap-1">
              {isExpanded ? 'Réduire' : 'Lire la suite'}
              <svg 
                className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
});

export default ReviewCard;