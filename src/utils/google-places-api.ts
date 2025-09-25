/**
 * Google Places API Service
 * Handles fetching place details and reviews with caching and error handling
 */

import { 
  createGooglePlacesError, 
  retryWithBackoff, 
  retryWithBackoffAndJitter,
  logGooglePlacesError,
  GooglePlacesError,
  withTimeout,
  validateNetworkConnectivity,
  isOnline,
  waitForOnline
} from './error-handling';
import { getGooglePlacesConfig, validateGooglePlacesConfig } from './config';

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

export interface PlaceDetails {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: Review[];
  place_id: string;
}

interface CachedReviewData {
  data: PlaceDetails;
  timestamp: number;
  expiresAt: number;
  version: string; // Cache version for invalidation
  fetchDuration?: number; // Performance tracking
}

interface PerformanceMetrics {
  fetchStartTime: number;
  fetchEndTime?: number;
  cacheHit: boolean;
  apiCallMade: boolean;
  errorOccurred: boolean;
  retryCount: number;
}

interface GooglePlacesApiResponse {
  result: {
    name: string;
    rating: number;
    user_ratings_total: number;
    reviews: Review[];
    place_id: string;
  };
  status: string;
}

class GooglePlacesService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly CACHE_KEY_PREFIX = 'google_reviews_';
  private readonly CACHE_VERSION = '1.0.0'; // For cache invalidation
  private readonly API_BASE_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
  private readonly RATE_LIMIT_DELAY = 100; // Minimum delay between API calls (ms)
  private readonly MAX_CACHE_SIZE = 10; // Maximum number of cached place details
  
  // Rate limiting
  private lastApiCall = 0;
  private apiCallQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  
  // Performance tracking
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  
  // Fallback reviews for when API is unavailable
  private readonly fallbackReviews: PlaceDetails = {
    name: "Entreprise de Design d'Intérieur",
    rating: 4.8,
    user_ratings_total: 25,
    place_id: "fallback",
    reviews: [
      {
        author_name: "Marie Dubois",
        rating: 5,
        text: "Excellent travail sur notre dressing sur mesure. L'équipe est très professionnelle et à l'écoute de nos besoins. Le résultat dépasse nos attentes !",
        relative_time_description: "il y a 2 semaines",
        language: "fr",
        time: Date.now() - (14 * 24 * 60 * 60 * 1000)
      },
      {
        author_name: "Pierre Martin",
        rating: 5,
        text: "Rénovation complète de notre salon. Design moderne et fonctionnel. Je recommande vivement leurs services.",
        relative_time_description: "il y a 1 mois",
        language: "fr",
        time: Date.now() - (30 * 24 * 60 * 60 * 1000)
      },
      {
        author_name: "Sophie Laurent",
        rating: 4,
        text: "Très satisfaite du travail réalisé dans notre cuisine. Équipe ponctuelle et soignée.",
        relative_time_description: "il y a 3 semaines",
        language: "fr",
        time: Date.now() - (21 * 24 * 60 * 60 * 1000)
      }
    ]
  };

  /**
   * Get place details including reviews from Google Places API
   * @param placeId - Google Place ID
   * @returns Promise<PlaceDetails>
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const startTime = performance.now();
    const metrics: PerformanceMetrics = {
      fetchStartTime: startTime,
      cacheHit: false,
      apiCallMade: false,
      errorOccurred: false,
      retryCount: 0
    };

    try {
      // Check cache first
      const cachedData = this.getCachedReviews(placeId);
      if (cachedData) {
        metrics.cacheHit = true;
        metrics.fetchEndTime = performance.now();
        this.recordPerformanceMetrics(placeId, metrics);
        return cachedData;
      }

      // Validate configuration
      if (!validateGooglePlacesConfig()) {
        console.warn('Google Places API not properly configured, using fallback reviews');
        metrics.errorOccurred = true;
        metrics.fetchEndTime = performance.now();
        this.recordPerformanceMetrics(placeId, metrics);
        return this.fallbackReviews;
      }

      // Get API key from environment
      const config = getGooglePlacesConfig();
      if (!config.apiKey) {
        console.warn('Google Places API key not found, using fallback reviews');
        metrics.errorOccurred = true;
        metrics.fetchEndTime = performance.now();
        this.recordPerformanceMetrics(placeId, metrics);
        return this.fallbackReviews;
      }

      // Check network connectivity before making API call
      if (!isOnline()) {
        console.warn('User is offline, attempting to wait for connection...');
        try {
          await waitForOnline(5000); // Wait up to 5 seconds
        } catch (offlineError) {
          throw new Error('User is offline and no cached data available');
        }
      }

      // Validate network connectivity
      const hasConnectivity = await validateNetworkConnectivity();
      if (!hasConnectivity) {
        throw new Error('Network connectivity validation failed');
      }

      // Make rate-limited API request with enhanced retry logic
      metrics.apiCallMade = true;
      const response = await this.makeRateLimitedApiCall(
        () => retryWithBackoffAndJitter(
          () => this.fetchPlaceDetails(placeId, config.apiKey!),
          3, // max retries
          1000, // base delay
          30000 // max delay
        )
      );
      
      if (response.status === 'OK' && response.result) {
        const fetchDuration = performance.now() - startTime;
        const placeDetails: PlaceDetails = {
          name: response.result.name,
          rating: response.result.rating,
          user_ratings_total: response.result.user_ratings_total,
          reviews: this.filterAndSortReviews(response.result.reviews || []),
          place_id: response.result.place_id
        };

        // Cache the results with performance data
        this.setCachedReviews(placeId, placeDetails, fetchDuration);
        
        metrics.fetchEndTime = performance.now();
        this.recordPerformanceMetrics(placeId, metrics);
        
        return placeDetails;
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      metrics.errorOccurred = true;
      metrics.fetchEndTime = performance.now();
      this.recordPerformanceMetrics(placeId, metrics);
      
      const googleError = createGooglePlacesError(error, 'Failed to fetch place details');
      logGooglePlacesError(googleError);
      
      // Try to return cached data even if expired
      const expiredCache = this.getCachedReviews(placeId, true);
      if (expiredCache) {
        console.warn('Using expired cached reviews due to API error');
        return expiredCache;
      }
      
      // Return fallback reviews as last resort
      return this.fallbackReviews;
    }
  }

  /**
   * Get cached reviews if available and not expired
   * @param placeId - Google Place ID
   * @param allowExpired - Whether to return expired cache
   * @returns PlaceDetails | null
   */
  getCachedReviews(placeId: string, allowExpired: boolean = false): PlaceDetails | null {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + placeId;
      const cachedDataStr = localStorage.getItem(cacheKey);
      
      if (!cachedDataStr) {
        return null;
      }

      const cachedData: CachedReviewData = JSON.parse(cachedDataStr);
      const now = Date.now();

      // Validate cache structure and version
      if (!this.validateCacheData(cachedData)) {
        console.warn('Invalid cache data structure, removing cache entry');
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check cache version compatibility
      if (cachedData.version !== this.CACHE_VERSION) {
        console.info('Cache version mismatch, invalidating cache');
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check if cache is still valid or if we allow expired cache
      if (allowExpired || now < cachedData.expiresAt) {
        // Log cache performance if available
        if (cachedData.fetchDuration) {
          console.debug(`Cache hit for ${placeId}, original fetch took ${cachedData.fetchDuration.toFixed(2)}ms`);
        }
        return cachedData.data;
      }

      // Cache expired, remove it
      console.debug(`Cache expired for ${placeId}, removing entry`);
      localStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.error('Error reading cached reviews:', error);
      // Remove corrupted cache entry
      try {
        localStorage.removeItem(this.CACHE_KEY_PREFIX + placeId);
      } catch (removeError) {
        console.error('Error removing corrupted cache:', removeError);
      }
      return null;
    }
  }

  /**
   * Cache reviews data in localStorage
   * @param placeId - Google Place ID
   * @param data - Place details to cache
   * @param fetchDuration - Time taken to fetch the data (optional)
   */
  setCachedReviews(placeId: string, data: PlaceDetails, fetchDuration?: number): void {
    try {
      // Manage cache size before adding new entry
      this.manageCacheSize();
      
      const cacheKey = this.CACHE_KEY_PREFIX + placeId;
      const now = Date.now();
      
      const cacheData: CachedReviewData = {
        data,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION,
        version: this.CACHE_VERSION,
        fetchDuration
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.debug(`Cached reviews for ${placeId}, expires at ${new Date(cacheData.expiresAt).toISOString()}`);
      
      if (fetchDuration) {
        console.debug(`API fetch completed in ${fetchDuration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Error caching reviews:', error);
      // If localStorage is full, try to clear some space
      if (error instanceof DOMException && error.code === 22) {
        console.warn('localStorage quota exceeded, clearing old cache entries');
        this.clearExpiredCache();
        // Try caching again after cleanup
        try {
          const cacheKey = this.CACHE_KEY_PREFIX + placeId;
          const now = Date.now();
          const cacheData: CachedReviewData = {
            data,
            timestamp: now,
            expiresAt: now + this.CACHE_DURATION,
            version: this.CACHE_VERSION,
            fetchDuration
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error('Failed to cache after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Clear cached reviews for a specific place ID
   * @param placeId - Google Place ID
   */
  clearCache(placeId?: string): void {
    try {
      if (placeId) {
        const cacheKey = this.CACHE_KEY_PREFIX + placeId;
        localStorage.removeItem(cacheKey);
      } else {
        // Clear all cached reviews
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.CACHE_KEY_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }



  /**
   * Fetch place details from Google Places API with timeout and enhanced error handling
   * @param placeId - Google Place ID
   * @param apiKey - Google Places API key
   * @returns Promise<GooglePlacesApiResponse>
   */
  private async fetchPlaceDetails(placeId: string, apiKey: string): Promise<GooglePlacesApiResponse> {
    const fields = 'name,rating,user_ratings_total,reviews,place_id';
    const url = `${this.API_BASE_URL}?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}&language=fr`;

    try {
      // Add timeout to prevent hanging requests
      const response = await withTimeout(
        fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; GoogleReviewsWidget/1.0)'
          },
          // Add signal for request cancellation if needed
          signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
        }),
        15000 // 15 second timeout
      );
      
      if (!response.ok) {
        // Enhanced error messages based on status codes
        let errorMessage = `HTTP Error: ${response.status}`;
        
        switch (response.status) {
          case 400:
            errorMessage += ' - Invalid request parameters';
            break;
          case 401:
            errorMessage += ' - Invalid API key';
            break;
          case 403:
            errorMessage += ' - API access forbidden';
            break;
          case 404:
            errorMessage += ' - Place not found';
            break;
          case 429:
            errorMessage += ' - Rate limit exceeded';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage += ' - Google server error';
            break;
          default:
            errorMessage += ` - ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate API response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      // Check for API-level errors
      if (data.status && data.status !== 'OK') {
        throw new Error(`API Error: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`);
      }
      
      return data;
    } catch (error) {
      // Re-throw with additional context for better error handling
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new Error('Request timeout - Google Places API took too long to respond');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error - Unable to connect to Google Places API');
        }
      }
      throw error;
    }
  }

  /**
   * Filter and sort reviews (4+ stars, most recent first)
   * @param reviews - Array of reviews
   * @returns Filtered and sorted reviews
   */
  private filterAndSortReviews(reviews: Review[]): Review[] {
    return reviews
      .filter(review => review.rating >= 4) // Only show 4+ star reviews
      .sort((a, b) => b.time - a.time) // Sort by most recent first
      .slice(0, 10); // Limit to 10 reviews max
  }

  /**
   * Make rate-limited API call to prevent hitting rate limits
   * @param apiCall - Function that makes the API call
   * @returns Promise with API response
   */
  private async makeRateLimitedApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.apiCallQueue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastCall = now - this.lastApiCall;
          
          if (timeSinceLastCall < this.RATE_LIMIT_DELAY) {
            const delay = this.RATE_LIMIT_DELAY - timeSinceLastCall;
            console.debug(`Rate limiting: waiting ${delay}ms before API call`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          this.lastApiCall = Date.now();
          const result = await apiCall();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processApiQueue();
    });
  }

  /**
   * Process the API call queue to ensure rate limiting
   */
  private async processApiQueue(): Promise<void> {
    if (this.isProcessingQueue || this.apiCallQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.apiCallQueue.length > 0) {
      const apiCall = this.apiCallQueue.shift();
      if (apiCall) {
        await apiCall();
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Validate cache data structure
   * @param cacheData - Cache data to validate
   * @returns boolean indicating if cache data is valid
   */
  private validateCacheData(cacheData: any): cacheData is CachedReviewData {
    return (
      cacheData &&
      typeof cacheData === 'object' &&
      cacheData.data &&
      typeof cacheData.timestamp === 'number' &&
      typeof cacheData.expiresAt === 'number' &&
      cacheData.data.name &&
      typeof cacheData.data.rating === 'number' &&
      Array.isArray(cacheData.data.reviews)
    );
  }

  /**
   * Manage cache size by removing oldest entries if needed
   */
  private manageCacheSize(): void {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_KEY_PREFIX)
      );
      
      if (cacheKeys.length >= this.MAX_CACHE_SIZE) {
        // Get cache entries with timestamps
        const cacheEntries = cacheKeys.map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return { key, timestamp: data.timestamp || 0 };
          } catch {
            return { key, timestamp: 0 };
          }
        });
        
        // Sort by timestamp (oldest first)
        cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove oldest entries to make room
        const entriesToRemove = cacheEntries.slice(0, cacheEntries.length - this.MAX_CACHE_SIZE + 1);
        entriesToRemove.forEach(entry => {
          localStorage.removeItem(entry.key);
          console.debug(`Removed old cache entry: ${entry.key}`);
        });
      }
    } catch (error) {
      console.error('Error managing cache size:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    try {
      const now = Date.now();
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_KEY_PREFIX)
      );
      
      let removedCount = 0;
      cacheKeys.forEach(key => {
        try {
          const cachedDataStr = localStorage.getItem(key);
          if (cachedDataStr) {
            const cachedData = JSON.parse(cachedDataStr);
            if (now >= cachedData.expiresAt) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          removedCount++;
        }
      });
      
      console.debug(`Cleared ${removedCount} expired cache entries`);
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Record performance metrics for monitoring
   * @param placeId - Place ID for the request
   * @param metrics - Performance metrics to record
   */
  private recordPerformanceMetrics(placeId: string, metrics: PerformanceMetrics): void {
    try {
      this.performanceMetrics.set(placeId, metrics);
      
      // Log performance summary
      const duration = metrics.fetchEndTime ? metrics.fetchEndTime - metrics.fetchStartTime : 0;
      const status = metrics.cacheHit ? 'cache-hit' : 
                    metrics.errorOccurred ? 'error' : 
                    metrics.apiCallMade ? 'api-call' : 'unknown';
      
      console.debug(`Performance [${placeId}]: ${duration.toFixed(2)}ms (${status})`);
      
      // Keep only recent metrics (last 10 requests)
      if (this.performanceMetrics.size > 10) {
        const oldestKey = this.performanceMetrics.keys().next().value;
        this.performanceMetrics.delete(oldestKey);
      }
    } catch (error) {
      console.error('Error recording performance metrics:', error);
    }
  }

  /**
   * Get performance statistics
   * @returns Performance summary
   */
  getPerformanceStats(): {
    totalRequests: number;
    cacheHitRate: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const metrics = Array.from(this.performanceMetrics.values());
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        errorRate: 0
      };
    }
    
    const cacheHits = metrics.filter(m => m.cacheHit).length;
    const errors = metrics.filter(m => m.errorOccurred).length;
    const totalDuration = metrics.reduce((sum, m) => {
      return sum + (m.fetchEndTime ? m.fetchEndTime - m.fetchStartTime : 0);
    }, 0);
    
    return {
      totalRequests: metrics.length,
      cacheHitRate: (cacheHits / metrics.length) * 100,
      averageResponseTime: totalDuration / metrics.length,
      errorRate: (errors / metrics.length) * 100
    };
  }

  /**
   * Preload reviews for better performance on subsequent visits
   * @param placeId - Google Place ID to preload
   * @returns Promise<boolean> indicating success
   */
  async preloadReviews(placeId: string): Promise<boolean> {
    try {
      // Check if we already have fresh cache
      const cached = this.getCachedReviews(placeId);
      if (cached) {
        console.debug(`Reviews already cached for ${placeId}`);
        return true;
      }
      
      // Preload in background without blocking
      this.getPlaceDetails(placeId).catch(error => {
        console.warn('Background preload failed:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Error preloading reviews:', error);
      return false;
    }
  }

  /**
   * Check if cache needs refresh (within 2 hours of expiry)
   * @param placeId - Google Place ID
   * @returns boolean indicating if refresh is recommended
   */
  shouldRefreshCache(placeId: string): boolean {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + placeId;
      const cachedDataStr = localStorage.getItem(cacheKey);
      
      if (!cachedDataStr) {
        return true; // No cache, should refresh
      }
      
      const cachedData: CachedReviewData = JSON.parse(cachedDataStr);
      const now = Date.now();
      const twoHoursBeforeExpiry = cachedData.expiresAt - (2 * 60 * 60 * 1000);
      
      return now >= twoHoursBeforeExpiry;
    } catch (error) {
      console.error('Error checking cache refresh status:', error);
      return true; // Error reading cache, should refresh
    }
  }

  /**
   * Get cache statistics for debugging
   * @returns Object with cache info
   */
  getCacheInfo(): { 
    totalCached: number; 
    keys: string[];
    cacheSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.CACHE_KEY_PREFIX)
    );
    
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let totalSize = 0;
    
    keys.forEach(key => {
      try {
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          totalSize += dataStr.length;
          const data = JSON.parse(dataStr);
          if (data.timestamp) {
            oldestTimestamp = Math.min(oldestTimestamp, data.timestamp);
            newestTimestamp = Math.max(newestTimestamp, data.timestamp);
          }
        }
      } catch (error) {
        // Ignore parsing errors for size calculation
      }
    });
    
    return {
      totalCached: keys.length,
      keys,
      cacheSize: totalSize,
      oldestEntry: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : undefined,
      newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp) : undefined
    };
  }
}

// Export singleton instance
export const googlePlacesService = new GooglePlacesService();

// Export class for testing
export { GooglePlacesService };