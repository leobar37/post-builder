import { Router } from 'express';
import { getSceneService } from '../services/scene.service.js';

const router = Router();
const sceneService = getSceneService();

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
    const updated = await sceneService.generateScene(req.params.id);
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
    const updated = await sceneService.retryScene(req.params.id);
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
