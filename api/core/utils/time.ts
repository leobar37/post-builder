/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format milliseconds to human readable string
 */
export function formatMs(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return formatDuration(ms / 1000);
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export function timeoutPromise<T>(promise: Promise<T>, ms: number, message = 'Operation timed out'): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]);
}

/**
 * Get current timestamp in ISO format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Calculate elapsed time between two timestamps
 */
export function elapsed(startTime: string): number {
  const start = new Date(startTime).getTime();
  const end = Date.now();
  return end - start;
}
