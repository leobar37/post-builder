import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getSceneRepository, getVideoRepository } from '../db/repositories/index.js';
import { getMiniMaxService } from './minimax.service.js';
import { getEventService } from './event.service.js';
import type {
  SceneResponse,
  SceneListResponse,
  UpdateSceneRequest,
  SceneStatus,
} from '../types/index.js';
import { nanoid } from 'nanoid';

/**
 * SceneService - Operations for individual scenes
 *
 * Responsibilities:
 * - CRUD operations for scenes
 * - Trigger MiniMax generation
 * - Handle cancel/retry logic
 * - Scene code editing via OpenCode
 */
export class SceneService {
  private miniMaxService = getMiniMaxService();
  private eventService = getEventService();
  private videosBasePath: string;

  constructor() {
    this.videosBasePath = join(process.cwd(), 'videos');
  }

  private getRepo() {
    return getSceneRepository();
  }

  private getVideoRepo() {
    return getVideoRepository();
  }

  /**
   * Get scene by id
   */
  getById(id: string): SceneResponse {
    const scene = this.getRepo().getById(id);
    if (!scene) {
      throw new Error('Scene not found');
    }
    return scene;
  }

  /**
   * Get all scenes for a video
   */
  getByVideoId(videoId: string): SceneListResponse {
    const scenes = this.getRepo().getByVideoId(videoId);
    return { scenes };
  }

  /**
   * Update scene fields
   */
  updateScene(id: string, data: UpdateSceneRequest): SceneResponse {
    const existing = this.getRepo().getById(id);
    if (!existing) {
      throw new Error('Scene not found');
    }

    return this.getRepo().update(id, {
      description: data.description,
      duration: data.duration,
      minimax_prompt: data.minimax_prompt,
      context: data.context,
    });
  }

  /**
   * Trigger MiniMax generation for a scene
   */
  async generateScene(sceneId: string): Promise<SceneResponse> {
    const scene = this.getRepo().getById(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }

    if (!scene.minimax_prompt) {
      throw new Error('Scene has no minimax_prompt set');
    }

    // Update status to queued
    this.getRepo().updateStatus(sceneId, 'queued');

    this.eventService.emit({
      video_id: scene.video_id,
      type: 'minimax_queued',
      source: 'minimax',
      data: { sceneId, sequence: scene.sequence },
    });

    try {
      // Ensure output directory exists
      const videoPath = join(this.videosBasePath, scene.video_id, 'scenes');
      if (!existsSync(videoPath)) {
        mkdirSync(videoPath, { recursive: true });
      }

      const outputPath = join(videoPath, `scene-${String(scene.sequence).padStart(2, '0')}.mp4`);

      // Create MiniMax task
      const task = await this.miniMaxService.createVideoGeneration({
        prompt: scene.minimax_prompt,
        duration: (scene.duration as 6 | 8 | 10) || 6,
        resolution: '1080p',
      });

      // Update scene with task info
      this.getRepo().update(sceneId, {
        minimax_task_id: task.taskId,
        minimax_status: 'queued',
      });

      // Start polling for completion (non-blocking)
      this.pollAndDownload(sceneId, task.taskId, outputPath).catch((error) => {
        console.error(`[SceneService] Error polling scene ${sceneId}:`, error);
      });

      return this.getRepo().getById(sceneId)!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.getRepo().updateStatus(sceneId, 'fail', { errorMessage });

      this.eventService.emit({
        video_id: scene.video_id,
        type: 'minimax_fail',
        source: 'minimax',
        data: { sceneId, error: errorMessage },
      });

      throw error;
    }
  }

  /**
   * Poll MiniMax task and download when ready
   */
  private async pollAndDownload(
    sceneId: string,
    taskId: string,
    outputPath: string
  ): Promise<void> {
    const scene = this.getRepo().getById(sceneId);
    if (!scene) return;

    try {
      const clipPath = await this.miniMaxService.waitForCompletion(
        taskId,
        outputPath,
        {
          pollInterval: 5000,
          maxAttempts: 60,
          onStatusChange: (status) => {
            // Update scene status based on MiniMax status
            const newStatus = this.mapMiniMaxStatus(status.status);
            if (newStatus !== scene.minimax_status) {
              this.getRepo().update(sceneId, {
                minimax_status: newStatus,
              });

              this.eventService.emit({
                video_id: scene.video_id,
                type: newStatus === 'processing' ? 'minimax_processing' : 'minimax_success',
                source: 'minimax',
                data: { sceneId, taskId, status: status.status },
              });
            }
          },
        }
      );

      // Update scene as completed
      this.getRepo().updateStatus(sceneId, 'success', {
        clipPath,
      });

      // Update video progress
      this.getVideoRepo().updateProgress(scene.video_id);

      this.eventService.emit({
        video_id: scene.video_id,
        type: 'minimax_downloaded',
        source: 'minimax',
        data: { sceneId, clipPath },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.getRepo().updateStatus(sceneId, 'fail', { errorMessage });

      this.eventService.emit({
        video_id: scene.video_id,
        type: 'minimax_fail',
        source: 'minimax',
        data: { sceneId, taskId, error: errorMessage },
      });
    }
  }

  /**
   * Map MiniMax status to our SceneStatus
   */
  private mapMiniMaxStatus(
    status: 'queued' | 'processing' | 'success' | 'fail'
  ): SceneStatus {
    const mapping: Record<string, SceneStatus> = {
      queued: 'queued',
      processing: 'processing',
      success: 'success',
      fail: 'fail',
    };
    return mapping[status] || 'fail';
  }

  /**
   * Cancel scene generation (if possible)
   * Note: MiniMax doesn't support true cancellation, we just mark it
   */
  cancelScene(sceneId: string): SceneResponse {
    const scene = this.getRepo().getById(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }

    if (scene.minimax_status === 'success') {
      throw new Error('Cannot cancel completed scene');
    }

    // Mark as failed (MiniMax doesn't support true cancellation)
    return this.getRepo().updateStatus(sceneId, 'fail', {
      errorMessage: 'Cancelled by user',
    });
  }

  /**
   * Retry a failed scene
   */
  async retryScene(sceneId: string): Promise<SceneResponse> {
    const scene = this.getRepo().getById(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }

    if (scene.minimax_status !== 'fail') {
      throw new Error('Can only retry failed scenes');
    }

    // Increment retry count
    this.getRepo().update(sceneId, {
      minimax_status: 'retrying',
      retry_count: scene.retry_count + 1,
      error_message: null,
    });

    this.eventService.emit({
      video_id: scene.video_id,
      type: 'scene_updated',
      source: 'system',
      data: { sceneId, action: 'retry', retryCount: scene.retry_count + 1 },
    });

    // Trigger generation again
    return this.generateScene(sceneId);
  }

  /**
   * Start a scene code editing job via OpenCode
   */
  async startSceneCodeEdit(
    sceneId: string,
    jobId: string,
    _options?: {
      description?: string;
      requirements?: string[];
    }
  ): Promise<SceneResponse> {
    const scene = this.getRepo().getById(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }

    // Prevent concurrent edits
    if (scene.code_edit_status === 'editing') {
      throw new Error(`Scene already has an active edit job: ${scene.code_edit_job_id}`);
    }

    // Update scene status to editing
    const updated = this.getRepo().update(sceneId, {
      code_edit_status: 'editing',
      code_edit_job_id: jobId,
    });

    this.eventService.emit({
      video_id: scene.video_id,
      type: 'scene_code_edit_started',
      source: 'system',
      data: { sceneId, jobId },
    });

    return updated;
  }

  /**
   * Complete a scene code editing job (called by OpenCode callback)
   */
  async completeSceneCodeEdit(
    sceneId: string,
    result: {
      status: 'completed' | 'failed';
      files?: string[];
      error?: string;
      summary?: string;
    }
  ): Promise<SceneResponse> {
    const scene = this.getRepo().getById(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }

    const isSuccess = result.status === 'completed';

    // Update scene with result
    const updated = this.getRepo().update(sceneId, {
      code_edit_status: isSuccess ? 'completed' : 'failed',
      code_path: result.files?.[0] || null,
      error_message: result.error || null,
    });

    this.eventService.emit({
      video_id: scene.video_id,
      type: isSuccess ? 'scene_code_edit_completed' : 'scene_code_edit_failed',
      source: 'opencode',
      data: {
        sceneId,
        jobId: scene.code_edit_job_id,
        files: result.files,
        summary: result.summary,
        error: result.error,
      },
    });

    return updated;
  }
}

// Singleton
let instance: SceneService | null = null;
export function getSceneService(): SceneService {
  if (!instance) instance = new SceneService();
  return instance;
}
