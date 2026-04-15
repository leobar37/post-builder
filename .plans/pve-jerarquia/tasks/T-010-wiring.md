# T-010 — Wiring en api/index.ts

## Objetivo

Montar todos los routers en `api/index.ts` y verificar que el servidor compile y arranque sin errores.

## Depende de

T-006 (ProjectsRouter), T-007 (VideosRouter), T-008 (ScenesRouter), T-009 (EventsRouter)

## Archivos a tocar

**Actualizar:** `api/index.ts`

## Implementación

```typescript
// api/index.ts — actualizar

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import projectsRoutes from './routes/projects';
import videosRoutes from './routes/videos';
import scenesRoutes from './routes/scenes';
import eventsRoutes from './routes/events';
import exportRoutes from './routes/export.routes';
import modelsRoutes from './routes/models';

const app = express();
const PORT = parseInt(process.env.PORT || '3458', 10);
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/projects', projectsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/scenes', scenesRoutes);
app.use('/events', eventsRoutes);
app.use('/export', exportRoutes);
app.use('/api/models', modelsRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 API running on ${HOST}:${PORT}`);
});

export * from './core/index.js';
```

## Verificaciones post-wiring

1. `tsc --noEmit` en todo `api/` → 0 errores
2. `pnpm dev:api` → servidor arranca en puerto 3458
3. `curl http://localhost:3458/health` → `{"status":"ok"}`
4. `curl http://localhost:3458/api/projects` → `{"projects":[],"total":0}`
5. `curl http://localhost:3458/events/nonexistent` → headers SSE correctos

## Cleanup pendiente (no scope de esta tarea)

- Remover llamadas directas a `VideoQueries` desde `videos.ts` route (T-007 las usa directo para algunos métodos — marcar como TODO)
- Remover imports no usados de `VideoQueries` en routes cuando ya no se necesiten
- El export routes (`export.routes.ts`) también llama `getBrowserlessService()` — verificar que sigue funcionando

## Validación

- `tsc --noEmit` pasa sin errores en todo `api/`
- `pnpm dev:api` levanta sin errores
- Los endpoints responden con JSON correcto
