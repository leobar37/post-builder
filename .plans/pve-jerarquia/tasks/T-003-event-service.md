# T-003 — EventService + SSE helper

## Objetivo

Crear `api/services/event.service.ts` que sirva como puente entre el event bus existente (`api/core/events/bus.ts`) y la persistencia en DB, más el helper SSE.

## Depende de

T-001 (types)

## Archivos a tocar

**Nuevo:** `api/services/event.service.ts`

## Contexto

El event bus existe en `api/core/events/bus.ts` con:
- `emit(videoId: string, event: AppEvent)` — publica evento
- `subscribe(videoId: string): AsyncIterable<AppEvent>` — subscribe
- `unsubscribe(videoId: string)` — cleanup

Solo hay que conectarlo a la tabla `events` y envolverlo en un service.

## Implementación

```typescript
// api/services/event.service.ts
import { EventQueries, Event } from '../db/client';
import { eventBus } from '../core/events/bus';
import type { EventType, EventSource } from '../types';

export interface EmitEvent {
  video_id?: string;
  session_id?: string;
  type: EventType;
  source: EventSource;
  data?: Record<string, unknown>;
}

export class EventService {
  /**
   * Emite un evento: lo persiste en DB + lo publica en el bus para SSE
   */
  emit(event: EmitEvent): Event {
    // 1. Persistir en DB
    const dbEvent = EventQueries.create({
      video_id: event.video_id,
      session_id: event.session_id,
      type: event.type,
      source: event.source,
      data: event.data,
    });

    // 2. Publicar en bus para subscribers SSE
    if (event.video_id) {
      eventBus.emit(event.video_id, {
        type: event.type,
        source: event.source,
        data: event.data,
        timestamp: new Date().toISOString(),
      });
    }

    return dbEvent;
  }

  /**
   * Subscribe a un videoId para recibir eventos en tiempo real
   */
  subscribe(videoId: string) {
    return eventBus.subscribe(videoId);
  }

  /**
   * Cleanup de subscription
   */
  unsubscribe(videoId: string) {
    eventBus.unsubscribe(videoId);
  }

  /**
   * Obtener eventos históricos de un video
   */
  getHistory(videoId: string, limit = 100) {
    return EventQueries.getByVideoId(videoId, limit);
  }
}

let instance: EventService | null = null;
export function getEventService(): EventService {
  if (!instance) instance = new EventService();
  return instance;
}
```

## Sobre el event bus existente

Ubicación: `api/core/events/bus.ts`

El bus ya tiene `emit` y `subscribe`. Solo hay que:
1. Importarlo en el service
2. Conectar `EventQueries.create` para persistencia
3. El service re-exporta `subscribe` para el route de SSE

## Notas

- El service no sabe de HTTP ni de SSE
- SSE se maneja en el route, el service solo provee el `subscribe()`
- Los eventos se persisten SIEMPRE y se emiten al bus SIEMPRE

## Validación

- `tsc --noEmit` pasa
- `eventBus.subscribe()` del bus existente funciona como AsyncIterable
- Los eventos persisten en la tabla `events` de SQLite
