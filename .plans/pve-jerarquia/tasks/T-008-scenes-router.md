# T-008 — ScenesRouter

## Objetivo

Crear `api/routes/scenes.ts` para operaciones de scene individuales.

## Depende de

T-001 (types), T-004 (SceneService)

## Archivos a tocar

**Nuevo:** `api/routes/scenes.ts`

## Implementación

```typescript
// api/routes/scenes.ts
import { Router } from 'express';
import { getSceneService } from '../services/scene.service';
import { VideoQueries } from '../db/client';
import { join } from 'path';

const router = Router();
const sceneService = getSceneService();

// Helper para obtener el output dir de un video
function getVideoOutputDir(videoId: string): string {
  return join(process.cwd(), 'videos', videoId, 'scenes');
}

// GET /api/scenes/:id
router.get('/:id', (req, res) => {
  try {
    const scene = sceneService.getById(req.params.id);
    res.json(scene);
  } catch (err) {
    if (err instanceof Error && err.message === 'Scene not found') {
      res.status(404).json({ success: false, error: 'Scene not found' });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

// POST /api/scenes/:id/generate
router.post('/:id/generate', async (req, res) => {
  try {
    const scene = sceneService.getById(req.params.id);
    const video = VideoQueries.getById(scene.video_id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    const outputDir = getVideoOutputDir(scene.video_id);
    const updated = await sceneService.generateScene(req.params.id, outputDir);
    res.json({ success: true, scene: updated });
  } catch (err) {
    if (err instanceof Error && err.message === 'Scene not found') {
      res.status(404).json({ success: false, error: 'Scene not found' });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

// POST /api/scenes/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const updated = await sceneService.cancelScene(req.params.id);
    res.json({ success: true, scene: updated });
  } catch (err) {
    if (err instanceof Error && err.message === 'Scene not found') {
      res.status(404).json({ success: false, error: 'Scene not found' });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

// POST /api/scenes/:id/retry
router.post('/:id/retry', async (req, res) => {
  try {
    const scene = sceneService.getById(req.params.id);
    const outputDir = getVideoOutputDir(scene.video_id);
    const updated = await sceneService.retryScene(req.params.id, outputDir);
    res.json({ success: true, scene: updated });
  } catch (err) {
    if (err instanceof Error && err.message === 'Scene not found') {
      res.status(404).json({ success: false, error: 'Scene not found' });
    } else if (err instanceof Error && err.message.includes('Can only retry')) {
      res.status(409).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

export default router;
```

## Validación

- `tsc --noEmit` pasa
- Cada endpoint tiene manejo de errores con HTTP codes
