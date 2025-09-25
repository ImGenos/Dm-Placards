# Google Places API Integration

This directory contains the Google Places API integration for fetching and displaying business reviews on the homepage.

## Files Overview

- `google-places-api.ts` - Main API service with caching and error handling
- `config.ts` - Configuration utilities for environment variables
- `error-handling.ts` - Error handling utilities and retry logic
- `google-places-example.ts` - Example usage and development utilities
- `__tests__/` - Test files for the API integration

## Setup

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Google Places API Configuration
PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
PUBLIC_GOOGLE_PLACE_ID=your_google_business_place_id_here
```

### 2. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Places API (New)" 
4. Go to "Credentials" and create an API key
5. Restrict the API key to your domain for security

### 3. Find Your Place ID

1. Use the [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. Search for your business
3. Copy the Place ID

## Usage

### Basic Usage

```typescript
import { googlePlacesService } from './utils/google-places-api';

// Fetch reviews for a specific place
const placeDetails = await googlePlacesService.getPlaceDetails('your-place-id');

console.log(placeDetails.name);
console.log(placeDetails.rating);
console.log(placeDetails.reviews);
```

### With Configuration Helper

```typescript
import { googlePlacesService } from './utils/google-places-api';
import { getDefaultPlaceId } from './utils/config';

// Use the configured place ID
const placeId = getDefaultPlaceId();
if (placeId) {
  const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
}
```

## Features

### Caching
- Automatic 24-hour caching in localStorage
- Graceful fallback to expired cache on API errors
- Manual cache management methods

### Error Handling
- Comprehensive error types and handling
- Automatic retry with exponential backoff
- Fallback reviews when API is unavailable

### Review Filtering
- Only shows reviews with 4+ stars
- Sorts by most recent first
- Limits to 10 reviews maximum

### Fallback System
1. **Primary**: Fresh API data
2. **Secondary**: Valid cached data
3. **Tertiary**: Expired cached data (on API error)
4. **Fallback**: Hardcoded sample reviews

## API Response Structure

```typescript
interface PlaceDetails {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: Review[];
  place_id: string;
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
```

## Development

### Testing

Run tests with:
```bash
npm run test
```

Watch mode:
```bash
npm run test:watch
```

### Development Utilities

In the browser console, you can access development utilities:

```javascript
// Fetch and display reviews
await window.googlePlacesExample.fetchAndDisplayReviews();

// Check cache status
window.googlePlacesExample.checkCacheStatus();

// Clear cache
window.googlePlacesExample.clearAllCache();

// Direct access to service
window.googlePlacesExample.service.getCacheInfo();
```

## Security Considerations

1. **API Key Protection**: Use `PUBLIC_` prefix for client-side access, but consider server-side proxy for production
2. **Rate Limiting**: Built-in retry logic respects API rate limits
3. **Domain Restriction**: Restrict API key to your domain in Google Cloud Console
4. **Content Sanitization**: Always sanitize review content before displaying

## Troubleshooting

### Common Issues

1. **"API key not found"**
   - Check `.env` file exists and has correct variable names
   - Ensure variables start with `PUBLIC_` for client-side access

2. **"REQUEST_DENIED" error**
   - Verify API key is correct
   - Check that Places API (New) is enabled
   - Verify domain restrictions on API key

3. **"OVER_QUERY_LIMIT" error**
   - Check your Google Cloud billing account
   - Monitor API usage in Google Cloud Console

4. **No reviews showing**
   - Verify Place ID is correct
   - Check if business has reviews with 4+ stars
   - Look at browser console for error messages

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('google-places-debug', 'true');
```

This will provide detailed logging of API calls, cache operations, and error handling.