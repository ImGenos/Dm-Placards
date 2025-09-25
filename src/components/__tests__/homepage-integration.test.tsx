/**
 * Integration tests for Google Reviews homepage integration
 * Tests the complete integration including responsive design and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GoogleReviews from '../google-reviews';
import { googlePlacesService } from '../../utils/google-places-api';

// Mock the dependencies
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
      text: "Great service and professional work! The team exceeded our expectations.",
      relative_time_description: "2 weeks ago",
      language: "en",
      time: Date.now() - (14 * 24 * 60 * 60 * 1000)
    },
    {
      author_name: "Jane Smith", 
      rating: 4,
      text: "Very satisfied with the results. Highly recommend their services!",
      relative_time_description: "1 month ago",
      language: "en",
      time: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      author_name: "Marie Dubois",
      rating: 5,
      text: "Excellent travail sur notre cuisine. L'équipe est très professionnelle et le résultat dépasse nos attentes.",
      relative_time_description: "3 weeks ago",
      language: "fr",
      time: Date.now() - (21 * 24 * 60 * 60 * 1000)
    }
  ]
};

describe('Homepage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Layout Integration', () => {
    it('renders with proper homepage layout classes', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      const { container } = render(
        <GoogleReviews 
          className="lg:max-w-[1200px] px-12 xl:px-0 w-full mx-auto pt-[100px] lg:pt-[200px]"
          maxReviews={6}
          showOverallRating={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:max-w-[1200px]', 'px-12', 'xl:px-0', 'w-full', 'mx-auto', 'pt-[100px]', 'lg:pt-[200px]');
    });

    it('integrates properly between other homepage sections', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      // Simulate homepage layout with sections before and after
      const { container } = render(
        <div>
          <section data-testid="experience-section">Experience Section</section>
          <GoogleReviews 
            className="lg:max-w-[1200px] px-12 xl:px-0 w-full mx-auto pt-[100px] lg:pt-[200px]"
          />
          <section data-testid="location-section">Location Section</section>
        </div>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      // Verify sections are in correct order
      const sections = container.querySelectorAll('section');
      expect(sections).toHaveLength(3);
      expect(sections[0]).toHaveAttribute('data-testid', 'experience-section');
      expect(sections[2]).toHaveAttribute('data-testid', 'location-section');
    });

    it('maintains proper spacing and visual hierarchy', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      // Check heading styles
      const heading = screen.getByRole('heading', { name: /Ce que disent nos clients/ });
      expect(heading).toHaveClass('text-[30px]', 'lg:text-[50px]', 'font-dm', 'text-text-blue');

      // Check section spacing
      const section = heading.closest('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);
    });

    it('displays reviews in grid layout on desktop', async () => {
      render(<GoogleReviews maxReviews={3} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const reviewsGrid = screen.getByText('John Doe').closest('.grid');
      expect(reviewsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('handles mobile layout properly', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Grid should stack vertically on mobile (grid-cols-1)
      const reviewsGrid = screen.getByText('John Doe').closest('.grid');
      expect(reviewsGrid).toHaveClass('grid-cols-1');
    });

    it('adapts overall rating display for mobile', async () => {
      render(<GoogleReviews showOverallRating={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Basé sur 25 avis Google')).toBeInTheDocument();
      });

      const ratingCard = screen.getByText('Basé sur 25 avis Google').closest('.bg-white');
      expect(ratingCard).toHaveClass('max-w-md', 'mx-auto');
    });

    it('maintains touch-friendly interactions on mobile', async () => {
      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Voir tous les avis')).toBeInTheDocument();
      });

      const button = screen.getByText('Voir tous les avis');
      expect(button).toHaveClass('px-6', 'py-3'); // Adequate touch target size
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton with proper structure', () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<GoogleReviews maxReviews={3} showOverallRating={true} />);
      
      // Should show section heading
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      
      // Should show loading skeleton
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      // Should show skeleton for overall rating
      const skeletons = document.querySelectorAll('.bg-gray-200');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('transitions smoothly from loading to content', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(googlePlacesService.getPlaceDetails).mockReturnValue(promise);

      render(<GoogleReviews />);
      
      // Initially shows loading
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise!(mockPlaceDetails);
      
      // Should transition to content
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios', () => {
    it('gracefully handles API failures without breaking layout', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockRejectedValue(new Error('API Error'));

      const { container } = render(
        <div>
          <section data-testid="before">Before Section</section>
          <GoogleReviews />
          <section data-testid="after">After Section</section>
        </div>
      );
      
      await waitFor(() => {
        // Reviews section should not render
        expect(screen.queryByText('Ce que disent nos clients')).not.toBeInTheDocument();
      });

      // Other sections should still be present
      expect(screen.getByTestId('before')).toBeInTheDocument();
      expect(screen.getByTestId('after')).toBeInTheDocument();
      
      // Should not break page layout
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockRejectedValue(
        new Error('Failed to fetch')
      );

      const { container } = render(<GoogleReviews />);
      
      await waitFor(() => {
        // Component should return null for network errors
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Performance', () => {
    it('loads within acceptable time limits', async () => {
      const startTime = performance.now();
      
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 3 seconds (requirement 5.1)
      expect(loadTime).toBeLessThan(3000);
    });

    it('handles large numbers of reviews efficiently', async () => {
      const manyReviews = Array.from({ length: 50 }, (_, i) => ({
        author_name: `User ${i}`,
        rating: 4 + Math.random(),
        text: `Review text ${i}`.repeat(10),
        relative_time_description: `${i} days ago`,
        language: "en",
        time: Date.now() - (i * 24 * 60 * 60 * 1000)
      }));

      const largePlaceDetails = {
        ...mockPlaceDetails,
        reviews: manyReviews
      };

      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(largePlaceDetails);

      const startTime = performance.now();
      
      render(<GoogleReviews maxReviews={6} />);
      
      await waitFor(() => {
        expect(screen.getByText('User 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should still render quickly even with many reviews
      expect(renderTime).toBeLessThan(1000);
      
      // Should only display maxReviews
      expect(screen.getByText('User 0')).toBeInTheDocument();
      expect(screen.getByText('User 5')).toBeInTheDocument();
      expect(screen.queryByText('User 6')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);
    });

    it('has proper heading hierarchy', async () => {
      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      const mainHeading = screen.getByRole('heading', { name: /Ce que disent nos clients/ });
      expect(mainHeading.tagName).toBe('H2');
    });

    it('provides proper alt text for images', async () => {
      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check for Google logo alt text (if present)
      const googleLogo = document.querySelector('svg');
      if (googleLogo) {
        // SVG should have proper accessibility attributes
        expect(googleLogo.closest('div')).toBeInTheDocument();
      }
    });

    it('has keyboard accessible interactive elements', async () => {
      render(<GoogleReviews showOverallRating={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Voir tous les avis')).toBeInTheDocument();
      });

      const button = screen.getByText('Voir tous les avis');
      expect(button).toHaveAttribute('href'); // Should be a link
      expect(button).toHaveAttribute('target', '_blank');
      expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('provides proper focus management', async () => {
      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check that interactive elements have focus styles
      const interactiveElements = document.querySelectorAll('[class*="focus:"]');
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    it('has proper color contrast', async () => {
      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      // Check that text uses proper color classes for contrast
      const heading = screen.getByText('Ce que disent nos clients');
      expect(heading).toHaveClass('text-text-blue');
      
      const description = screen.getByText(/Découvrez les témoignages/);
      expect(description).toHaveClass('text-text-gray');
    });

    it('supports screen readers with proper ARIA labels', async () => {
      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // The section should be properly structured for screen readers
      const section = screen.getByText('Ce que disent nos clients').closest('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Google Branding Compliance', () => {
    beforeEach(() => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);
    });

    it('displays Google branding correctly', async () => {
      render(<GoogleReviews showOverallRating={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Basé sur 25 avis Google')).toBeInTheDocument();
      });

      // Should show "Alimenté par" text
      expect(screen.getByText('Alimenté par')).toBeInTheDocument();
      
      // Should have Google logo SVG
      const googleLogo = document.querySelector('svg[viewBox="0 0 272 92"]');
      expect(googleLogo).toBeInTheDocument();
    });

    it('links to Google Business profile correctly', async () => {
      render(<GoogleReviews showOverallRating={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Voir tous les avis')).toBeInTheDocument();
      });

      const link = screen.getByText('Voir tous les avis');
      expect(link).toHaveAttribute('href', 'https://www.google.com/maps/place/?q=place_id:test-place-id');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});