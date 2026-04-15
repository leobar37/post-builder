# T-009 — EventsRouter (SSE endpoint)

## Objetivo

Crear `api/routes/events.ts` con endpoint SSE para que el frontend se subscribe a eventos de un video.

## Depende de

T-001 (types), T-003 (EventService)

## Archivos a tocar

**Nuevo:** `api/routes/events.ts`

## Implementación

```typescript
// api/routes/events.ts
import { Router } from 'express';
import { getEventService } from '../services/event.service';
import type { Response } from 'express';

const router = Router();
const eventService = getEventService();

// GET /events/:videoId
router.get('/:videoId', async (req, res: Response) => {
  const { videoId } = req.params;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', videoId })}\n\n`);

  // Subscribe to events
  const eventIterator = eventService.subscribe(videoId);

  try {
    for await (const event of eventIterator) {
      // Check if client disconnected
      if (res.writableEnded) break;

      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch {
    // Client disconnected or error
  } finally {
    eventService.unsubscribe(videoId);
    res.end();
  }
});

// GET /events/:videoId/history
router.get('/:videoId/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = eventService.getHistory(req.params.videoId, limit);
    res.json({ events, total: events.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
```

## Notas

- SSE se implementa con `for await (const event of eventIterator)` sobre el AsyncIterable del EventService
- El `eventIterator` viene del `eventBus.subscribe(videoId)` en EventService
- Se usa `res.flushHeaders()` para enviar headers antes de cualquier contenido
- El heartbeat inicial confirma al cliente que la conexión está viva
- Cleanup con `unsubscribe` cuando el cliente se desconecta (cliente cierra, o error)

## Validación

- `tsc --noEmit` pasa
- El endpoint responde con headers SSE correctos
- Eventos históricos vienen del endpoint `/history`
