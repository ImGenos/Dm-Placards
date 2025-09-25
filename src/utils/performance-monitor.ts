/**
 * Performance monitoring utilities for Google Reviews
 */

export interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private entries: Map<string, PerformanceEntry> = new Map();
  private readonly MAX_ENTRIES = 50;

  /**
   * Start timing a performance entry
   * @param name - Unique name for the performance entry
   * @param metadata - Optional metadata to store with the entry
   */
  start(name: string, metadata?: Record<string, any>): void {
    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.entries.set(name, entry);
  }

  /**
   * End timing a performance entry
   * @param name - Name of the performance entry to end
   * @param additionalMetadata - Additional metadata to merge
   */
  end(name: string, additionalMetadata?: Record<string, any>): PerformanceEntry | null {
    const entry = this.entries.get(name);
    if (!entry) {
      console.warn(`Performance entry '${name}' not found`);
      return null;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;
    
    if (additionalMetadata) {
      entry.metadata = { ...entry.metadata, ...additionalMetadata };
    }

    // Log performance in development
    if (import.meta.env.DEV) {
      console.debug(`Performance [${name}]: ${entry.duration.toFixed(2)}ms`, entry.metadata);
    }

    // Manage entries size
    this.manageEntriesSize();

    return entry;
  }

  /**
   * Get a performance entry by name
   * @param name - Name of the performance entry
   * @returns PerformanceEntry or null if not found
   */
  getEntry(name: string): PerformanceEntry | null {
    return this.entries.get(name) || null;
  }

  /**
   * Get all performance entries
   * @returns Array of all performance entries
   */
  getAllEntries(): PerformanceEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get performance statistics
   * @returns Performance statistics summary
   */
  getStats(): {
    totalEntries: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    completedEntries: number;
  } {
    const completedEntries = Array.from(this.entries.values()).filter(entry => entry.duration !== undefined);
    
    if (completedEntries.length === 0) {
      return {
        totalEntries: this.entries.size,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        completedEntries: 0
      };
    }

    const durations = completedEntries.map(entry => entry.duration!);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

    return {
      totalEntries: this.entries.size,
      averageDuration: totalDuration / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      completedEntries: completedEntries.length
    };
  }

  /**
   * Clear all performance entries
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Clear entries older than specified time
   * @param maxAge - Maximum age in milliseconds
   */
  clearOldEntries(maxAge: number = 5 * 60 * 1000): void {
    const now = performance.now();
    const cutoffTime = now - maxAge;

    for (const [name, entry] of this.entries) {
      if (entry.startTime < cutoffTime) {
        this.entries.delete(name);
      }
    }
  }

  /**
   * Manage entries size to prevent memory leaks
   */
  private manageEntriesSize(): void {
    if (this.entries.size > this.MAX_ENTRIES) {
      // Remove oldest entries
      const entries = Array.from(this.entries.entries());
      entries.sort((a, b) => a[1].startTime - b[1].startTime);
      
      const entriesToRemove = entries.slice(0, entries.length - this.MAX_ENTRIES);
      entriesToRemove.forEach(([name]) => {
        this.entries.delete(name);
      });
    }
  }

  /**
   * Measure a function execution time
   * @param name - Name for the performance entry
   * @param fn - Function to measure
   * @param metadata - Optional metadata
   * @returns Promise with the function result
   */
  async measure<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    
    try {
      const result = await fn();
      this.end(name, { success: true });
      return result;
    } catch (error) {
      this.end(name, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Create a performance mark for Web Performance API integration
   * @param name - Mark name
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(name);
      } catch (error) {
        console.warn('Failed to create performance mark:', error);
      }
    }
  }

  /**
   * Measure between two performance marks
   * @param name - Measure name
   * @param startMark - Start mark name
   * @param endMark - End mark name
   */
  measureBetweenMarks(name: string, startMark: string, endMark: string): void {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Failed to create performance measure:', error);
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export class for testing
export { PerformanceMonitor };

// Utility functions for common performance measurements
export const measureApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.measure(name, apiCall, metadata);
};

export const measureComponentRender = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (import.meta.env.DEV) {
      console.debug(`Component render [${componentName}]: ${duration.toFixed(2)}ms`);
    }
  };
};