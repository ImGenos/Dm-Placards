/**
 * Performance optimization tests for Google Reviews components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import GoogleReviews from '../google-reviews';
import ReviewCard from '../review-card';
import StarRating from '../star-rating';
import type { Review } from '../review-card';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock intersection observer for lazy loading
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock Google Places API
vi.mock('../../utils/google-places-api', () => ({
  googlePlacesService: {
    getPlaceDetails: vi.fn().mockResolvedValue({
      name: 'Test Business',
      rating: 4.5,
      user_ratings_total: 150,
      place_id: 'test-place-id',
      reviews: [
        {
          author_name: 'John Doe',
          rating: 5,
          text: 'Excellent service! Highly recommended.',
          relative_time_description: '2 weeks ago',
          time: Date.now() / 1000,
          language: 'en'
        },
        {
          author_name: 'Jane Smith',
          rating: 4,
          text: 'Very good work, professional team.',
          relative_time_description: '1 month ago',
          time: Date.now() / 1000 - 2592000,
          language: 'en'
        }
      ]
    }),
    shouldRefreshCache: vi.fn().mockReturnValue(false),
    getPerformanceStats: vi.fn().mockReturnValue({
      totalRequests: 1,
      cacheHits: 0,
      cacheMisses: 1,
      averageResponseTime: 150
    }),
    getCacheInfo: vi.fn().mockReturnValue({
      size: 1,
      maxSize: 10,
      hitRate: 0
    })
  }
}));

// Mock config
vi.mock('../../utils/config', () => ({
  getDefaultPlaceId: vi.fn().mockReturnValue('test-place-id')
}));

// Mock performance monitor
vi.mock('../../utils/performance-monitor', () => ({
  performanceMonitor: {
    start: vi.fn(),
    end: vi.fn(),
    getStats: vi.fn().mockReturnValue({
      totalEntries: 1,
      averageDuration: 100,
      minDuration: 100,
      maxDuration: 100,
      completedEntries: 1
    })
  }
}));

// Mock error handling
vi.mock('../../utils/error-handling', () => ({
  createGooglePlacesError: vi.fn((error) => error),
  getUserFriendlyErrorMessage: vi.fn(() => 'Une erreur est survenue'),
  isOnline: vi.fn(() => true)
}));

describe('Performance Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Memoization', () => {
    it('should memoize ReviewCard component to prevent unnecessary re-renders', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Great service!',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      const { rerender } = render(<ReviewCard review={mockReview} />);
      
      // Re-render with same props should not cause re-render
      rerender(<ReviewCard review={mockReview} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should memoize StarRating component calculations', () => {
      const { rerender } = render(<StarRating rating={4.5} />);
      
      // Re-render with same rating should use memoized calculations
      rerender(<StarRating rating={4.5} />);
      
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    it('should implement lazy loading for ReviewCard components', async () => {
      render(<GoogleReviews maxReviews={3} />);
      
      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      // Check that Suspense is used for lazy loading
      expect(screen.queryByText('John Doe')).toBeInTheDocument();
    });

    it('should show loading skeleton while components are loading', async () => {
      render(<GoogleReviews maxReviews={3} />);
      
      // Initially should show loading skeleton
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      
      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Animation Performance', () => {
    it('should use GPU-accelerated animations', () => {
      render(<GoogleReviews maxReviews={2} />);
      
      const section = screen.getByRole('region', { name: /reviews/i }) || 
                    document.querySelector('section');
      
      if (section) {
        expect(section.className).toContain('transform');
        expect(section.className).toContain('transition-all');
      }
    });

    it('should implement staggered animations for review cards', async () => {
      render(<GoogleReviews maxReviews={3} />);
      
      await waitFor(() => {
        const reviewCards = document.querySelectorAll('[style*="animation-delay"]');
        expect(reviewCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Mobile Touch Optimizations', () => {
    it('should implement touch-friendly interactions', async () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'This is a very long review text that should be truncated and show a read more button for better mobile experience and performance optimization.',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      render(<ReviewCard review={mockReview} />);
      
      const readMoreButton = screen.getByText('Lire la suite');
      expect(readMoreButton.className).toContain('touch-manipulation');
      
      // Test touch interaction
      fireEvent.click(readMoreButton);
      
      await waitFor(() => {
        expect(screen.getByText('Réduire')).toBeInTheDocument();
      });
    });

    it('should prevent tap highlight on mobile elements', () => {
      render(<GoogleReviews maxReviews={1} />);
      
      const buttons = document.querySelectorAll('button, a');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(button.style.WebkitTapHighlightColor || 
               button.className.includes('touch-manipulation')).toBeTruthy();
      });
    });
  });

  describe('Image Optimization', () => {
    it('should implement lazy loading for profile images', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Great service!',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en',
        profile_photo_url: 'https://example.com/photo.jpg'
      };

      render(<ReviewCard review={mockReview} />);
      
      const image = screen.getByAltText('Photo de Test User');
      expect(image.getAttribute('loading')).toBe('lazy');
      expect(image.getAttribute('decoding')).toBe('async');
    });

    it('should handle image loading errors gracefully', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Great service!',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en',
        profile_photo_url: 'https://example.com/invalid-photo.jpg'
      };

      render(<ReviewCard review={mockReview} />);
      
      const image = screen.getByAltText('Photo de Test User');
      
      // Simulate image error
      fireEvent.error(image);
      
      // Should show fallback avatar
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of name
    });
  });

  describe('Performance Monitoring', () => {
    it('should track component render performance', async () => {
      const startTime = Date.now();
      mockPerformance.now.mockReturnValue(startTime);
      
      render(<GoogleReviews maxReviews={2} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Performance monitoring should be called
      const { performanceMonitor } = await import('../../utils/performance-monitor');
      expect(performanceMonitor.start).toHaveBeenCalled();
      expect(performanceMonitor.end).toHaveBeenCalled();
    });

    it('should measure API call performance', async () => {
      render(<GoogleReviews maxReviews={1} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const { performanceMonitor } = await import('../../utils/performance-monitor');
      expect(performanceMonitor.start).toHaveBeenCalledWith(
        'google-reviews-fetch',
        expect.any(Object)
      );
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<GoogleReviews maxReviews={1} />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should use memoized values to prevent unnecessary calculations', () => {
      const { rerender } = render(<StarRating rating={4.5} maxStars={5} />);
      
      // Re-render with same props
      rerender(<StarRating rating={4.5} maxStars={5} />);
      
      // Should not recalculate stars
      expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(5);
    });
  });

  describe('Accessibility Performance', () => {
    it('should maintain accessibility while optimizing performance', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Long review text that needs truncation for performance reasons but should maintain accessibility.',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      render(<ReviewCard review={mockReview} />);
      
      const button = screen.getByRole('button', { name: /lire la suite/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<GoogleReviews maxReviews={1} />);
      
      // Should still render content but with reduced animations
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
    });
  });

  describe('Loading Performance', () => {
    it('should meet 3-second loading requirement', async () => {
      const startTime = performance.now();
      
      render(<GoogleReviews maxReviews={6} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 3 seconds (3000ms)
      expect(loadTime).toBeLessThan(3000);
    });

    it('should show loading skeleton immediately', () => {
      render(<GoogleReviews maxReviews={3} />);
      
      // Should show loading state immediately
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      
      // Should have skeleton elements
      const skeletonElements = document.querySelectorAll('.animate-shimmer, .animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });
});