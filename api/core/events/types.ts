/**
 * Base event interface
 */
export interface Event<T = unknown> {
  type: string;
  payload: T;
  metadata: EventMetadata;
}

/**
 * Event metadata
 */
export interface EventMetadata {
  timestamp: string;
  source: string;
  correlationId?: string;
  sessionId?: string;
  videoId?: string;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: Event<T>) => void | Promise<void>;

/**
 * Typed event handler for specific event types
 */
export type TypedEventHandler<TEvent extends Event> = (event: TEvent) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Create event metadata with defaults
 */
export function createEventMetadata(
  source: string,
  options?: { correlationId?: string; sessionId?: string; videoId?: string }
): EventMetadata {
  return {
    timestamp: new Date().toISOString(),
    source,
    ...options,
  };
}

/**
 * Create a typed event
 */
export function createEvent<T>(
  type: string,
  payload: T,
  source: string,
  metadata?: Partial<Omit<EventMetadata, 'timestamp'>>
): Event<T> {
  return {
    type,
    payload,
    metadata: createEventMetadata(source, metadata),
  };
}
