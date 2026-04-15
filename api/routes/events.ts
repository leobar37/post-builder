import { Router, type Response, type Request, type NextFunction } from 'express';
import { getEventService } from '../services/event.service.js';

const router = Router();
const eventService = getEventService();

const SSE_API_KEY = process.env.SSE_API_KEY;

// Auth middleware for SSE connections
function requireSseAuth(req: Request, res: Response, next: NextFunction) {
  if (!SSE_API_KEY) {
    // No key configured — allow all (dev mode)
    return next();
  }

  const bearerKey = req.headers['authorization']?.replace('Bearer ', '');
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!bearerKey && !apiKey) {
    res.status(401).json({ success: false, error: 'Missing API key' });
    return;
  }

  const providedKey = bearerKey || apiKey;
  if (providedKey !== SSE_API_KEY) {
    res.status(403).json({ success: false, error: 'Invalid API key' });
    return;
  }

  next();
}

// GET /events/:videoId
router.get('/:videoId', requireSseAuth, async (req, res: Response) => {
  const { videoId } = req.params;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', videoId })}

`);

  // Heartbeat interval to prevent proxy timeouts (every 25s)
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': heartbeat\n\n');
    }
  }, 25000);

  // Subscribe to events
  const eventIterator = eventService.subscribe(videoId);

  try {
    for await (const event of eventIterator) {
      // Check if client disconnected
      if (res.writableEnded) break;

      res.write(`data: ${JSON.stringify(event)}

`);
    }
  } catch {
    // Client disconnected or error
  } finally {
    clearInterval(heartbeat);
    eventService.unsubscribe(videoId);
    res.end();
  }
});

// GET /events/:videoId/history
router.get('/:videoId/history', requireSseAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = eventService.getHistory(req.params.videoId, limit);
    res.json({ events, total: events.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
