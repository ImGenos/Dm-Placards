import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor, performanceMonitor, measureApiCall, measureComponentRender } from '../performance-monitor';

// Mock performance.now()
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    mark: vi.fn(),
    measure: vi.fn()
  },
  writable: true
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    mockPerformanceNow.mockClear();
    vi.clearAllMocks();
  });

  describe('start and end', () => {
    it('should start and end a performance entry', () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(200);

      monitor.start('test-entry', { component: 'TestComponent' });
      const entry = monitor.end('test-entry', { success: true });

      expect(entry).toEqual({
        name: 'test-entry',
        startTime: 100,
        endTime: 200,
        duration: 100,
        metadata: {
          component: 'TestComponent',
          success: true
        }
      });
    });

    it('should return null when ending non-existent entry', () => {
      const entry = monitor.end('non-existent');
      expect(entry).toBeNull();
    });

    it('should handle metadata merging correctly', () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(200);

      monitor.start('test-entry', { initial: 'data' });
      const entry = monitor.end('test-entry', { additional: 'data' });

      expect(entry?.metadata).toEqual({
        initial: 'data',
        additional: 'data'
      });
    });
  });

  describe('getEntry and getAllEntries', () => {
    it('should retrieve a specific entry', () => {
      mockPerformanceNow.mockReturnValue(100);
      
      monitor.start('test-entry');
      const entry = monitor.getEntry('test-entry');

      expect(entry).toEqual({
        name: 'test-entry',
        startTime: 100
      });
    });

    it('should return null for non-existent entry', () => {
      const entry = monitor.getEntry('non-existent');
      expect(entry).toBeNull();
    });

    it('should return all entries', () => {
      mockPerformanceNow.mockReturnValue(100);
      
      monitor.start('entry1');
      monitor.start('entry2');
      
      const entries = monitor.getAllEntries();
      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.name)).toEqual(['entry1', 'entry2']);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      mockPerformanceNow
        .mockReturnValueOnce(100).mockReturnValueOnce(150) // entry1: 50ms
        .mockReturnValueOnce(200).mockReturnValueOnce(300); // entry2: 100ms

      monitor.start('entry1');
      monitor.end('entry1');
      monitor.start('entry2');
      monitor.end('entry2');

      const stats = monitor.getStats();
      expect(stats).toEqual({
        totalEntries: 2,
        averageDuration: 75,
        minDuration: 50,
        maxDuration: 100,
        completedEntries: 2
      });
    });

    it('should handle empty entries', () => {
      const stats = monitor.getStats();
      expect(stats).toEqual({
        totalEntries: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        completedEntries: 0
      });
    });

    it('should ignore incomplete entries in statistics', () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150).mockReturnValueOnce(200);

      monitor.start('incomplete');
      monitor.start('complete');
      monitor.end('complete');

      const stats = monitor.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.completedEntries).toBe(1);
      expect(stats.averageDuration).toBe(50);
    });
  });

  describe('clear and clearOldEntries', () => {
    it('should clear all entries', () => {
      mockPerformanceNow.mockReturnValue(100);
      
      monitor.start('entry1');
      monitor.start('entry2');
      monitor.clear();

      expect(monitor.getAllEntries()).toHaveLength(0);
    });

    it('should clear old entries based on age', () => {
      const now = 1000;
      const oldTime = 100;
      
      mockPerformanceNow.mockReturnValueOnce(oldTime).mockReturnValueOnce(now);

      monitor.start('old-entry');
      monitor.start('new-entry');
      
      // Mock performance.now for clearOldEntries to return current time
      mockPerformanceNow.mockReturnValue(now);
      
      // Clear entries older than 500ms (old-entry should be removed)
      monitor.clearOldEntries(500);

      const entries = monitor.getAllEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('new-entry');
    });
  });

  describe('measure', () => {
    it('should measure async function execution', async () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(200);

      const asyncFn = vi.fn().mockResolvedValue('result');
      const result = await monitor.measure('async-test', asyncFn, { type: 'api' });

      expect(result).toBe('result');
      expect(asyncFn).toHaveBeenCalled();

      const entry = monitor.getEntry('async-test');
      expect(entry?.duration).toBe(100);
      expect(entry?.metadata).toEqual({
        type: 'api',
        success: true
      });
    });

    it('should handle async function errors', async () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(200);

      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);

      await expect(monitor.measure('error-test', asyncFn)).rejects.toThrow('Test error');

      const entry = monitor.getEntry('error-test');
      expect(entry?.metadata).toEqual({
        success: false,
        error: 'Test error'
      });
    });
  });

  describe('Web Performance API integration', () => {
    it('should create performance marks', () => {
      monitor.mark('test-mark');
      expect(global.performance.mark).toHaveBeenCalledWith('test-mark');
    });

    it('should create performance measures', () => {
      monitor.measureBetweenMarks('test-measure', 'start-mark', 'end-mark');
      expect(global.performance.measure).toHaveBeenCalledWith('test-measure', 'start-mark', 'end-mark');
    });

    it('should handle Web Performance API errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock performance.mark to throw an error
      vi.mocked(global.performance.mark).mockImplementation(() => {
        throw new Error('Performance API error');
      });

      monitor.mark('failing-mark');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create performance mark:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Utility functions', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    mockPerformanceNow.mockClear();
  });

  describe('measureApiCall', () => {
    it('should measure API call performance', async () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(300);

      const apiCall = vi.fn().mockResolvedValue({ data: 'test' });
      const result = await measureApiCall('test-api', apiCall, { endpoint: '/test' });

      expect(result).toEqual({ data: 'test' });
      
      const entry = performanceMonitor.getEntry('test-api');
      expect(entry?.duration).toBe(200);
      expect(entry?.metadata).toEqual({
        endpoint: '/test',
        success: true
      });
    });
  });

  describe('measureComponentRender', () => {
    it('should measure component render time', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150);

      const endMeasurement = measureComponentRender('TestComponent');
      endMeasurement();

      expect(consoleSpy).toHaveBeenCalledWith('Component render [TestComponent]: 50.00ms');
      
      consoleSpy.mockRestore();
    });
  });
});