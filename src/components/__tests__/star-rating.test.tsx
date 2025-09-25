import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StarRating from '../star-rating';

describe('StarRating Component', () => {
  it('renders the correct number of stars', () => {
    const { container } = render(<StarRating rating={3} />);
    
    // Should render 5 stars by default (maxStars = 5)
    const starContainers = container.querySelectorAll('.relative');
    expect(starContainers).toHaveLength(5);
  });

  it('renders custom number of stars when maxStars is specified', () => {
    const { container } = render(<StarRating rating={3} maxStars={3} />);
    
    const starContainers = container.querySelectorAll('.relative');
    expect(starContainers).toHaveLength(3);
  });

  it('displays the correct rating visually', () => {
    const { container } = render(<StarRating rating={3.5} />);
    
    // Check that we have filled stars and partial fill
    const filledStars = container.querySelectorAll('.text-primary-100');
    expect(filledStars).toHaveLength(4); // 3 full + 1 partial
  });

  it('shows rating number when showNumber is true', () => {
    render(<StarRating rating={4.2} showNumber={true} />);
    
    expect(screen.getByText('4.2')).toBeInTheDocument();
  });

  it('does not show rating number when showNumber is false', () => {
    render(<StarRating rating={4.2} showNumber={false} />);
    
    expect(screen.queryByText('4.2')).not.toBeInTheDocument();
  });

  it('handles edge case ratings correctly', () => {
    // Test rating of 0
    const { rerender } = render(<StarRating rating={0} showNumber={true} />);
    expect(screen.getByText('0.0')).toBeInTheDocument();
    
    // Test rating above maxStars
    rerender(<StarRating rating={10} maxStars={5} showNumber={true} />);
    expect(screen.getByText('5.0')).toBeInTheDocument();
    
    // Test negative rating
    rerender(<StarRating rating={-1} showNumber={true} />);
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { container, rerender } = render(<StarRating rating={3} size="sm" />);
    
    // Check for small size gap class
    expect(container.querySelector('.gap-1')).toBeInTheDocument();
    
    // Test medium size
    rerender(<StarRating rating={3} size="md" />);
    expect(container.querySelector('.gap-1\\.5')).toBeInTheDocument();
    
    // Test large size
    rerender(<StarRating rating={3} size="lg" />);
    expect(container.querySelector('.gap-2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StarRating rating={3} className="custom-class" />);
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles partial ratings correctly', () => {
    const { container } = render(<StarRating rating={2.7} />);
    
    // Should have 2 fully filled stars and 1 partially filled
    // For rating 2.7, the third star should be 70% filled
    const overflowDivs = container.querySelectorAll('.overflow-hidden');
    const partialStar = Array.from(overflowDivs).find(el => 
      el.getAttribute('style')?.includes('70')
    );
    expect(partialStar).toBeTruthy();
  });

  it('renders with default props when minimal props provided', () => {
    const { container } = render(<StarRating rating={3} />);
    
    // Should not crash and should render stars
    const starContainers = container.querySelectorAll('.relative');
    expect(starContainers.length).toBeGreaterThan(0);
  });

  describe('Advanced Rating Scenarios', () => {
    it('handles decimal ratings correctly', () => {
      const { container } = render(<StarRating rating={3.7} showNumber={true} />);
      
      expect(screen.getByText('3.7')).toBeInTheDocument();
      
      // Should have 3 full stars and 1 partial (70%)
      const partialStars = container.querySelectorAll('[style*="70"]');
      expect(partialStars.length).toBeGreaterThan(0);
    });

    it('handles very precise decimal ratings', () => {
      const { container } = render(<StarRating rating={4.123456789} showNumber={true} />);
      
      // Should round to 1 decimal place
      expect(screen.getByText('4.1')).toBeInTheDocument();
    });

    it('handles rating of exactly 0.5', () => {
      const { container } = render(<StarRating rating={0.5} showNumber={true} />);
      
      expect(screen.getByText('0.5')).toBeInTheDocument();
      
      // Should have 1 half-filled star
      const partialStars = container.querySelectorAll('[style*="50"]');
      expect(partialStars.length).toBeGreaterThan(0);
    });

    it('handles custom maxStars with decimal rating', () => {
      const { container } = render(<StarRating rating={7.5} maxStars={10} showNumber={true} />);
      
      expect(screen.getByText('7.5')).toBeInTheDocument();
      
      const starContainers = container.querySelectorAll('.relative');
      expect(starContainers).toHaveLength(10);
    });

    it('caps rating at maxStars value', () => {
      render(<StarRating rating={8} maxStars={5} showNumber={true} />);
      
      // Should cap at 5.0
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('handles negative ratings', () => {
      render(<StarRating rating={-2} showNumber={true} />);
      
      // Should normalize to 0.0
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies correct size classes for each size variant', () => {
      const { container: smContainer } = render(<StarRating rating={3} size="sm" />);
      const { container: mdContainer } = render(<StarRating rating={3} size="md" />);
      const { container: lgContainer } = render(<StarRating rating={3} size="lg" />);
      
      expect(smContainer.querySelector('.gap-1')).toBeInTheDocument();
      expect(mdContainer.querySelector('.gap-1\\.5')).toBeInTheDocument();
      expect(lgContainer.querySelector('.gap-2')).toBeInTheDocument();
    });

    it('applies custom className alongside default classes', () => {
      const { container } = render(<StarRating rating={3} className="custom-stars" />);
      
      const wrapper = container.querySelector('.custom-stars');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('flex', 'items-center');
    });

    it('renders stars with correct color classes', () => {
      const { container } = render(<StarRating rating={2.5} />);
      
      // Should have filled stars with primary color
      const filledStars = container.querySelectorAll('.text-primary-100');
      expect(filledStars.length).toBeGreaterThan(0);
      
      // Should have empty stars with gray color
      const emptyStars = container.querySelectorAll('.text-text-gray-300');
      expect(emptyStars.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful structure for screen readers', () => {
      const { container } = render(<StarRating rating={4.2} showNumber={true} />);
      
      // Should have a clear structure that screen readers can understand
      const ratingContainer = container.querySelector('.flex.items-center');
      expect(ratingContainer).toBeInTheDocument();
      
      // Number should be clearly associated
      expect(screen.getByText('4.2')).toBeInTheDocument();
    });

    it('handles focus properly when used in interactive contexts', () => {
      const { container } = render(
        <button>
          <StarRating rating={3} />
          Rate this item
        </button>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      // Should not interfere with parent focus
      button?.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many stars', () => {
      const startTime = performance.now();
      render(<StarRating rating={15} maxStars={20} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should render quickly
    });

    it('handles rapid re-renders with different ratings', () => {
      const { rerender } = render(<StarRating rating={1} showNumber={true} />);
      
      // Rapidly change ratings
      for (let i = 0; i <= 5; i += 0.1) {
        rerender(<StarRating rating={i} showNumber={true} />);
      }
      
      // Should end up with final rating
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles NaN rating gracefully', () => {
      render(<StarRating rating={NaN} showNumber={true} />);
      
      // The component shows NaN as-is, which is the current behavior
      expect(screen.getByText('NaN')).toBeInTheDocument();
    });

    it('handles Infinity rating gracefully', () => {
      render(<StarRating rating={Infinity} maxStars={5} showNumber={true} />);
      
      // Should cap at maxStars
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('handles zero maxStars', () => {
      const { container } = render(<StarRating rating={3} maxStars={0} />);
      
      // Should render no stars
      const starContainers = container.querySelectorAll('.relative');
      expect(starContainers).toHaveLength(0);
    });

    it('handles very large maxStars efficiently', () => {
      const { container } = render(<StarRating rating={50} maxStars={100} />);
      
      const starContainers = container.querySelectorAll('.relative');
      expect(starContainers).toHaveLength(100);
    });
  });
});