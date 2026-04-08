import { nanoid } from 'nanoid';
import { join } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { VideoQueries, SceneQueries } from '../db/client';
import { SceneGenerator } from '../../src/generators/scene-generator';
import { execa } from 'execa';
import ffmpegStatic from 'ffmpeg-static';

export interface VideoWithScenes {
  id: string;
  post_id: number;
  title: string;
  status: string;
  total_scenes: number;
  scenes: Array<{
    id: string;
    sequence: number;
    name: string;
    status: string;
  }>;
}

export class VideoService {
  private sceneGenerator: SceneGenerator;
  private videosBasePath: string;

  constructor() {
    this.sceneGenerator = new SceneGenerator();
    this.videosBasePath = join(process.cwd(), 'videos');
  }

  async createFromPost(postId: number): Promise<VideoWithScenes> {
    const videoId = nanoid(12);

    const { post, scenes: sceneConfigs } = await this.sceneGenerator.analyzePost(postId);

    const videoPath = join(this.videosBasePath, videoId);
    const compositionsPath = join(videoPath, 'compositions');

    mkdirSync(videoPath, { recursive: true });
    mkdirSync(compositionsPath, { recursive: true });
    mkdirSync(join(videoPath, 'scenes'), { recursive: true });
    mkdirSync(join(videoPath, 'output'), { recursive: true });

    const metadata = {
      videoId,
      postId,
      title: post.title,
      createdAt: new Date().toISOString(),
      scenes: sceneConfigs.length,
    };

    writeFileSync(join(videoPath, 'metadata.json'), JSON.stringify(metadata, null, 2));

    VideoQueries.create({
      id: videoId,
      post_id: postId,
      title: post.title,
      status: 'draft',
      total_scenes: sceneConfigs.length,
    });

    const scenes: Array<{ id: string; sequence: number; name: string; status: string }> = [];

    for (let i = 0; i < sceneConfigs.length; i++) {
      const config = sceneConfigs[i];
      const sceneId = nanoid(12);
      const sequence = i + 1;
      const compositionFileName = `Scene${String(sequence).padStart(2, '0')}.tsx`;
      const compositionPath = join('compositions', compositionFileName);

      const compositionCode = this.sceneGenerator.generateComposition(config, sequence);
      writeFileSync(join(compositionsPath, compositionFileName), compositionCode);

      SceneQueries.create({
        id: sceneId,
        video_id: videoId,
        sequence,
        name: config.name,
        composition_path: compositionPath,
        duration: config.duration,
        status: 'pending',
        elements: config.elements,
        output_path: null,
        error_message: null,
      });

      scenes.push({
        id: sceneId,
        sequence,
        name: config.name,
        status: 'pending',
      });
    }

    const indexCode = this.sceneGenerator.generateIndex(sceneConfigs.length);
    writeFileSync(join(compositionsPath, 'index.ts'), indexCode);

    return {
      id: videoId,
      post_id: postId,
      title: post.title,
      status: 'draft',
      total_scenes: sceneConfigs.length,
      scenes,
    };
  }

  async renderVideo(videoId: string): Promise<void> {
    const video = VideoQueries.getById(videoId);
    if (!video) throw new Error('Video not found');

    const scenes = SceneQueries.getByVideoId(videoId);

    for (const scene of scenes) {
      if (scene.status === 'completed') continue;

      SceneQueries.updateStatus(scene.id, 'rendering');

      try {
        const outputFileName = `scene-${String(scene.sequence).padStart(2, '0')}.mp4`;
        const outputPath = join(this.videosBasePath, videoId, 'scenes', outputFileName);

        const compositionName = `Scene${String(scene.sequence).padStart(2, '0')}`;
        const compositionsPath = join(this.videosBasePath, videoId, 'compositions');

        await this.renderScene(compositionsPath, compositionName, outputPath);

        SceneQueries.updateStatus(scene.id, 'completed', outputPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        SceneQueries.updateStatus(scene.id, 'failed', undefined, errorMessage);
        throw error;
      }
    }

    VideoQueries.updateStatus(videoId, 'completed');
  }

  private async renderScene(
    compositionsPath: string,
    compositionName: string,
    outputPath: string,
  ): Promise<void> {
    const remotionCli = join(process.cwd(), 'node_modules', '.bin', 'remotion');

    await execa(
      remotionCli,
      ['render', join(compositionsPath, 'index.ts'), compositionName, outputPath, '--overwrite'],
      {
        cwd: process.cwd(),
        timeout: 300000,
      },
    );
  }

  async buildFinalVideo(videoId: string): Promise<{ outputPath: string; duration: number }> {
    const video = VideoQueries.getById(videoId);
    if (!video) throw new Error('Video not found');

    const scenes = SceneQueries.getByVideoId(videoId);
    const completedScenes = scenes.filter((s) => s.status === 'completed');

    if (completedScenes.length !== scenes.length) {
      throw new Error(`Not all scenes completed. ${completedScenes.length}/${scenes.length}`);
    }

    const videoPath = join(this.videosBasePath, videoId);
    const outputPath = join(videoPath, 'output', 'reel-final.mp4');

    const sceneFiles = completedScenes
      .sort((a, b) => a.sequence - b.sequence)
      .map((s) => `file '${s.output_path}'`)
      .join('\n');

    const listPath = join(videoPath, 'scenes.txt');
    writeFileSync(listPath, sceneFiles);

    const ffmpeg = ffmpegStatic || 'ffmpeg';

    await execa(ffmpeg, ['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outputPath], {
      cwd: process.cwd(),
    });

    VideoQueries.complete(videoId);

    const totalDuration = completedScenes.reduce((sum, s) => sum + (s.duration || 0), 0);

    return {
      outputPath,
      duration: totalDuration,
    };
  }
}
