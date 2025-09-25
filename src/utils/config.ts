/**
 * Configuration utilities for environment variables
 */

export interface GooglePlacesConfig {
  apiKey: string | null;
  placeId: string | null;
}

/**
 * Get Google Places API configuration from environment variables
 * @returns GooglePlacesConfig
 */
export function getGooglePlacesConfig(): GooglePlacesConfig {
  return {
    apiKey: import.meta.env.PUBLIC_GOOGLE_PLACES_API_KEY || 
            import.meta.env.GOOGLE_PLACES_API_KEY || 
            null,
    placeId: import.meta.env.PUBLIC_GOOGLE_PLACE_ID || 
             import.meta.env.GOOGLE_PLACE_ID || 
             null
  };
}

/**
 * Validate that required environment variables are set
 * @returns boolean
 */
export function validateGooglePlacesConfig(): boolean {
  const config = getGooglePlacesConfig();
  
  if (!config.apiKey) {
    console.warn('Google Places API key not configured. Set PUBLIC_GOOGLE_PLACES_API_KEY in your environment.');
    return false;
  }
  
  if (!config.placeId) {
    console.warn('Google Place ID not configured. Set PUBLIC_GOOGLE_PLACE_ID in your environment.');
    return false;
  }
  
  return true;
}

/**
 * Get the default Place ID for the business
 * @returns string | null
 */
export function getDefaultPlaceId(): string | null {
  return getGooglePlacesConfig().placeId;
}