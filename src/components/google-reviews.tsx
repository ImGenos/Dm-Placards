import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { PlaceDetails } from '../utils/google-places-api';
import { googlePlacesService } from '../utils/google-places-api';
import { getDefaultPlaceId } from '../utils/config';
import { performanceMonitor } from '../utils/performance-monitor';
import { 
  createGooglePlacesError, 
  getUserFriendlyErrorMessage, 
  isOnline
} from '../utils/error-handling';
import StarRating from './star-rating';

// Lazy load ReviewCard for better performance
const ReviewCard = lazy(() => import('./review-card'));

export interface GoogleReviewsProps {
  placeId?: string;
  maxReviews?: number;
  className?: string;
  showOverallRating?: boolean;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
  isRetrying: boolean;
  retryCount: number;
  isOffline: boolean;
}

const GoogleReviews = ({ 
  placeId,
  maxReviews = 6,
  className = "",
  showOverallRating = true
}: GoogleReviewsProps) => {
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    hasData: false,
    isRetrying: false,
    retryCount: 0,
    isOffline: false
  });

  // Use provided placeId or fall back to default from config
  const effectivePlaceId = placeId || getDefaultPlaceId();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setLoadingState(prev => ({ ...prev, isOffline: false }));
      // Retry fetching if we were offline and have no data
      if (!placeDetails) {
        fetchReviews();
      }
    };

    const handleOffline = () => {
      setLoadingState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [placeDetails]);

  // Enhanced fetch function with retry logic
  const fetchReviews = useCallback(async (isRetry: boolean = false) => {
    if (!effectivePlaceId) {
      setLoadingState({
        isLoading: false,
        error: 'Configuration manquante pour les avis Google',
        hasData: false,
        isRetrying: false,
        retryCount: 0,
        isOffline: !isOnline()
      });
      return;
    }

    try {
      setLoadingState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        isRetrying: isRetry,
        retryCount: isRetry ? prev.retryCount + 1 : 0,
        isOffline: !isOnline()
      }));
      
      // Start performance monitoring
      performanceMonitor.start('google-reviews-fetch', { 
        placeId: effectivePlaceId,
        maxReviews,
        isRetry,
        retryCount: isRetry ? loadingState.retryCount + 1 : 0
      });
      
      // Check if we should refresh cache in background
      const shouldRefresh = googlePlacesService.shouldRefreshCache(effectivePlaceId);
      
      const details = await googlePlacesService.getPlaceDetails(effectivePlaceId);
      
      // End performance monitoring
      performanceMonitor.end('google-reviews-fetch', {
        reviewsCount: details.reviews.length,
        cacheRefreshNeeded: shouldRefresh,
        success: true
      });
      
      setPlaceDetails(details);
      setLoadingState({
        isLoading: false,
        error: null,
        hasData: true,
        isRetrying: false,
        retryCount: 0,
        isOffline: false
      });

      // Log performance stats in development
      if (import.meta.env.DEV) {
        const stats = googlePlacesService.getPerformanceStats();
        console.debug('Google Reviews Performance Stats:', stats);
        
        const cacheInfo = googlePlacesService.getCacheInfo();
        console.debug('Cache Info:', cacheInfo);
        
        const perfStats = performanceMonitor.getStats();
        console.debug('Component Performance Stats:', perfStats);
      }

      // If cache needs refresh and we got cached data, refresh in background
      if (shouldRefresh && details) {
        console.debug('Refreshing cache in background');
        performanceMonitor.start('background-cache-refresh', { placeId: effectivePlaceId });
        googlePlacesService.getPlaceDetails(effectivePlaceId)
          .then(() => {
            performanceMonitor.end('background-cache-refresh', { success: true });
          })
          .catch(error => {
            performanceMonitor.end('background-cache-refresh', { success: false, error: error.message });
            console.warn('Background cache refresh failed:', error);
          });
      }
    } catch (error) {
      // End performance monitoring with error
      performanceMonitor.end('google-reviews-fetch', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: isRetry ? loadingState.retryCount + 1 : 0
      });
      
      // Create standardized error
      const googleError = createGooglePlacesError(error, 'Failed to fetch reviews');
      console.error('Error fetching reviews:', googleError);
      
      // Get user-friendly error message
      const userMessage = getUserFriendlyErrorMessage(googleError, 'loading');
      
      setLoadingState({
        isLoading: false,
        error: userMessage,
        hasData: !!placeDetails, // Keep existing data if available
        isRetrying: false,
        retryCount: isRetry ? loadingState.retryCount + 1 : 0,
        isOffline: !isOnline()
      });

      // Auto-retry for retryable errors (max 3 attempts)
      if (googleError.retryable && (!isRetry || loadingState.retryCount < 2)) {
        const retryDelay = googleError.retryAfter || 3000;
        console.log(`Auto-retrying in ${retryDelay}ms...`);
        
        setTimeout(() => {
          fetchReviews(true);
        }, retryDelay);
      }
    }
  }, [effectivePlaceId, maxReviews, loadingState.retryCount, placeDetails]);

  useEffect(() => {
    fetchReviews();
  }, [effectivePlaceId]);

  // Optimized loading skeleton component with smooth animations
  const LoadingSkeleton = useMemo(() => () => (
    <div className="animate-pulse">
      {/* Overall rating skeleton */}
      {showOverallRating && (
        <div className="text-center mb-12 transform transition-all duration-300 ease-in-out">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-48 mx-auto mb-4"></div>
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-32 mx-auto mb-2"></div>
          <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-24 mx-auto"></div>
        </div>
      )}
      
      {/* Reviews grid skeleton with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {Array.from({ length: maxReviews }, (_, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg p-6 shadow-card border border-gray-200 transform transition-all duration-300 ease-in-out"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-24 mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-16"></div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="w-4 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ), [maxReviews, showOverallRating]);

  // Manual retry function
  const handleRetry = useCallback(() => {
    fetchReviews(true);
  }, [fetchReviews]);

  // Error state component with retry functionality
  const ErrorState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <div className="text-text-gray-200 font-jost mb-6">
        {loadingState.isOffline ? (
          <svg className="w-12 h-12 mx-auto mb-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.18l6.364 6.364a9 9 0 010 12.728L12 21.636l-6.364-6.364a9 9 0 010-12.728L12 2.18z" />
          </svg>
        ) : (
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <p className="text-lg mb-2">{message}</p>
        
        {loadingState.isOffline ? (
          <div className="text-sm text-orange-600 mb-4">
            <p>Mode hors ligne détecté</p>
            <p>Les avis seront chargés automatiquement lors de la reconnexion</p>
          </div>
        ) : (
          <div className="text-sm text-text-gray mb-4">
            {loadingState.retryCount > 0 && (
              <p>Tentative {loadingState.retryCount + 1}/3</p>
            )}
            {loadingState.isRetrying ? (
              <p>Nouvelle tentative en cours...</p>
            ) : (
              <p>Vérifiez votre connexion internet</p>
            )}
          </div>
        )}

        {!loadingState.isRetrying && !loadingState.isOffline && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-primary-100 hover:bg-primary-200 text-white px-4 py-2 rounded-lg font-medium font-jost transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:ring-opacity-50"
            disabled={loadingState.isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réessayer
          </button>
        )}
      </div>
    </div>
  );

  // Memoize display reviews for performance (must be before early returns)
  const displayReviews = useMemo(() => 
    placeDetails?.reviews.slice(0, maxReviews) || [], 
    [placeDetails?.reviews, maxReviews]
  );

  // Don't render anything if there's an error and no cached data
  if (loadingState.error && !loadingState.hasData) {
    return null; // Gracefully hide the section
  }

  // Show loading state
  if (loadingState.isLoading && !placeDetails) {
    return (
      <section className={`${className}`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-dm-serif text-text-blue mb-4">
            Ce que disent nos clients
          </h2>
        </div>
        <LoadingSkeleton />
      </section>
    );
  }

  // Don't render if no place details
  if (!placeDetails) {
    return null;
  }

  return (
    <section className={`${className} transform transition-all duration-500 ease-in-out`}>
      {/* Section heading with smooth entrance animation */}
      <div className="text-center mb-12 transform transition-all duration-700 ease-out animate-fadeInUp">
        <h2 className="text-[30px] lg:text-[50px] font-dm tracking-wide leading-8 md:leading-[62.50px] text-text-blue mb-4 transform transition-all duration-500 hover:scale-105">
          Ce que disent nos clients
        </h2>
        <p className="text-text-gray font-jost text-lg max-w-2xl mx-auto transform transition-all duration-500 delay-100 animate-fadeInUp">
          Découvrez les témoignages authentiques de nos clients satisfaits
        </p>
      </div>    
      {/* Overall rating display with enhanced animations */}
      {showOverallRating && (
        <div className="text-center mb-12 transform transition-all duration-700 ease-out animate-fadeInUp delay-200">
          <div className="bg-white rounded-lg p-8 shadow-card border border-text-gray-300 max-w-md mx-auto transform transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1">
            <div className="flex items-center justify-center gap-4 mb-4">
              <StarRating 
                rating={placeDetails.rating} 
                size="lg" 
                showNumber={true}
                className="justify-center"
              />
            </div>
            <p className="text-text-gray font-jost text-base mb-2 transform transition-all duration-300">
              Basé sur {placeDetails.user_ratings_total} avis Google
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-text-gray-200 transform transition-all duration-300">
              <span>Alimenté par</span>
              <svg className="w-12 h-4 transform transition-all duration-300 hover:scale-110" viewBox="0 0 272 92" fill="none">
                <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
                <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#34A853"/>
                <path d="M225 3v65h-9.5V3h9.5z" fill="#EA4335"/>
                <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#FBBC05"/>
                <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
              </svg>
            </div>
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${placeDetails.place_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary-100 hover:bg-primary-200 text-white px-6 py-3 rounded-lg font-medium font-jost transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:ring-opacity-50 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg className="w-5 h-5 transform transition-transform duration-200 group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Voir tous les avis
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Reviews grid with staggered animations */}
      {displayReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <Suspense fallback={<LoadingSkeleton />}>
            {displayReviews.map((review, index) => (
              <div
                key={`${review.author_name}-${review.time}-${index}`}
                className="transform transition-all duration-500 ease-out animate-fadeInUp"
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: 'both'
                }}
              >
                <ReviewCard
                  review={review}
                  className="h-full transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-lg"
                />
              </div>
            ))}
          </Suspense>
        </div>
      ) : (
        <div className="text-center py-12 transform transition-all duration-500 animate-fadeInUp">
          <p className="text-text-gray font-jost text-lg">
            Aucun avis disponible pour le moment.
          </p>
        </div>
      )}

      {/* Loading indicator for background updates and retries */}
      {(loadingState.isLoading || loadingState.isRetrying) && placeDetails && (
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-text-gray font-jost text-sm">
            <div className="animate-spin w-4 h-4 border-2 border-primary-100 border-t-transparent rounded-full"></div>
            {loadingState.isRetrying ? (
              <span>Nouvelle tentative... ({loadingState.retryCount + 1}/3)</span>
            ) : (
              <span>Mise à jour des avis...</span>
            )}
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {loadingState.isOffline && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-2 text-orange-600 font-jost text-sm bg-orange-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
            </svg>
            Mode hors ligne - Reconnexion automatique en cours
          </div>
        </div>
      )}
    </section>
  );
};

export default GoogleReviews;