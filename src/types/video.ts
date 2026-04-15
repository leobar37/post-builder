/**
 * Video types
 */

export interface Video {
  id: string;
  projectId?: string;
  postId?: number;
  title: string;
  status: VideoStatus;
  prompt?: string;
  context?: string; // JSON string
  progress: number;
  totalScenes: number;
  completedScenes: number;
  outputPath?: string;
  outputUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type VideoStatus =
  | 'draft'
  | 'generating_idea'
  | 'idea_ready'
  | 'generating_clips'
  | 'clips_ready'
  | 'composing'
  | 'completed'
  | 'failed';

export interface CreateVideoInput {
  projectId?: string;
  postId?: number;
  title: string;
  prompt?: string;
  context?: Record<string, unknown>;
}

export interface UpdateVideoInput {
  status?: VideoStatus;
  progress?: number;
  outputPath?: string;
  outputUrl?: string;
}
