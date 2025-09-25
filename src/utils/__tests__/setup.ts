/**
 * Test setup file for vitest
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock import.meta.env
Object.defineProperty(globalThis, 'import.meta', {
  value: {
    env: {
      PUBLIC_GOOGLE_PLACES_API_KEY: 'test-api-key',
      PUBLIC_GOOGLE_PLACE_ID: 'test-place-id'
    }
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};