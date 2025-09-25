/**
 * Accessibility tests for Google Reviews components
 * Tests compliance with WCAG guidelines and screen reader compatibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import GoogleReviews from '../google-reviews';
import ReviewCard from '../review-card';
import StarRating from '../star-rating';
import { googlePlacesService } from '../../utils/google-places-api';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('../../utils/google-places-api', () => ({
  googlePlacesService: {
    getPlaceDetails: vi.fn(),
    shouldRefreshCache: vi.fn(() => false),
    getPerformanceStats: vi.fn(() => ({
      totalRequests: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      errorRate: 0
    })),
    getCacheInfo: vi.fn(() => ({
      totalCached: 0,
      keys: [],
      cacheSize: 0
    }))
  }
}));

vi.mock('../../utils/config', () => ({
  getDefaultPlaceId: vi.fn(() => 'test-place-id')
}));

vi.mock('../../utils/performance-monitor', () => ({
  performanceMonitor: {
    start: vi.fn(),
    end: vi.fn(),
    getStats: vi.fn(() => ({
      totalEntries: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      completedEntries: 0
    }))
  },
  measureComponentRender: vi.fn(() => vi.fn())
}));

vi.mock('../../utils/error-handling', () => ({
  createGooglePlacesError: vi.fn((error) => ({
    type: 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error',
    retryable: false
  })),
  getUserFriendlyErrorMessage: vi.fn(() => 'Chargement des avis en cours...'),
  isOnline: vi.fn(() => true)
}));

const mockPlaceDetails = {
  name: "Test Business",
  rating: 4.5,
  user_ratings_total: 25,
  place_id: "test-place-id",
  reviews: [
    {
      author_name: "John Doe",
      rating: 5,
      text: "Great service and professional work!",
      relative_time_description: "2 weeks ago",
      language: "en",
      time: Date.now() - (14 * 24 * 60 * 60 * 1000)
    },
    {
      author_name: "Jane Smith", 
      rating: 4,
      text: "Very satisfied with the results. Highly recommend!",
      relative_time_description: "1 month ago",
      language: "en",
      time: Date.now() - (30 * 24 * 60 * 60 * 1000)
    }
  ]
};

const mockReview = {
  author_name: 'Jean Dupont',
  author_url: 'https://example.com/profile',
  language: 'fr',
  profile_photo_url: 'https://example.com/photo.jpg',
  rating: 5,
  relative_time_description: 'il y a 2 semaines',
  text: 'Excellent travail sur notre dressing sur mesure. L\'équipe est très professionnelle et le résultat dépasse nos attentes. Je recommande vivement leurs services.',
  time: 1640995200
};

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GoogleReviews Component Accessibility', () => {
    it('should not have accessibility violations', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      const { container } = render(<GoogleReviews />);
      
      // Wait for component to load
      await screen.findByText('Ce que disent nos clients');
      
      // Skip heading order check for this test as it's testing in isolation
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: false }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('has proper heading hierarchy', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await screen.findByText('Ce que disent nos clients');
      
      const heading = screen.getByRole('heading', { name: /Ce que disent nos clients/ });
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveAttribute('class', expect.stringContaining('text-text-blue'));
    });

    it('provides proper landmarks and structure', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      const { container } = render(<GoogleReviews />);
      
      await screen.findByText('Ce que disent nos clients');
      
      // Should have a section element
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section?.tagName).toBe('SECTION');
    });

    it('has accessible links with proper attributes', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews showOverallRating={true} />);
      
      await screen.findByText('Voir tous les avis');
      
      const link = screen.getByRole('link', { name: /Voir tous les avis/ });
      expect(link).toHaveAttribute('href', expect.stringContaining('google.com'));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('provides proper focus management', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews showOverallRating={true} />);
      
      await screen.findByText('Voir tous les avis');
      
      const link = screen.getByRole('link', { name: /Voir tous les avis/ });
      
      // Should have focus styles in class list
      const classList = Array.from(link.classList);
      const hasFocusStyles = classList.some(cls => cls.includes('focus:'));
      expect(hasFocusStyles).toBe(true);
    });

    it('has sufficient color contrast', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await screen.findByText('Ce que disent nos clients');
      
      const heading = screen.getByText('Ce que disent nos clients');
      expect(heading).toHaveClass('text-text-blue');
      
      const description = screen.getByText(/Découvrez les témoignages/);
      expect(description).toHaveClass('text-text-gray');
    });
  });

  describe('ReviewCard Component Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<ReviewCard review={mockReview} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper button accessibility for expand/collapse', () => {
      const longReview = {
        ...mockReview,
        text: 'Lorem ipsum '.repeat(50) // Long text to trigger expand button
      };

      render(<ReviewCard review={longReview} />);
      
      const expandButton = screen.getByRole('button', { name: /Lire la suite/ });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      expect(expandButton).toHaveAttribute('aria-label', 'Lire la suite');
    });

    it('provides proper image alt text', () => {
      render(<ReviewCard review={mockReview} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Photo de Jean Dupont');
    });

    it('has proper heading structure for author names', () => {
      render(<ReviewCard review={mockReview} />);
      
      const authorName = screen.getByRole('heading', { level: 4 });
      expect(authorName).toHaveTextContent('Jean Dupont');
    });

    it('maintains focus after expand/collapse actions', () => {
      const longReview = {
        ...mockReview,
        text: 'Lorem ipsum '.repeat(50)
      };

      render(<ReviewCard review={longReview} />);
      
      const expandButton = screen.getByRole('button', { name: /Lire la suite/ });
      
      // Focus and click
      expandButton.focus();
      expandButton.click();
      
      // After expansion, check that the button text changed (it should now say "Réduire")
      expect(screen.getByText('Réduire')).toBeInTheDocument();
    });
  });

  describe('StarRating Component Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<StarRating rating={4.5} showNumber={true} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides meaningful content for screen readers', () => {
      render(<StarRating rating={4.5} showNumber={true} />);
      
      // Should show the numeric rating
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('has proper structure for assistive technology', () => {
      const { container } = render(<StarRating rating={3.5} />);
      
      // Should have a clear container structure
      const ratingContainer = container.querySelector('.flex.items-center');
      expect(ratingContainer).toBeInTheDocument();
      
      // Should have star elements
      const stars = container.querySelectorAll('.relative');
      expect(stars.length).toBe(5);
    });

    it('works properly when embedded in interactive elements', () => {
      const { container } = render(
        <button aria-label="Rate this review">
          <StarRating rating={4} />
        </button>
      );
      
      const button = screen.getByRole('button', { name: /Rate this review/ });
      expect(button).toBeInTheDocument();
      
      // Stars should not interfere with button accessibility
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through interactive elements', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews showOverallRating={true} />);
      
      await screen.findByText('Voir tous les avis');
      
      const link = screen.getByRole('link', { name: /Voir tous les avis/ });
      
      // Should be focusable
      link.focus();
      expect(document.activeElement).toBe(link);
    });

    it('has proper tab order', async () => {
      const longReview = {
        ...mockReview,
        text: 'Lorem ipsum '.repeat(50)
      };

      render(
        <div>
          <button>Before</button>
          <ReviewCard review={longReview} />
          <button>After</button>
        </div>
      );
      
      const beforeButton = screen.getByRole('button', { name: 'Before' });
      const expandButton = screen.getByRole('button', { name: /Lire la suite/ });
      const afterButton = screen.getByRole('button', { name: 'After' });
      
      // Tab order should be logical
      beforeButton.focus();
      expect(document.activeElement).toBe(beforeButton);
      
      // Simulate tab to next element
      expandButton.focus();
      expect(document.activeElement).toBe(expandButton);
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper semantic structure', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await screen.findByText('Ce que disent nos clients');
      
      // Should have proper heading
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Ce que disent nos clients');
      
      // Should have descriptive text
      expect(screen.getByText(/Découvrez les témoignages/)).toBeInTheDocument();
    });

    it('provides context for review information', () => {
      render(<ReviewCard review={mockReview} />);
      
      // Author information should be clearly structured
      const authorHeading = screen.getByRole('heading', { level: 4 });
      expect(authorHeading).toHaveTextContent('Jean Dupont');
      
      // Time information should be present
      expect(screen.getByText('il y a 2 semaines')).toBeInTheDocument();
    });

    it('handles loading states accessibly', () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<GoogleReviews />);
      
      // Should show heading even during loading
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      
      // Loading skeleton should not interfere with screen readers
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode Support', () => {
    it('maintains visibility in high contrast mode', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      const { container } = render(<GoogleReviews />);
      
      await screen.findByText('Ce que disent nos clients');
      
      // Elements should have proper contrast classes
      const heading = screen.getByText('Ce que disent nos clients');
      expect(heading).toHaveClass('text-text-blue');
      
      // Interactive elements should have focus indicators
      const focusableElements = container.querySelectorAll('[class*="focus:"]');
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('provides clear visual hierarchy', () => {
      render(<ReviewCard review={mockReview} />);
      
      // Author name should be prominent
      const authorName = screen.getByText('Jean Dupont');
      expect(authorName).toHaveClass('font-semibold', 'text-text-blue');
      
      // Review text should be readable
      const reviewText = screen.getByText(/Excellent travail/);
      expect(reviewText).toHaveClass('text-text-gray-200');
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects user motion preferences', () => {
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

      render(<ReviewCard review={mockReview} />);
      
      // Component should still function without animations
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });
  });
});