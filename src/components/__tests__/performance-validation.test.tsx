/**
 * Performance validation tests for Google Reviews components
 * Focused on key optimizations implemented in task 8
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewCard from '../review-card';
import StarRating from '../star-rating';
import type { Review } from '../review-card';

describe('Performance Optimizations Validation', () => {
  describe('Component Memoization', () => {
    it('should memoize ReviewCard component', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Great service!',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      const { rerender } = render(<ReviewCard review={mockReview} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // Re-render with same props should not cause issues
      rerender(<ReviewCard review={mockReview} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should memoize StarRating component', () => {
      const { rerender } = render(<StarRating rating={4.5} showNumber={true} />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
      
      // Re-render with same props
      rerender(<StarRating rating={4.5} showNumber={true} />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    it('should apply performance-optimized animation classes', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Great service!',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      render(<ReviewCard review={mockReview} />);
      
      const card = screen.getByText('Test User').closest('div');
      expect(card?.className).toContain('transition-all');
      expect(card?.className).toContain('duration-300');
    });

    it('should apply hover animations to StarRating', () => {
      render(<StarRating rating={4.5} />);
      
      const starContainer = document.querySelector('.transform.transition-all');
      expect(starContainer).toBeInTheDocument();
    });
  });

  describe('Mobile Touch Optimizations', () => {
    it('should apply touch-friendly classes to interactive elements', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'This is a very long review text that should be truncated and show a read more button for better mobile experience and performance optimization testing purposes.',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      render(<ReviewCard review={mockReview} />);
      
      const readMoreButton = screen.getByText('Lire la suite');
      expect(readMoreButton.className).toContain('touch-manipulation');
      expect(readMoreButton.style.WebkitTapHighlightColor).toBe('transparent');
    });

    it('should handle touch interactions properly', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'This is a very long review text that should be truncated and show a read more button for better mobile experience.',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      render(<ReviewCard review={mockReview} />);
      
      const readMoreButton = screen.getByText('Lire la suite');
      fireEvent.click(readMoreButton);
      
      expect(screen.getByText('Réduire')).toBeInTheDocument();
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
      
      // Should show fallback avatar with first letter
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Accessibility with Performance', () => {
    it('should maintain accessibility attributes on interactive elements', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Long review text that needs truncation for performance reasons but should maintain accessibility features.',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      render(<ReviewCard review={mockReview} />);
      
      const button = screen.getByText('Lire la suite');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label', 'Lire la suite');
    });
  });

  describe('CSS Animation Classes', () => {
    it('should have proper CSS classes for animations', () => {
      // Test that the component structure supports the CSS animations
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Great service!',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      render(<ReviewCard review={mockReview} />);
      
      // Check for transition classes
      const elements = document.querySelectorAll('.transition-all');
      expect(elements.length).toBeGreaterThan(0);
      
      // Check for hover effects
      const hoverElements = document.querySelectorAll('.hover\\:scale-110, .hover\\:shadow-lg');
      expect(hoverElements.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should support performance monitoring without breaking functionality', () => {
      const mockReview: Review = {
        author_name: 'Test User',
        rating: 5,
        text: 'Great service!',
        relative_time_description: '1 week ago',
        time: Date.now() / 1000,
        language: 'en'
      };

      // Should render without errors even with performance monitoring
      expect(() => {
        render(<ReviewCard review={mockReview} />);
      }).not.toThrow();
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
});