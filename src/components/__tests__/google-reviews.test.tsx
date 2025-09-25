import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GoogleReviews from '../google-reviews';
import { googlePlacesService } from '../../utils/google-places-api';

// Mock the google places service
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

// Mock the config
vi.mock('../../utils/config', () => ({
  getDefaultPlaceId: vi.fn(() => 'test-place-id')
}));

// Mock the performance monitor
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

// Mock error handling
vi.mock('../../utils/error-handling', () => ({
  createGooglePlacesError: vi.fn((error) => ({
    type: 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error',
    retryable: false
  })),
  getUserFriendlyErrorMessage: vi.fn(() => 'Chargement des avis en cours...'),
  isOnline: vi.fn(() => true)
}));

// Mock navigator.onLine with a proper mock
const mockNavigator = {
  onLine: true
};
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
});

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

describe('GoogleReviews Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigator.onLine = true;
  });

  it('renders loading state initially', () => {
    vi.mocked(googlePlacesService.getPlaceDetails).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<GoogleReviews />);
    
    expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders reviews when data is loaded', async () => {
    vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

    render(<GoogleReviews />);
    
    await waitFor(() => {
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('renders overall rating when showOverallRating is true', async () => {
    vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

    render(<GoogleReviews showOverallRating={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Basé sur 25 avis Google')).toBeInTheDocument();
      expect(screen.getByText('Voir tous les avis')).toBeInTheDocument();
    });
  });

  it('limits reviews to maxReviews prop', async () => {
    vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

    render(<GoogleReviews maxReviews={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('handles error gracefully by hiding section', async () => {
    vi.mocked(googlePlacesService.getPlaceDetails).mockRejectedValue(new Error('API Error'));

    const { container } = render(<GoogleReviews />);
    
    await waitFor(() => {
      // Component should return null and not render anything
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('hides section gracefully when there is an error and no cached data', async () => {
      const networkError = new Error('Failed to fetch');
      vi.mocked(googlePlacesService.getPlaceDetails).mockRejectedValue(networkError);

      const { container } = render(<GoogleReviews />);
      
      await waitFor(() => {
        // Component should return null and not render anything when there's an error and no data
        expect(container.firstChild).toBeNull();
      });
    });

    it('shows loading state initially', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<GoogleReviews />);
      
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      // Should show loading skeleton
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('handles missing place ID configuration', async () => {
      // Mock config to return undefined
      const { getDefaultPlaceId } = await import('../../utils/config');
      vi.mocked(getDefaultPlaceId).mockReturnValue(null as any);

      const { container } = render(<GoogleReviews />);
      
      await waitFor(() => {
        // Should not render anything when place ID is missing
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Component Props and Configuration', () => {
    beforeEach(() => {
      // Ensure fresh mocks for each test in this describe block
      vi.clearAllMocks();
    });

    it('uses provided placeId over default', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews placeId="custom-place-id" />);
      
      await waitFor(() => {
        expect(googlePlacesService.getPlaceDetails).toHaveBeenCalledWith('custom-place-id');
      });
    });

    it('applies custom className correctly', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      const { container } = render(<GoogleReviews className="custom-class" />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('hides overall rating when showOverallRating is false', async () => {
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews showOverallRating={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      expect(screen.queryByText('Basé sur 25 avis Google')).not.toBeInTheDocument();
      expect(screen.queryByText('Voir tous les avis')).not.toBeInTheDocument();
    });

    it('handles zero reviews gracefully', async () => {
      const emptyPlaceDetails = {
        ...mockPlaceDetails,
        reviews: []
      };
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(emptyPlaceDetails);

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Aucun avis disponible pour le moment.')).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('calls performance monitoring functions', async () => {
      const { performanceMonitor } = await import('../../utils/performance-monitor');
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      expect(performanceMonitor.start).toHaveBeenCalledWith('google-reviews-fetch', expect.any(Object));
      expect(performanceMonitor.end).toHaveBeenCalledWith('google-reviews-fetch', expect.any(Object));
    });

    it('logs performance stats in development mode', async () => {
      const originalEnv = import.meta.env.DEV;
      // @ts-ignore
      import.meta.env.DEV = true;
      
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Google Reviews Performance Stats:', expect.any(Object));
      expect(consoleSpy).toHaveBeenCalledWith('Cache Info:', expect.any(Object));
      
      consoleSpy.mockRestore();
      // @ts-ignore
      import.meta.env.DEV = originalEnv;
    });
  });

  describe('Cache Refresh Behavior', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('handles background cache refresh', async () => {
      vi.mocked(googlePlacesService.shouldRefreshCache).mockReturnValue(true);
      vi.mocked(googlePlacesService.getPlaceDetails).mockResolvedValue(mockPlaceDetails);

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      // Should call getPlaceDetails at least once
      expect(googlePlacesService.getPlaceDetails).toHaveBeenCalled();
    });

    it('handles background refresh failures gracefully', async () => {
      vi.mocked(googlePlacesService.shouldRefreshCache).mockReturnValue(true);
      vi.mocked(googlePlacesService.getPlaceDetails)
        .mockResolvedValueOnce(mockPlaceDetails)
        .mockRejectedValueOnce(new Error('Background refresh failed'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<GoogleReviews />);
      
      await waitFor(() => {
        expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      });

      // Should still render the component
      expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});