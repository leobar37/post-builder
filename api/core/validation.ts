/**
 * Validation utilities
 * Simplified version without Zod for now due to v4 API changes
 */

/**
 * Validate that a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Validate that a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Validate that a value is a positive integer
 */
export function isPositiveInt(value: unknown): value is number {
  return isNumber(value) && value > 0 && Number.isInteger(value);
}

/**
 * Validate that a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate that a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Validate UUID format
 */
export function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate context ID (kebab-case)
 */
export function isValidContextId(value: string): boolean {
  const contextIdRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return contextIdRegex.test(value) && value.length <= 100;
}

/**
 * Assert that a value is defined
 */
export function assertDefined<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`${name} is required`);
  }
  return value;
}
