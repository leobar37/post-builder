import { getEventRepository } from '../db/repositories/event.repository.js';
import { getEventBus } from '../core/events/bus.js';
import type { Event, EventType, EventSource, SSEEvent } from '../types/index.js';

export interface EmitEvent {
  video_id?: string;
  session_id?: string;
  type: EventType;
  source: EventSource;
  data?: Record<string, unknown>;
}

/**
 * EventService - Bridge between event bus, database, and SSE
 *
 * Responsibilities:
 * - Persist events to database
 * - Emit events to bus for real-time subscribers
 * - Provide AsyncIterable adapter for SSE streaming
 */
export class EventService {
  private eventBus = getEventBus();

  /**
   * Emit an event: persist to DB + publish to bus for SSE
   */
  private getRepo() {
    return getEventRepository();
  }

  emit(event: EmitEvent): Event {
    // 1. Persist to database
    const dbEvent = this.getRepo().create({
      video_id: event.video_id,
      session_id: event.session_id,
      type: event.type,
      source: event.source,
      data: event.data,
    });

    // 2. Publish to bus for real-time subscribers
    if (event.video_id) {
      this.eventBus.emit(
        `video:${event.video_id}`,
        {
          type: event.type,
          source: event.source,
          data: event.data,
          timestamp: new Date().toISOString(),
        },
        event.source
      );
    }

    return dbEvent;
  }

  /**
   * Subscribe to events for a specific videoId
   * Returns AsyncIterable for SSE streaming
   */
  subscribe(videoId: string): AsyncIterable<SSEEvent> {
    const eventType = `video:${videoId}`;

    return {
      [Symbol.asyncIterator](): AsyncIterator<SSEEvent> {
        const queue: SSEEvent[] = [];
        let resolveNext: ((value: IteratorResult<SSEEvent>) => void) | null = null;
        let done = false;

        // Subscribe to event bus
        const subscription = getEventBus().on<SSEEvent>(eventType, (event) => {
          if (done) return;

          const sseEvent: SSEEvent = {
            type: event.payload.type,
            source: event.payload.source,
            data: event.payload.data,
            timestamp: event.payload.timestamp,
          };

          if (resolveNext) {
            resolveNext({ value: sseEvent, done: false });
            resolveNext = null;
          } else {
            queue.push(sseEvent);
          }
        });

        return {
          async next(): Promise<IteratorResult<SSEEvent>> {
            if (queue.length > 0) {
              return { value: queue.shift()!, done: false };
            }

            if (done) {
              return { value: undefined as any, done: true };
            }

            return new Promise((resolve) => {
              resolveNext = resolve;
            });
          },

          async return(): Promise<IteratorResult<SSEEvent>> {
            done = true;
            subscription.unsubscribe();
            return { value: undefined as any, done: true };
          },
        };
      },
    };
  }

  /**
   * Get historical events for a video
   */
  getHistory(videoId: string, limit = 100): Event[] {
    return this.getRepo().getByVideoId(videoId, limit);
  }

  /**
   * Unsubscribe from events (cleanup)
   */
  unsubscribe(videoId: string): void {
    this.eventBus.off(`video:${videoId}`);
  }
}

// Singleton instance
let instance: EventService | null = null;
export function getEventService(): EventService {
  if (!instance) instance = new EventService();
  return instance;
}
