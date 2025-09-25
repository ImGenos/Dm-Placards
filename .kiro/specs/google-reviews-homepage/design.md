# Design Document - Google Reviews Homepage Integration

## Overview

This design implements a Google reviews section for the homepage that fetches and displays authentic customer reviews from Google My Business. The solution uses the Google Places API with a React component architecture that integrates seamlessly with the existing Astro + React + Tailwind CSS stack.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Homepage      │    │  GoogleReviews   │    │  Google Places  │
│   (index.astro) │───▶│  Component       │───▶│  API            │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Local Storage   │
                       │  Cache           │
                       └──────────────────┘
```

### Technology Stack Integration

- **Frontend Framework**: Astro with React components
- **Styling**: Tailwind CSS (matching existing design system)
- **API Integration**: Google Places API (New Details endpoint)
- **Caching**: Browser localStorage with 24-hour TTL
- **State Management**: React hooks (useState, useEffect)
- **Error Handling**: Graceful fallbacks with skeleton loading

## Components and Interfaces

### 1. GoogleReviews Component

**Location**: `src/components/google-reviews.tsx`

```typescript
interface GoogleReviewsProps {
  placeId: string;
  maxReviews?: number;
  className?: string;
  showOverallRating?: boolean;
}

interface Review {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface PlaceDetails {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: Review[];
}
```

### 2. ReviewCard Component

**Location**: `src/components/review-card.tsx`

```typescript
interface ReviewCardProps {
  review: Review;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}
```

### 3. StarRating Component

**Location**: `src/components/star-rating.tsx`

```typescript
interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}
```

### 4. API Service

**Location**: `src/utils/google-places-api.ts`

```typescript
interface GooglePlacesService {
  getPlaceDetails(placeId: string): Promise<PlaceDetails>;
  getCachedReviews(placeId: string): PlaceDetails | null;
  setCachedReviews(placeId: string, data: PlaceDetails): void;
}
```

## Data Models

### Review Data Structure

```typescript
interface Review {
  author_name: string;           // Reviewer's display name
  author_url?: string;          // Optional Google+ profile URL
  language: string;             // Review language code
  profile_photo_url?: string;   // Reviewer's profile photo
  rating: number;               // 1-5 star rating
  relative_time_description: string; // "2 weeks ago"
  text: string;                 // Review content
  time: number;                 // Unix timestamp
}
```

### Cache Data Structure

```typescript
interface CachedReviewData {
  data: PlaceDetails;
  timestamp: number;
  expiresAt: number;
}
```

## Error Handling

### API Error Scenarios

1. **Network Failures**
   - Display cached reviews if available
   - Show "Reviews temporarily unavailable" message
   - Retry mechanism with exponential backoff

2. **API Rate Limiting**
   - Serve cached data immediately
   - Queue requests for later retry
   - Display last successful fetch timestamp

3. **Invalid Place ID**
   - Log error for debugging
   - Hide reviews section gracefully
   - No broken UI elements

4. **Malformed API Response**
   - Validate response structure
   - Filter out incomplete reviews
   - Display available valid reviews

### Fallback Strategy

```typescript
const fallbackReviews = [
  {
    author_name: "Client Satisfait",
    rating: 5,
    text: "Excellent travail sur notre dressing sur mesure. Très professionnel!",
    relative_time_description: "il y a 2 semaines"
  }
  // Additional fallback reviews...
];
```

## Testing Strategy

### Unit Tests

1. **Component Testing**
   - GoogleReviews component rendering
   - ReviewCard expand/collapse functionality
   - StarRating display accuracy
   - Props validation and defaults

2. **API Service Testing**
   - Mock Google Places API responses
   - Cache functionality validation
   - Error handling scenarios
   - Data transformation accuracy

3. **Utility Function Testing**
   - Text truncation logic
   - Date formatting functions
   - Rating calculation helpers

### Integration Tests

1. **API Integration**
   - Real Google Places API calls (development)
   - Response parsing and validation
   - Cache persistence across sessions

2. **UI Integration**
   - Reviews section placement on homepage
   - Responsive design validation
   - Loading states and transitions

### Performance Tests

1. **Loading Performance**
   - Initial page load impact
   - API response time monitoring
   - Cache hit/miss ratios

2. **Mobile Performance**
   - Touch interaction responsiveness
   - Scroll performance with reviews
   - Image loading optimization

## Implementation Details

### Google Places API Configuration

```typescript
// Environment variables needed
GOOGLE_PLACES_API_KEY=your_api_key_here
GOOGLE_PLACE_ID=your_business_place_id

// API endpoint
const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
```

### Styling Integration

The component will use the existing design system:

- **Colors**: Primary blues (#1e40af, #3b82f6), text grays (#6b7280, #374151)
- **Typography**: DM Serif Display for headings, Jost for body text
- **Spacing**: Consistent with existing sections (pt-[100px] lg:pt-[200px])
- **Responsive**: Mobile-first approach matching current breakpoints

### Homepage Integration

The reviews section will be inserted between the "Experience Section" and "Location Section" on the homepage:

```astro
<!-- Experience Section -->
<!-- ... existing code ... -->

<!-- Google Reviews Section -->
<GoogleReviews 
  placeId={import.meta.env.GOOGLE_PLACE_ID}
  maxReviews={6}
  className="lg:max-w-[1200px] px-12 xl:px-0 w-full mx-auto pt-[100px] lg:pt-[200px]"
  showOverallRating={true}
  client:load
/>

<!-- Location Section -->
<!-- ... existing code ... -->
```

### Security Considerations

1. **API Key Protection**
   - Server-side API calls to protect key
   - Rate limiting implementation
   - CORS configuration for domain restriction

2. **Content Sanitization**
   - HTML sanitization for review text
   - XSS prevention measures
   - Input validation for all user data

3. **Privacy Compliance**
   - GDPR compliance for EU users
   - User consent for external API calls
   - Data retention policy for cached reviews