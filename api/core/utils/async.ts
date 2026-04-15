import { delay } from './time.js';

/**
 * Retry options
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: 'fixed' | 'exponential';
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Retry a function with backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 'exponential',
    maxDelayMs = 30000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      const waitMs = backoff === 'exponential'
        ? Math.min(delayMs * Math.pow(2, attempt - 1), maxDelayMs)
        : delayMs;

      await delay(waitMs);
    }
  }

  throw lastError!;
}

/**
 * Execute promise with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Run async function with cleanup guarantee
 */
export async function withCleanup<T>(
  fn: () => Promise<T>,
  cleanup: () => Promise<void> | void
): Promise<T> {
  try {
    return await fn();
  } finally {
    await cleanup();
  }
}

/**
 * Map with concurrency limit
 */
export async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const promise = fn(items[i], i).then(result => {
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}
