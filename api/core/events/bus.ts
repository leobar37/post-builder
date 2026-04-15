import { EventEmitter } from 'events';
import { getLogger } from '../logger.js';
import type { Event, EventHandler, EventSubscription, EventMetadata } from './types.js';

/**
 * Event Bus - Pub/Sub system for decoupled communication
 * 
 * Usage:
 * ```typescript
 * const bus = new EventBus();
 * 
 * // Subscribe
 * const sub = bus.on('video:created', (event) => {
 *   console.log('Video created:', event.payload);
 * });
 * 
 * // Emit
 * bus.emit('video:created', { id: '123', title: 'My Video' }, 'my-service');
 * 
 * // Unsubscribe
 * sub.unsubscribe();
 * ```
 */
export class EventBus {
  private emitter = new EventEmitter();
  private logger = getLogger().child('EventBus');

  /**
   * Subscribe to an event type
   */
  on<T>(eventType: string, handler: EventHandler<T>): EventSubscription {
    const wrappedHandler = async (event: Event<T>) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Error in event handler for ${eventType}`, error as Error, {
          eventType,
          source: event.metadata.source,
        });
      }
    };

    this.emitter.on(eventType, wrappedHandler);
    this.logger.debug(`Subscribed to ${eventType}`);

    return {
      unsubscribe: () => {
        this.emitter.off(eventType, wrappedHandler);
        this.logger.debug(`Unsubscribed from ${eventType}`);
      },
    };
  }

  /**
   * Subscribe to an event type once
   */
  once<T>(eventType: string, handler: EventHandler<T>): void {
    const wrappedHandler = async (event: Event<T>) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Error in once handler for ${eventType}`, error as Error, {
          eventType,
          source: event.metadata.source,
        });
      }
    };

    this.emitter.once(eventType, wrappedHandler);
  }

  /**
   * Emit an event
   */
  emit<T>(
    eventType: string,
    payload: T,
    source: string,
    metadata?: Partial<Omit<EventMetadata, 'timestamp'>>
  ): void {
    const event: Event<T> = {
      type: eventType,
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        source,
        ...metadata,
      },
    };

    this.logger.debug(`Emitting ${eventType}`, { source });
    this.emitter.emit(eventType, event);
  }

  /**
   * Remove all listeners for an event type
   */
  off(eventType: string): void {
    this.emitter.removeAllListeners(eventType);
    this.logger.debug(`Removed all listeners for ${eventType}`);
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.emitter.removeAllListeners();
    this.logger.debug('Cleared all event listeners');
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }
}

// Singleton instance
let globalEventBus: EventBus | null = null;

/**
 * Get the global event bus instance
 */
export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

/**
 * Set the global event bus instance
 */
export function setEventBus(bus: EventBus): void {
  globalEventBus = bus;
}
