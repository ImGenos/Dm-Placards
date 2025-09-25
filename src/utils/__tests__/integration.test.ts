/**
 * Integration tests for Google Places API
 * These tests verify the integration works with environment configuration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { googlePlacesService } from '../google-places-api';
import { getGooglePlacesConfig, validateGooglePlacesConfig, getDefaultPlaceId } from '../config';

describe('Google Places API Integration', () => {
  beforeEach(() => {
    // Clear any existing cache
    googlePlacesService.clearCache();
  });

  describe('Configuration', () => {
    it('should have configuration utilities', () => {
      const config = getGooglePlacesConfig();
      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('placeId');
    });

    it('should validate configuration', () => {
      const isValid = validateGooglePlacesConfig();
      expect(typeof isValid).toBe('boolean');
    });

    it('should get default place ID', () => {
      const placeId = getDefaultPlaceId();
      expect(placeId).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should handle missing configuration gracefully', async () => {
      // This test verifies fallback behavior when config is missing
      const result = await googlePlacesService.getPlaceDetails('invalid-place-id');
      
      // Should return fallback reviews
      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.rating).toBeGreaterThan(0);
      expect(Array.isArray(result.reviews)).toBe(true);
    });

    it('should provide cache management', () => {
      const cacheInfo = googlePlacesService.getCacheInfo();
      expect(cacheInfo).toHaveProperty('totalCached');
      expect(cacheInfo).toHaveProperty('keys');
      expect(Array.isArray(cacheInfo.keys)).toBe(true);
    });

    it('should handle cache operations', () => {
      const testPlaceId = 'test-place-id';
      const testData = {
        name: 'Test Business',
        rating: 4.5,
        user_ratings_total: 10,
        reviews: [],
        place_id: testPlaceId
      };

      // Test caching
      googlePlacesService.setCachedReviews(testPlaceId, testData);
      
      // Test retrieval
      const cached = googlePlacesService.getCachedReviews(testPlaceId);
      expect(cached).toEqual(testData);
      
      // Test clearing
      googlePlacesService.clearCache(testPlaceId);
      const clearedCache = googlePlacesService.getCachedReviews(testPlaceId);
      expect(clearedCache).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network failure scenario
      const originalFetch = global.fetch;
      global.fetch = () => Promise.reject(new Error('Network error'));

      try {
        const result = await googlePlacesService.getPlaceDetails('test-place-id');
        
        // Should still return data (fallback)
        expect(result).toBeDefined();
        expect(result.name).toBeDefined();
      } finally {
        // Restore original fetch
        global.fetch = originalFetch;
      }
    });
  });
});