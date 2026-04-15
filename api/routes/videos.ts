import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getVideoService } from '../services/video.service.js';
import { getSceneRepository } from '../db/repositories/index.js';
import type { VideoStatus } from '../types/index.js';

const router = Router();
const videoService = getVideoService();

const createVideoSchema = z.object({
  prompt: z.string().min(1),
});

// GET /api/videos
router.get('/', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const result = videoService.getAll(status as VideoStatus | undefined);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/videos/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const video = videoService.getByIdWithScenes(req.params.id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }
    res.json(video);
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/videos/:id/status
router.get('/:id/status', (req: Request, res: Response) => {
  try {
    const video = videoService.getById(req.params.id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    const scenes = getSceneRepository().getByVideoId(video.id);
    const completedScenes = scenes.filter((s) => s.minimax_status === 'success').length;
    const progress = video.total_scenes > 0 ? Math.round((completedScenes / video.total_scenes) * 100) : 0;

    res.json({
      videoId: video.id,
      status: video.status,
      progress,
      totalScenes: video.total_scenes,
      completedScenes,
      scenes: scenes.map((s) => ({
        id: s.id,
        sequence: s.sequence,
        description: s.description,
        status: s.minimax_status,
        duration: s.duration,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/videos/:id/approve
router.post('/:id/approve', async (req: Request, res: Response) => {
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
router.post('/:id/render', async (req: Request, res: Response) => {
  try {
    const video = await videoService.startRender(req.params.id);
    res.json({ success: true, video });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      res.status(404).json({ success: false, error: err.message });
    } else if (err instanceof Error && err.message.includes('Cannot render')) {
      res.status(409).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

// POST /api/videos/:id/build
router.post('/:id/build', async (req: Request, res: Response) => {
  try {
    const result = await videoService.buildFinalVideo(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/videos/:id/download
router.get('/:id/download', (req: Request, res: Response) => {
  try {
    const video = videoService.getById(req.params.id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    if (!video.output_path) {
      res.status(404).json({ success: false, error: 'Video not yet built' });
      return;
    }

    res.download(video.output_path, `video-${video.id}.mp4`);
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    videoService.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      res.status(404).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
});

export default router;
