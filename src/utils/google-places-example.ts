/**
 * Example usage of Google Places API service
 * This file demonstrates how to use the googlePlacesService
 */

import { googlePlacesService } from './google-places-api';
import { getDefaultPlaceId, validateGooglePlacesConfig } from './config';

/**
 * Example function to fetch and display reviews
 */
export async function fetchAndDisplayReviews() {
  try {
    // Check if configuration is valid
    if (!validateGooglePlacesConfig()) {
      console.error('Google Places API is not properly configured');
      return;
    }

    // Get the default place ID from environment
    const placeId = getDefaultPlaceId();
    if (!placeId) {
      console.error('No place ID configured');
      return;
    }

    console.log('Fetching reviews for place ID:', placeId);

    // Fetch place details and reviews
    const placeDetails = await googlePlacesService.getPlaceDetails(placeId);

    console.log('Place Details:', {
      name: placeDetails.name,
      rating: placeDetails.rating,
      totalReviews: placeDetails.user_ratings_total,
      reviewsShown: placeDetails.reviews.length
    });

    // Display reviews
    placeDetails.reviews.forEach((review, index) => {
      console.log(`Review ${index + 1}:`, {
        author: review.author_name,
        rating: review.rating,
        text: review.text.substring(0, 100) + '...',
        date: review.relative_time_description
      });
    });

    return placeDetails;
  } catch (error) {
    console.error('Error in example:', error);
  }
}

/**
 * Example function to check cache status
 */
export function checkCacheStatus() {
  const cacheInfo = googlePlacesService.getCacheInfo();
  console.log('Cache Status:', cacheInfo);
  
  const placeId = getDefaultPlaceId();
  if (placeId) {
    const cachedData = googlePlacesService.getCachedReviews(placeId);
    console.log('Cached data available:', !!cachedData);
    
    if (cachedData) {
      console.log('Cached reviews count:', cachedData.reviews.length);
    }
  }
}

/**
 * Example function to clear cache
 */
export function clearAllCache() {
  googlePlacesService.clearCache();
  console.log('Cache cleared');
}

// Export for use in browser console during development
if (typeof window !== 'undefined') {
  (window as any).googlePlacesExample = {
    fetchAndDisplayReviews,
    checkCacheStatus,
    clearAllCache,
    service: googlePlacesService
  };
}