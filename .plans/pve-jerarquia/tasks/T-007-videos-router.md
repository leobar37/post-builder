# T-007 — VideosRouter (nested under projects)

## Objetivo

Refactorizar `api/routes/videos.ts` para:
1. Agregar `POST /api/projects/:projectId/videos` y `GET /api/projects/:projectId/videos`
2. Usar `VideoService` en vez de llamar `VideoQueries` directo
3. Usar los tipos de `api/types`

## Depende de

T-001 (types), T-005 (VideoService)

## Archivos a tocar

**Actualizar:** `api/routes/videos.ts`

## Implementación (solo las partes que cambian)

```typescript
// api/routes/videos.ts — fragmentos nuevos/actualizados

import { Router } from 'express';
import { getVideoService } from '../services/video.service';
import { getProjectService } from '../services/project.service';
import type {
  CreateVideoRequest,
  VideoResponse,
} from '../types';
import { z } from 'zod';

const router = Router();
const videoService = getVideoService();
const projectService = getProjectService();

// ─── Nested under projects ──────────────────────────────────────────────────

// POST /api/projects/:projectId/videos
router.post('/projects/:projectId/videos', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ success: false, error: 'prompt is required' });
      return;
    }

    // Verificar que el project existe
    try {
      projectService.getById(projectId);
    } catch {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    // Crear video (dispara OpenCode)
    const video = await videoService.createFromProject(projectId, prompt);

    res.status(201).json({ success: true, video });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/projects/:projectId/videos
router.get('/projects/:projectId/videos', (req, res) => {
  try {
    const { projectId } = req.params;
    const videos = videoService.getByProjectId(projectId);
    res.json({ videos, total: videos.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ─── Existing routes (refactor to use VideoService) ────────────────────────

// GET /api/videos
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const videos = videoService.getAll(status as VideoStatus | undefined);
    res.json({ videos, total: videos.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/videos/:id
router.get('/:id', (req, res) => {
  try {
    const video = videoService.getById(req.params.id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }
    const scenes = SceneQueries.getByVideoId(req.params.id); // scene queries still direct
    res.json({ ...video, scenes });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/videos/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const video = await videoService.approveIdea(req.params.id);
    res.json({ success: true, video });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      res.status(404).json({ success: false, error: err.message });
    } else if (err instanceof Error && err.message.includes('Cannot approve')) {
      res.status(409).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

// POST /api/videos/:id/render
router.post('/:id/render', async (req, res) => {
  try {
    const video = await videoService.startRender(req.params.id);
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', (req, res) => {
  try {
    VideoQueries.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
```

## Notas

- `GET /projects/:projectId/videos` y `POST /projects/:projectId/videos` están montados en `videosRouter` — en `api/index.ts` se montan como `app.use('/api', videosRouter)` (rutas relativas) o bien se crean dos routers separados
- La ruta `/api/videos/:id/status` se mantiene o se integra en `GET /api/videos/:id` agregando scenes
- Los `SceneQueries.getByVideoId` directos se mantienen por ahora (no hay SceneService.getByVideoId)

## Validación

- `tsc --noEmit` pasa
- Los routes que hacen `await` usan `async`
- Errores convertidos a HTTP codes correctamente
