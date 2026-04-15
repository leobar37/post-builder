/**
 * Scene types
 */

export interface Scene {
  id: string;
  videoId: string;
  sequence: number;
  name: string;
  description?: string;
  duration: number;
  status: SceneStatus;
  minimaxTaskId?: string;
  minimaxStatus?: MiniMaxStatus;
  minimaxPrompt?: string;
  context?: string; // JSON string
  clipPath?: string;
  clipUrl?: string;
  fileId?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
}

export type SceneStatus =
  | 'pending'
  | 'rendering'
  | 'completed'
  | 'failed';

export type MiniMaxStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'success'
  | 'fail'
  | 'retrying';

export interface CreateSceneInput {
  videoId: string;
  sequence: number;
  name: string;
  description?: string;
  duration?: number;
  context?: Record<string, unknown>;
}

export interface UpdateSceneInput {
  status?: SceneStatus;
  minimaxStatus?: MiniMaxStatus;
  clipPath?: string;
  errorMessage?: string;
}
