import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GooglePlacesErrorType,
  createGooglePlacesError,
  retryWithBackoffAndJitter,
  withTimeout,
  validateNetworkConnectivity,
  isOnline,
  waitForOnline,
  getUserFriendlyErrorMessage,
  logGooglePlacesError
} from '../error-handling';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock fetch for network connectivity tests
global.fetch = vi.fn();

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createGooglePlacesError', () => {
    it('should create network error for fetch failures', () => {
      const error = new Error('Failed to fetch');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.userMessage).toContain('connexion réseau');
      expect(result.retryAfter).toBe(2000);
    });

    it('should create offline error when navigator is offline', () => {
      navigator.onLine = false;
      const error = new Error('Network error');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.OFFLINE_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.userMessage).toContain('hors ligne');
      expect(result.retryAfter).toBe(5000);
    });

    it('should create timeout error for timeout failures', () => {
      const error = new Error('Request timeout');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.TIMEOUT_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.userMessage).toContain('trop de temps');
      expect(result.retryAfter).toBe(3000);
    });

    it('should create rate limit error for 429 status', () => {
      const error = new Error('HTTP Error: 429 Too Many Requests');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.RATE_LIMIT_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.userMessage).toContain('requêtes simultanées');
      expect(result.retryAfter).toBe(5000);
    });

    it('should create API error for server errors', () => {
      const error = new Error('HTTP Error: 500 Internal Server Error');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.API_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.userMessage).toContain('temporairement indisponible');
      expect(result.retryAfter).toBe(10000);
    });

    it('should create invalid request error for 400 status', () => {
      const error = new Error('HTTP Error: 400 Bad Request');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.INVALID_REQUEST);
      expect(result.retryable).toBe(false);
      expect(result.userMessage).toContain('configuration');
    });

    it('should create not found error for 404 status', () => {
      const error = new Error('HTTP Error: 404 Not Found');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.NOT_FOUND);
      expect(result.retryable).toBe(false);
      expect(result.userMessage).toContain('non trouvé');
    });

    it('should handle API quota exceeded error', () => {
      const error = new Error('API Error: OVER_QUERY_LIMIT');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.RATE_LIMIT_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.userMessage).toContain('Limite de requêtes');
      expect(result.retryAfter).toBe(60000);
    });

    it('should handle API request denied error', () => {
      const error = new Error('API Error: REQUEST_DENIED');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.API_ERROR);
      expect(result.retryable).toBe(false);
      expect(result.userMessage).toContain('temporairement restreint');
    });

    it('should handle zero results error', () => {
      const error = new Error('API Error: ZERO_RESULTS');
      const result = createGooglePlacesError(error);

      expect(result.type).toBe(GooglePlacesErrorType.NOT_FOUND);
      expect(result.retryable).toBe(false);
      expect(result.userMessage).toContain('Aucun avis disponible');
    });

    it('should add context to error message', () => {
      const error = new Error('Test error');
      const result = createGooglePlacesError(error, 'Test context');

      expect(result.message).toContain('Test context');
    });
  });

  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      navigator.onLine = true;
      expect(isOnline()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      navigator.onLine = false;
      expect(isOnline()).toBe(false);
    });
  });

  describe('waitForOnline', () => {
    it('should resolve immediately if already online', async () => {
      navigator.onLine = true;
      const startTime = Date.now();
      await waitForOnline();
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should resolve when online event is fired', async () => {
      navigator.onLine = false;
      
      // Simulate coming online after 100ms
      setTimeout(() => {
        navigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      }, 100);

      const startTime = Date.now();
      await waitForOnline(1000);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(90);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should reject on timeout', async () => {
      navigator.onLine = false;
      
      await expect(waitForOnline(100)).rejects.toThrow('Timeout waiting for online connection');
    });
  });

  describe('withTimeout', () => {
    it('should resolve with promise result if within timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject with timeout error if promise takes too long', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('late'), 200));
      
      await expect(withTimeout(promise, 100)).rejects.toThrow('Request timeout after 100ms');
    });
  });

  describe('validateNetworkConnectivity', () => {
    it('should return true for successful connectivity check', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const result = await validateNetworkConnectivity();
      expect(result).toBe(true);
    });

    it('should return false for failed connectivity check', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await validateNetworkConnectivity();
      expect(result).toBe(false);
    });
  });

  describe('retryWithBackoffAndJitter', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoffAndJitter(mockFn, 3, 100);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce('success');
      
      const result = await retryWithBackoffAndJitter(mockFn, 3, 10);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('HTTP Error: 400 Bad Request'));
      
      await expect(retryWithBackoffAndJitter(mockFn, 3, 10)).rejects.toThrow('HTTP Error: 400');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should exhaust all retries and throw last error', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
      
      await expect(retryWithBackoffAndJitter(mockFn, 2, 10)).rejects.toThrow('Failed to fetch');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should wait for online connection when offline', async () => {
      navigator.onLine = false;
      const mockFn = vi.fn().mockResolvedValue('success');
      
      // Simulate coming online after 50ms
      setTimeout(() => {
        navigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      }, 50);

      const startTime = Date.now();
      const result = await retryWithBackoffAndJitter(mockFn, 3, 10);
      const endTime = Date.now();
      
      expect(result).toBe('success');
      expect(endTime - startTime).toBeGreaterThan(40);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return loading-specific message for network error', () => {
      const error = createGooglePlacesError(new Error('Network error'));
      const message = getUserFriendlyErrorMessage(error, 'loading');
      
      expect(message).toContain('Chargement des avis');
      expect(message).toContain('Vérifiez');
    });

    it('should return loading-specific message for offline error', () => {
      navigator.onLine = false;
      const error = createGooglePlacesError(new Error('Offline'));
      const message = getUserFriendlyErrorMessage(error, 'loading');
      
      expect(message).toContain('hors ligne');
      expect(message).toContain('reconnexion');
    });

    it('should return refreshing-specific message for rate limit', () => {
      const error = createGooglePlacesError(new Error('HTTP Error: 429'));
      const message = getUserFriendlyErrorMessage(error, 'refreshing');
      
      expect(message).toContain('Mise à jour reportée');
      expect(message).toContain('surcharge');
    });

    it('should return base message when no context provided', () => {
      const error = createGooglePlacesError(new Error('Test error'));
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toBe(error.userMessage);
    });
  });

  describe('logGooglePlacesError', () => {
    it('should log warning for network errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = createGooglePlacesError(new Error('Failed to fetch'));
      
      logGooglePlacesError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('NETWORK_ERROR'),
        expect.stringContaining('User Message'),
        error.originalError
      );
      
      consoleSpy.mockRestore();
    });

    it('should log error for API errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = createGooglePlacesError(new Error('API Error: REQUEST_DENIED'));
      
      logGooglePlacesError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API_ERROR'),
        expect.stringContaining('User Message'),
        error.originalError
      );
      
      consoleSpy.mockRestore();
    });
  });
});