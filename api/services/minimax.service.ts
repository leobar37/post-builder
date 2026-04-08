// MiniMax Video Generation Service
// Handles video generation using MiniMax Hailuo AI API
// API Docs: https://platform.minimax.io/docs/guides/video-generation

import { writeFileSync, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';

export interface MiniMaxConfig {
  apiKey: string;
  baseUrl: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  duration?: 6 | 8 | 10;
  resolution?: '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16';
}

export interface VideoGenerationTask {
  taskId: string;
  status: 'queued' | 'processing' | 'success' | 'fail';
  fileId?: string;
  videoUrl?: string;
  createdAt: Date;
}

export interface GenerationStatus {
  taskId: string;
  status: 'queued' | 'processing' | 'success' | 'fail';
  progress?: number;
  fileId?: string;
  videoUrl?: string;
  error?: string;
}

export class MiniMaxService {
  private config: MiniMaxConfig;

  constructor() {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      console.warn('MiniMaxService: Missing MINIMAX_API_KEY environment variable');
    }

    this.config = {
      apiKey: apiKey || '',
      baseUrl: 'https://api.minimax.io/v1',
    };
  }

  /**
   * Create a new video generation task
   * Docs: https://platform.minimax.io/docs/api-reference/video-generation-t2v
   */
  async createVideoGeneration(request: VideoGenerationRequest): Promise<VideoGenerationTask> {
    const url = `${this.config.baseUrl}/video_generation`;

    const payload = {
      model: request.model || 'MiniMax-Hailuo-02',
      prompt: request.prompt,
      duration: request.duration || 6,
      resolution: request.resolution || '1080p',
    };

    console.log('[MiniMax] Creating video generation task:', {
      model: payload.model,
      duration: payload.duration,
      resolution: payload.resolution,
      promptLength: request.prompt.length,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax API error: ${data.base_resp?.status_msg || 'Unknown error'}`);
    }

    return {
      taskId: data.task_id,
      status: 'queued',
      createdAt: new Date(),
    };
  }

  /**
   * Query the status of a video generation task
   * Docs: https://platform.minimax.io/docs/api-reference/video-generation-query
   */
  async queryGenerationStatus(taskId: string): Promise<GenerationStatus> {
    const url = `${this.config.baseUrl}/video_generation?task_id=${taskId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax API error: ${data.base_resp?.status_msg || 'Unknown error'}`);
    }

    const status = data.status as 'queued' | 'processing' | 'success' | 'fail';

    return {
      taskId,
      status,
      fileId: data.file_id,
      videoUrl: data.file_id ? `${this.config.baseUrl}/files/${data.file_id}` : undefined,
      error: status === 'fail' ? data.base_resp?.status_msg : undefined,
    };
  }

  /**
   * Download a generated video file
   * Docs: https://platform.minimax.io/docs/api-reference/video-generation-download
   */
  async downloadVideo(fileId: string, outputPath: string): Promise<string> {
    const url = `${this.config.baseUrl}/files/${fileId}`;

    console.log('[MiniMax] Downloading video:', { fileId, outputPath });

    // Ensure directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    // Write to file using stream
    const fileStream = createWriteStream(outputPath);
    await pipeline(response.body as any, fileStream);

    console.log('[MiniMax] Video downloaded successfully:', outputPath);
    return outputPath;
  }

  /**
   * Poll for completion and download when ready
   */
  async waitForCompletion(
    taskId: string,
    outputPath: string,
    options?: {
      pollInterval?: number;
      maxAttempts?: number;
      onStatusChange?: (status: GenerationStatus) => void;
    }
  ): Promise<string> {
    const { pollInterval = 5000, maxAttempts = 60, onStatusChange } = options || {};

    console.log('[MiniMax] Waiting for completion:', { taskId, maxAttempts });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.queryGenerationStatus(taskId);

      if (onStatusChange) {
        onStatusChange(status);
      }

      console.log(`[MiniMax] Status check ${attempt + 1}/${maxAttempts}:`, status.status);

      if (status.status === 'success' && status.fileId) {
        return await this.downloadVideo(status.fileId, outputPath);
      }

      if (status.status === 'fail') {
        throw new Error(`Video generation failed: ${status.error || 'Unknown error'}`);
      }

      // Wait before next poll
      await this.delay(pollInterval);
    }

    throw new Error(`Timeout waiting for video generation after ${maxAttempts} attempts`);
  }

  /**
   * Generate and download video in one call (blocking)
   */
  async generateVideo(
    request: VideoGenerationRequest,
    outputPath: string,
    options?: {
      onProgress?: (status: GenerationStatus) => void;
    }
  ): Promise<string> {
    // Create task
    const task = await this.createVideoGeneration(request);

    // Wait for completion and download
    return await this.waitForCompletion(task.taskId, outputPath, {
      onStatusChange: options?.onProgress,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let miniMaxServiceInstance: MiniMaxService | null = null;

export function getMiniMaxService(): MiniMaxService {
  if (!miniMaxServiceInstance) {
    miniMaxServiceInstance = new MiniMaxService();
  }
  return miniMaxServiceInstance;
}
