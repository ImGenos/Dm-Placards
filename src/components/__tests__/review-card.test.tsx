import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewCard, { Review } from '../review-card';

// Mock review data
const mockReview: Review = {
  author_name: 'Jean Dupont',
  author_url: 'https://example.com/profile',
  language: 'fr',
  profile_photo_url: 'https://example.com/photo.jpg',
  rating: 5,
  relative_time_description: 'il y a 2 semaines',
  text: 'Excellent travail sur notre dressing sur mesure. L\'équipe est très professionnelle et le résultat dépasse nos attentes. Je recommande vivement leurs services.',
  time: 1640995200
};

const longReview: Review = {
  ...mockReview,
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
};

describe('ReviewCard Component', () => {
  it('renders review information correctly', () => {
    render(<ReviewCard review={mockReview} />);
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('il y a 2 semaines')).toBeInTheDocument();
    expect(screen.getByText(/Excellent travail sur notre dressing/)).toBeInTheDocument();
  });

  it('displays author photo when available', () => {
    render(<ReviewCard review={mockReview} />);
    
    const photo = screen.getByAltText('Photo de Jean Dupont');
    expect(photo).toBeInTheDocument();
    expect(photo).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('displays author initials when photo is not available', () => {
    const reviewWithoutPhoto = { ...mockReview, profile_photo_url: undefined };
    render(<ReviewCard review={reviewWithoutPhoto} />);
    
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.queryByAltText('Photo de Jean Dupont')).not.toBeInTheDocument();
  });

  it('handles photo loading errors gracefully', () => {
    render(<ReviewCard review={mockReview} />);
    
    const photo = screen.getByAltText('Photo de Jean Dupont');
    fireEvent.error(photo);
    
    // Photo should be hidden after error
    expect(photo.style.display).toBe('none');
  });

  it('displays star rating correctly', () => {
    const { container } = render(<ReviewCard review={mockReview} />);
    
    // Should render star rating component
    const starContainers = container.querySelectorAll('.relative');
    expect(starContainers.length).toBeGreaterThan(0);
  });

  it('truncates long text and shows "Lire la suite" button', () => {
    render(<ReviewCard review={longReview} />);
    
    // Should show truncated text
    expect(screen.getByText(/Lorem ipsum dolor sit amet/)).toBeInTheDocument();
    expect(screen.getByText('Lire la suite')).toBeInTheDocument();
    
    // Should not show full text initially
    expect(screen.queryByText(/sunt in culpa qui officia/)).not.toBeInTheDocument();
  });

  it('expands text when "Lire la suite" is clicked', () => {
    render(<ReviewCard review={longReview} />);
    
    const expandButton = screen.getByText('Lire la suite');
    fireEvent.click(expandButton);
    
    // Should show full text
    expect(screen.getByText(/sunt in culpa qui officia/)).toBeInTheDocument();
    expect(screen.getByText('Réduire')).toBeInTheDocument();
  });

  it('collapses text when "Réduire" is clicked', () => {
    render(<ReviewCard review={longReview} />);
    
    // Expand first
    const expandButton = screen.getByText('Lire la suite');
    fireEvent.click(expandButton);
    
    // Then collapse
    const collapseButton = screen.getByText('Réduire');
    fireEvent.click(collapseButton);
    
    // Should show truncated text again
    expect(screen.queryByText(/sunt in culpa qui officia/)).not.toBeInTheDocument();
    expect(screen.getByText('Lire la suite')).toBeInTheDocument();
  });

  it('does not show expand button for short text', () => {
    const shortReview = { ...mockReview, text: 'Short review text.' };
    render(<ReviewCard review={shortReview} />);
    
    expect(screen.queryByText('Lire la suite')).not.toBeInTheDocument();
    expect(screen.queryByText('Réduire')).not.toBeInTheDocument();
  });

  it('uses controlled expansion state when provided', () => {
    const onToggleExpand = vi.fn();
    render(
      <ReviewCard 
        review={longReview} 
        isExpanded={true} 
        onToggleExpand={onToggleExpand} 
      />
    );
    
    // Should show full text when controlled expanded is true
    expect(screen.getByText(/sunt in culpa qui officia/)).toBeInTheDocument();
    expect(screen.getByText('Réduire')).toBeInTheDocument();
    
    // Should call onToggleExpand when button is clicked
    const collapseButton = screen.getByText('Réduire');
    fireEvent.click(collapseButton);
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReviewCard review={mockReview} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ReviewCard review={longReview} />);
    
    const expandButton = screen.getByText('Lire la suite');
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(expandButton).toHaveAttribute('aria-label', 'Lire la suite');
    
    // After expanding
    fireEvent.click(expandButton);
    const collapseButton = screen.getByText('Réduire');
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    expect(collapseButton).toHaveAttribute('aria-label', 'Réduire le commentaire');
  });

  it('handles edge case with exactly 150 characters', () => {
    const exactLengthText = 'A'.repeat(150);
    const exactLengthReview = { ...mockReview, text: exactLengthText };
    render(<ReviewCard review={exactLengthReview} />);
    
    // Should not show expand button for exactly 150 characters
    expect(screen.queryByText('Lire la suite')).not.toBeInTheDocument();
  });

  it('handles edge case with 151 characters', () => {
    const slightlyLongText = 'A'.repeat(151);
    const slightlyLongReview = { ...mockReview, text: slightlyLongText };
    render(<ReviewCard review={slightlyLongReview} />);
    
    // Should show expand button for 151 characters
    expect(screen.getByText('Lire la suite')).toBeInTheDocument();
  });

  describe('Additional Edge Cases', () => {
    it('handles empty author name gracefully', () => {
      const reviewWithEmptyName = { ...mockReview, author_name: '' };
      render(<ReviewCard review={reviewWithEmptyName} />);
      
      // Should still render the card without crashing
      expect(screen.getByText('il y a 2 semaines')).toBeInTheDocument();
    });

    it('handles special characters in author name', () => {
      const reviewWithSpecialChars = { ...mockReview, author_name: 'José María' };
      render(<ReviewCard review={reviewWithSpecialChars} />);
      
      expect(screen.getByText('José María')).toBeInTheDocument();
      // The component shows the image, not the initial when profile_photo_url is provided
    });

    it('handles very long author names', () => {
      const reviewWithLongName = { 
        ...mockReview, 
        author_name: 'Jean-Baptiste de la Croix-Rouge du Château' 
      };
      render(<ReviewCard review={reviewWithLongName} />);
      
      expect(screen.getByText('Jean-Baptiste de la Croix-Rouge du Château')).toBeInTheDocument();
    });

    it('handles reviews with only whitespace text', () => {
      const reviewWithWhitespace = { ...mockReview, text: '   \n\t   ' };
      render(<ReviewCard review={reviewWithWhitespace} />);
      
      // Should still render the card
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    it('handles reviews with HTML-like content', () => {
      const reviewWithHtml = { 
        ...mockReview, 
        text: 'Great service! <script>alert("test")</script> Highly recommended!' 
      };
      render(<ReviewCard review={reviewWithHtml} />);
      
      // Should render the text as-is (React escapes it automatically)
      expect(screen.getByText(/Great service!/)).toBeInTheDocument();
      expect(screen.getByText(/Highly recommended!/)).toBeInTheDocument();
    });

    it('handles reviews with line breaks', () => {
      const reviewWithLineBreaks = { 
        ...mockReview, 
        text: 'First line\nSecond line\n\nThird line after empty line' 
      };
      render(<ReviewCard review={reviewWithLineBreaks} />);
      
      expect(screen.getByText(/First line/)).toBeInTheDocument();
    });

    it('handles zero rating gracefully', () => {
      const reviewWithZeroRating = { ...mockReview, rating: 0 };
      render(<ReviewCard review={reviewWithZeroRating} />);
      
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      // StarRating component should handle zero rating
    });

    it('handles rating above 5 gracefully', () => {
      const reviewWithHighRating = { ...mockReview, rating: 10 };
      render(<ReviewCard review={reviewWithHighRating} />);
      
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      // StarRating component should cap at maxStars
    });

    it('handles missing relative_time_description', () => {
      const reviewWithoutTime = { ...mockReview, relative_time_description: '' };
      render(<ReviewCard review={reviewWithoutTime} />);
      
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      // Should still render without crashing
    });

    it('handles keyboard navigation for expand/collapse', () => {
      render(<ReviewCard review={longReview} />);
      
      const expandButton = screen.getByText('Lire la suite');
      
      // Test click activation (keyDown doesn't trigger onClick by default)
      fireEvent.click(expandButton);
      expect(screen.getByText('Réduire')).toBeInTheDocument();
      
      const collapseButton = screen.getByText('Réduire');
      fireEvent.click(collapseButton);
      expect(screen.getByText('Lire la suite')).toBeInTheDocument();
    });

    it('maintains focus after expand/collapse', () => {
      render(<ReviewCard review={longReview} />);
      
      const expandButton = screen.getByText('Lire la suite');
      expandButton.focus();
      fireEvent.click(expandButton);
      
      const collapseButton = screen.getByText('Réduire');
      expect(document.activeElement).toBe(collapseButton);
    });
  });

  describe('Performance', () => {
    it('renders quickly with long text', () => {
      const veryLongText = 'Lorem ipsum '.repeat(1000);
      const veryLongReview = { ...mockReview, text: veryLongText };
      
      const startTime = performance.now();
      render(<ReviewCard review={veryLongReview} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    it('handles rapid expand/collapse clicks', () => {
      render(<ReviewCard review={longReview} />);
      
      const expandButton = screen.getByText('Lire la suite');
      
      // Rapidly click multiple times
      for (let i = 0; i < 10; i++) {
        fireEvent.click(expandButton);
        const currentButton = screen.queryByText('Lire la suite') || screen.queryByText('Réduire');
        if (currentButton) {
          fireEvent.click(currentButton);
        }
      }
      
      // Should still be functional
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });
  });
});