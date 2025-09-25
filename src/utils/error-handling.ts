/**
 * Error handling utilities for Google Places API integration
 */

export enum GooglePlacesErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GooglePlacesError {
  type: GooglePlacesErrorType;
  message: string;
  userMessage: string; // French user-friendly message
  originalError?: Error;
  retryable: boolean;
  retryAfter?: number; // Suggested retry delay in milliseconds
}

/**
 * Create a standardized error object for Google Places API errors
 * @param error - Original error
 * @param context - Additional context
 * @returns GooglePlacesError
 */
export function createGooglePlacesError(
  error: unknown, 
  context?: string
): GooglePlacesError {
  let errorType = GooglePlacesErrorType.UNKNOWN_ERROR;
  let message = 'An unknown error occurred';
  let userMessage = 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.';
  let retryable = false;
  let retryAfter: number | undefined;

  // Check if user is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    errorType = GooglePlacesErrorType.OFFLINE_ERROR;
    message = 'User is offline';
    userMessage = 'Vous êtes actuellement hors ligne. Vérifiez votre connexion internet.';
    retryable = true;
    retryAfter = 5000; // Retry after 5 seconds
  }
  else if (error instanceof Error) {
    message = error.message;

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
      errorType = GooglePlacesErrorType.NETWORK_ERROR;
      message = 'Network error occurred while fetching reviews';
      userMessage = 'Problème de connexion réseau. Vérification de votre connexion internet en cours...';
      retryable = true;
      retryAfter = 2000;
    }
    
    // Timeout errors
    else if (error.message.includes('timeout') || error.message.includes('aborted')) {
      errorType = GooglePlacesErrorType.TIMEOUT_ERROR;
      message = 'Request timeout';
      userMessage = 'La requête a pris trop de temps. Nouvelle tentative en cours...';
      retryable = true;
      retryAfter = 3000;
    }
    
    // HTTP errors
    else if (error.message.includes('HTTP Error: 429')) {
      errorType = GooglePlacesErrorType.RATE_LIMIT_ERROR;
      message = 'API rate limit exceeded';
      userMessage = 'Trop de requêtes simultanées. Nouvelle tentative dans quelques instants...';
      retryable = true;
      retryAfter = 5000;
    }
    
    else if (error.message.includes('HTTP Error: 400')) {
      errorType = GooglePlacesErrorType.INVALID_REQUEST;
      message = 'Invalid request to Google Places API';
      userMessage = 'Erreur de configuration. Les avis seront affichés dès que possible.';
      retryable = false;
    }
    
    else if (error.message.includes('HTTP Error: 404')) {
      errorType = GooglePlacesErrorType.NOT_FOUND;
      message = 'Place not found';
      userMessage = 'Établissement non trouvé. Affichage des avis de référence.';
      retryable = false;
    }
    
    else if (error.message.includes('HTTP Error: 500') || error.message.includes('HTTP Error: 502') || error.message.includes('HTTP Error: 503')) {
      errorType = GooglePlacesErrorType.API_ERROR;
      message = 'Google Places API server error';
      userMessage = 'Service temporairement indisponible. Nouvelle tentative automatique...';
      retryable = true;
      retryAfter = 10000;
    }
    
    // API status errors
    else if (error.message.includes('API Error: OVER_QUERY_LIMIT')) {
      errorType = GooglePlacesErrorType.RATE_LIMIT_ERROR;
      message = 'Google Places API quota exceeded';
      userMessage = 'Limite de requêtes atteinte. Les avis seront mis à jour prochainement.';
      retryable = true;
      retryAfter = 60000; // Retry after 1 minute
    }
    
    else if (error.message.includes('API Error: REQUEST_DENIED')) {
      errorType = GooglePlacesErrorType.API_ERROR;
      message = 'Google Places API request denied';
      userMessage = 'Accès au service temporairement restreint. Affichage des avis de référence.';
      retryable = false;
    }
    
    else if (error.message.includes('API Error: INVALID_REQUEST')) {
      errorType = GooglePlacesErrorType.INVALID_REQUEST;
      message = 'Invalid request parameters';
      userMessage = 'Erreur de configuration. Contactez le support si le problème persiste.';
      retryable = false;
    }
    
    else if (error.message.includes('API Error: ZERO_RESULTS')) {
      errorType = GooglePlacesErrorType.NOT_FOUND;
      message = 'No reviews found for this place';
      userMessage = 'Aucun avis disponible pour cet établissement actuellement.';
      retryable = false;
    }
    
    else if (error.message.includes('API Error')) {
      errorType = GooglePlacesErrorType.API_ERROR;
      message = 'Google Places API error';
      userMessage = 'Service d\'avis temporairement indisponible. Affichage des avis de référence.';
      retryable = true;
      retryAfter = 30000;
    }
  }

  if (context) {
    message = `${context}: ${message}`;
  }

  return {
    type: errorType,
    message,
    userMessage,
    originalError: error instanceof Error ? error : undefined,
    retryable,
    retryAfter
  };
}

/**
 * Retry mechanism with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise<T>
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const googleError = createGooglePlacesError(error);
      
      // Don't retry if error is not retryable
      if (!googleError.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, googleError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Log error with appropriate level based on error type
 * @param error - GooglePlacesError
 */
export function logGooglePlacesError(error: GooglePlacesError): void {
  const logMessage = `Google Places API Error [${error.type}]: ${error.message}`;
  const userMessage = `User Message: ${error.userMessage}`;
  
  switch (error.type) {
    case GooglePlacesErrorType.NETWORK_ERROR:
    case GooglePlacesErrorType.RATE_LIMIT_ERROR:
    case GooglePlacesErrorType.OFFLINE_ERROR:
    case GooglePlacesErrorType.TIMEOUT_ERROR:
      console.warn(logMessage, userMessage, error.originalError);
      break;
    
    case GooglePlacesErrorType.INVALID_REQUEST:
    case GooglePlacesErrorType.NOT_FOUND:
    case GooglePlacesErrorType.API_ERROR:
      console.error(logMessage, userMessage, error.originalError);
      break;
    
    default:
      console.error(logMessage, userMessage, error.originalError);
  }
}

/**
 * Check if the user is currently online
 * @returns boolean indicating online status
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true; // Assume online in server-side rendering
  }
  return navigator.onLine;
}

/**
 * Wait for the user to come back online
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when online or rejects on timeout
 */
export function waitForOnline(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      reject(new Error('Timeout waiting for online connection'));
    }, timeout);

    const onlineHandler = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onlineHandler);
      resolve();
    };

    window.addEventListener('online', onlineHandler);
  });
}

/**
 * Enhanced retry mechanism with exponential backoff and jitter
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Promise<T>
 */
export async function retryWithBackoffAndJitter<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if user is offline before attempting
      if (!isOnline()) {
        console.warn('User is offline, waiting for connection...');
        try {
          await waitForOnline(10000); // Wait up to 10 seconds for connection
        } catch (offlineError) {
          throw new Error('User is offline and connection timeout exceeded');
        }
      }

      return await fn();
    } catch (error) {
      lastError = error;
      
      const googleError = createGooglePlacesError(error);
      
      // Don't retry if error is not retryable
      if (!googleError.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.1 * exponentialDelay; // Add up to 10% jitter
      const finalDelay = Math.min(exponentialDelay + jitter, maxDelay);
      
      // Use suggested retry delay if available
      const delay = googleError.retryAfter || finalDelay;
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, googleError.userMessage);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a timeout wrapper for fetch requests
 * @param promise - Promise to wrap with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects on timeout
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Validate network connectivity by attempting a simple request
 * @returns Promise<boolean> indicating if network is accessible
 */
export async function validateNetworkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a small resource to test connectivity
    const response = await withTimeout(
      fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      }),
      5000
    );
    return true;
  } catch (error) {
    console.warn('Network connectivity check failed:', error);
    return false;
  }
}

/**
 * Get user-friendly error message based on error type and context
 * @param error - GooglePlacesError
 * @param context - Additional context (e.g., 'loading', 'refreshing')
 * @returns Localized user message
 */
export function getUserFriendlyErrorMessage(error: GooglePlacesError, context?: string): string {
  const baseMessage = error.userMessage;
  
  if (context === 'loading') {
    switch (error.type) {
      case GooglePlacesErrorType.NETWORK_ERROR:
        return 'Chargement des avis en cours... Vérifiez votre connexion.';
      case GooglePlacesErrorType.OFFLINE_ERROR:
        return 'Mode hors ligne détecté. Les avis seront chargés dès la reconnexion.';
      case GooglePlacesErrorType.TIMEOUT_ERROR:
        return 'Chargement plus long que prévu... Patientez quelques instants.';
      default:
        return 'Chargement des avis en cours...';
    }
  }
  
  if (context === 'refreshing') {
    switch (error.type) {
      case GooglePlacesErrorType.RATE_LIMIT_ERROR:
        return 'Mise à jour reportée pour éviter la surcharge du service.';
      case GooglePlacesErrorType.NETWORK_ERROR:
        return 'Mise à jour impossible actuellement. Nouvelle tentative prochainement.';
      default:
        return 'Mise à jour temporairement indisponible.';
    }
  }
  
  return baseMessage;
}