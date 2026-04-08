import { Router } from 'express';
import { VideoQueries, SceneQueries } from '../db/client';
import { VideoService } from '../services/video-service';

const router = Router();
const videoService = new VideoService();

router.post('/', async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    const video = await videoService.createFromPost(postId);

    res.status(201).json({
      videoId: video.id,
      postId: video.post_id,
      title: video.title,
      status: video.status,
      totalScenes: video.total_scenes,
      scenes: video.scenes,
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const videos = VideoQueries.getAll(status as string);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const video = VideoQueries.getById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = SceneQueries.getByVideoId(video.id);

    res.json({
      ...video,
      scenes,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

router.get('/:id/status', (req, res) => {
  try {
    const video = VideoQueries.getById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = SceneQueries.getByVideoId(video.id);
    const completedScenes = scenes.filter((s) => s.status === 'completed').length;

    const progress =
      video.total_scenes > 0 ? Math.round((completedScenes / video.total_scenes) * 100) : 0;

    res.json({
      videoId: video.id,
      status: video.status,
      progress,
      totalScenes: video.total_scenes,
      completedScenes,
      scenes: scenes.map((s) => ({
        id: s.id,
        sequence: s.sequence,
        name: s.name,
        status: s.status,
        duration: s.duration,
      })),
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

router.post('/:id/render', async (req, res) => {
  try {
    const video = VideoQueries.getById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    VideoQueries.updateStatus(video.id, 'rendering');

    res.json({
      videoId: video.id,
      status: 'rendering',
      message: 'Rendering started',
    });

    videoService.renderVideo(video.id).catch((error) => {
      console.error('Error rendering video:', error);
      VideoQueries.updateStatus(video.id, 'failed');
    });
  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({ error: 'Failed to start render' });
  }
});

router.post('/:id/build', async (req, res) => {
  try {
    const result = await videoService.buildFinalVideo(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error building video:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build video',
    });
  }
});

router.get('/:id/download', (req, res) => {
  try {
    const video = VideoQueries.getById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const outputPath = `./videos/${video.id}/output/reel-final.mp4`;
    res.download(outputPath, `reel-${video.id}.mp4`);
  } catch (error) {
    console.error('Error downloading video:', error);
    res.status(500).json({ error: 'Failed to download video' });
  }
});

export default router;
