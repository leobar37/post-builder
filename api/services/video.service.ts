import { nanoid } from 'nanoid';
import { join } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { z } from 'zod';
import { getVideoRepository, getSceneRepository } from '../db/repositories/index.js';
import { createOpenCodeSDK } from '../core/opencode/sdk.js';
import { getProjectService } from './project.service.js';
import { getEventService } from './event.service.js';
import { getSceneService } from './scene.service.js';
import type {
  VideoResponse,
  VideoWithScenes,
  VideoListResponse,
  VideoStatus,
} from '../types/index.js';
import { execa } from 'execa';
import ffmpegStatic from 'ffmpeg-static';

/**
 * VideoService - Business logic for videos
 *
 * Responsibilities:
 * - CRUD operations for videos
 * - Integration with OpenCode for idea generation
 * - Video composition with Remotion
 * - Final video building with ffmpeg
 */
export class VideoService {
  private projectService = getProjectService();
  private eventService = getEventService();
  private openCodeSDK = createOpenCodeSDK();
  private videosBasePath: string;

  constructor() {
    this.videosBasePath = join(process.cwd(), 'videos');
  }

  private getRepo() {
    return getVideoRepository();
  }

  private getSceneRepo() {
    return getSceneRepository();
  }

  /**
   * Create a video from a project with OpenCode idea generation
   * Flow: generating_idea → idea_ready
   */
  async createFromProject(projectId: string, prompt: string): Promise<VideoResponse> {
    // 1. Get project for context
    const project = this.projectService.getById(projectId);

    // 2. Create video in DB (status: generating_idea)
    const video = this.getRepo().create({
      project_id: projectId,
      title: prompt.substring(0, 60),
      prompt,
      status: 'generating_idea',
    });

    this.eventService.emit({
      video_id: video.id,
      type: 'video_created',
      source: 'system',
      data: { videoId: video.id, projectId },
    });

    // 3. Build system prompt from project context
    const contextPath = this.projectService.getProjectPath(project.context_id);
    const systemPrompt = await this.buildSystemPrompt(contextPath);

    // 4. Generate idea with OpenCode
    const ideaSchema = z.object({
      title: z.string(),
      description: z.string(),
      scenes: z.array(z.object({
        description: z.string(),
        duration: z.number().default(6),
        minimax_prompt: z.string(),
      })),
    });

    try {
      const response = await this.openCodeSDK.sendPromptStructured(
        `${systemPrompt}\n\nBased on the project context above, generate a video idea for this prompt:\n${prompt}\n\nGenerate a compelling Instagram Reel idea with scenes.`,
        ideaSchema
      );

      const idea = response.data;

      // 5. Save idea to video
      this.getRepo().updateIdea(video.id, {
        title: idea.title,
        description: idea.description,
        scenes: idea.scenes,
      });

      // 6. Create scenes in DB
      for (let i = 0; i < idea.scenes.length; i++) {
        const s = idea.scenes[i];
        this.getSceneRepo().create({
          video_id: video.id,
          sequence: i + 1,
          description: s.description,
          duration: s.duration,
          minimax_prompt: s.minimax_prompt,
        });
      }

      // 7. Update progress
      this.getRepo().update(video.id, {
        total_scenes: idea.scenes.length,
      });
      this.getRepo().updateProgress(video.id);

      // 8. Emit event
      this.eventService.emit({
        video_id: video.id,
        type: 'idea_ready',
        source: 'opencode',
        data: { title: idea.title, sceneCount: idea.scenes.length },
      });

      return this.getRepo().getById(video.id)!;
    } catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.getRepo().updateStatus(video.id, 'failed');

      this.eventService.emit({
        video_id: video.id,
        type: 'opencode_error',
        source: 'opencode',
        data: { error: errorMessage },
      });

      throw error;
    }
  }

  /**
   * Build system prompt from project context files
   */
  private async buildSystemPrompt(contextPath: string): Promise<string> {
    const { readFileSync, existsSync } = await import('fs');
    const { join } = await import('path');

    const files = ['system.md', 'brand.md', 'audience.md'];
    const parts: string[] = [];

    for (const file of files) {
      const filePath = join(contextPath, file);
      if (existsSync(filePath)) {
        parts.push(readFileSync(filePath, 'utf-8'));
      }
    }

    if (parts.length === 0) {
      return 'You are a creative video director specializing in Instagram Reels.';
    }

    return parts.join('\n\n');
  }

  /**
   * Get video by id
   */
  getById(id: string): VideoResponse | undefined {
    return this.getRepo().getById(id);
  }

  /**
   * Get video with scenes
   */
  getByIdWithScenes(id: string): VideoWithScenes | undefined {
    const video = this.getRepo().getById(id);
    if (!video) return undefined;

    const scenes = this.getSceneRepo().getByVideoId(id);
    return { ...video, scenes };
  }

  /**
   * Get videos by project id
   */
  getByProjectId(projectId: string): VideoResponse[] {
    return this.getRepo().getByProjectId(projectId);
  }

  /**
   * Get all videos
   */
  getAll(status?: VideoStatus): VideoListResponse {
    const videos = this.getRepo().getAll(status);
    return { videos, total: videos.length };
  }

  /**
   * Approve idea and move to clip generation
   * Flow: idea_ready → generating_clips
   * Automatically triggers MiniMax generation for each scene.
   */
  async approveIdea(videoId: string): Promise<VideoResponse> {
    const video = this.getRepo().getById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    if (video.status !== 'idea_ready') {
      throw new Error(`Cannot approve: video is ${video.status}`);
    }

    this.getRepo().updateStatus(videoId, 'generating_clips');

    // Trigger scene generation for all scenes in parallel
    const scenes = this.getSceneRepo().getByVideoId(videoId);
    const sceneService = getSceneService();
    scenes.forEach((scene) => {
      sceneService.generateScene(scene.id).catch((err) => {
        console.error(`[VideoService] Failed to generate scene ${scene.id}:`, err);
      });
    });

    this.eventService.emit({
      video_id: videoId,
      type: 'clips_ready',
      source: 'system',
      data: { message: 'Ready to generate clips', sceneCount: scenes.length },
    });

    return this.getRepo().getById(videoId)!;
  }

  /**
   * Start video rendering (composition)
   * Flow: clips_ready → composing
   */
  async startRender(videoId: string): Promise<VideoResponse> {
    const video = this.getRepo().getById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    if (video.status !== 'clips_ready') {
      throw new Error(`Cannot render: video is ${video.status}`);
    }

    this.getRepo().updateStatus(videoId, 'composing');

    // Start async render
    this.renderVideo(videoId).catch((error) => {
      console.error(`[VideoService] Error rendering video ${videoId}:`, error);
      this.getRepo().updateStatus(videoId, 'failed');
      this.eventService.emit({
        video_id: videoId,
        type: 'error',
        source: 'system',
        data: { message: error instanceof Error ? error.message : String(error) },
      });
    });

    return this.getRepo().getById(videoId)!;
  }

  /**
   * Render individual scenes with Remotion
   * Composition is a no-op for now (scenes are pre-rendered by MiniMax).
   * Real Remotion composition can be added here in the future.
   * Status transitions: clips_ready → composing → completed
   */
  private async renderVideo(videoId: string): Promise<void> {
    const video = this.getRepo().getById(videoId);
    if (!video) throw new Error('Video not found');

    const scenes = this.getSceneRepo().getByVideoId(videoId);

    this.eventService.emit({
      video_id: videoId,
      type: 'composition_started',
      source: 'system',
      data: { totalScenes: scenes.length },
    });

    for (const scene of scenes) {
      if (scene.minimax_status !== 'success') continue;
      // For now, scenes are already rendered by MiniMax
      // TODO: Add Remotion composition overlays here
    }

    // No-op: status stays 'composing'. Actual FFmpeg composition happens in buildFinalVideo().
    // TODO: Replace with Remotion composition when implemented.

    this.eventService.emit({
      video_id: videoId,
      type: 'composition_completed',
      source: 'system',
      data: { sceneCount: scenes.length },
    });
  }

  /**
   * Build final video by concatenating scenes with ffmpeg
   */
  async buildFinalVideo(videoId: string): Promise<{ outputPath: string; duration: number }> {
    const video = this.getRepo().getById(videoId);
    if (!video) throw new Error('Video not found');

    const scenes = this.getSceneRepo().getByVideoId(videoId);
    const completedScenes = scenes.filter((s) => s.minimax_status === 'success');

    if (completedScenes.length === 0) {
      throw new Error('No completed scenes to build video');
    }

    const videoPath = join(this.videosBasePath, videoId);
    const outputPath = join(videoPath, 'output', 'final.mp4');

    // Ensure output directory exists
    const outputDir = join(videoPath, 'output');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Build concat list
    const sceneFiles = completedScenes
      .sort((a, b) => a.sequence - b.sequence)
      .map((s) => `file '${s.clip_path}'`)
      .filter((path) => path !== "file 'null'")
      .join('\n');

    if (!sceneFiles) {
      throw new Error('No valid scene files found');
    }

    const listPath = join(videoPath, 'scenes.txt');
    writeFileSync(listPath, sceneFiles);

    // Run ffmpeg
    const ffmpeg = ffmpegStatic || 'ffmpeg';
    await execa(
      ffmpeg,
      ['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outputPath],
      { cwd: process.cwd() }
    );

    // Update video as completed
    this.getRepo().complete(videoId, outputPath);

    const totalDuration = completedScenes.reduce((sum, s) => sum + (s.duration || 0), 0);

    this.eventService.emit({
      video_id: videoId,
      type: 'composition_completed',
      source: 'system',
      data: { outputPath, duration: totalDuration },
    });

    return {
      outputPath,
      duration: totalDuration,
    };
  }

  /**
   * Delete video
   */
  delete(id: string): void {
    const video = this.getRepo().getById(id);
    if (!video) {
      throw new Error('Video not found');
    }
    this.getRepo().delete(id);
  }
}

// Singleton
let instance: VideoService | null = null;
export function getVideoService(): VideoService {
  if (!instance) instance = new VideoService();
  return instance;
}
