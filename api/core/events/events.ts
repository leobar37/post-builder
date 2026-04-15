import type { Event } from './types.js';

// ============================================================================
// Video Events
// ============================================================================

export interface VideoCreatedPayload {
  videoId: string;
  projectId: string;
  prompt: string;
}

export interface VideoUpdatedPayload {
  videoId: string;
  status: string;
  progress?: number;
}

export interface VideoCompletedPayload {
  videoId: string;
  outputPath: string;
  duration: number;
}

export interface VideoFailedPayload {
  videoId: string;
  error: string;
}

// ============================================================================
// Scene Events
// ============================================================================

export interface SceneGeneratedPayload {
  sceneId: string;
  videoId: string;
  sequence: number;
  clipPath: string;
}

export interface SceneFailedPayload {
  sceneId: string;
  videoId: string;
  sequence: number;
  error: string;
}

export interface ScenePlannedPayload {
  videoId: string;
  sceneCount: number;
  scenes: Array<{
    sequence: number;
    description: string;
    prompt: string;
  }>;
}

// ============================================================================
// Session Events
// ============================================================================

export interface SessionCreatedPayload {
  sessionId: string;
  contextId?: string;
  videoId?: string;
}

export interface SessionClosedPayload {
  sessionId: string;
  reason: 'completed' | 'error' | 'timeout' | 'manual';
}

export interface SessionFailedPayload {
  sessionId: string;
  error: string;
  willRetry: boolean;
}

// ============================================================================
// Idea Events
// ============================================================================

export interface IdeaGeneratedPayload {
  videoId: string;
  title: string;
  description: string;
  scenes: Array<{
    sequence: number;
    description: string;
    duration: number;
  }>;
}

// ============================================================================
// Clip Events
// ============================================================================

export interface ClipGeneratedPayload {
  sceneId: string;
  videoId: string;
  taskId: string;
  fileId: string;
}

// ============================================================================
// Event Type Constants
// ============================================================================

export const EventTypes = {
  // Video
  VIDEO_CREATED: 'video:created',
  VIDEO_UPDATED: 'video:updated',
  VIDEO_COMPLETED: 'video:completed',
  VIDEO_FAILED: 'video:failed',

  // Scene
  SCENE_PLANNED: 'scene:planned',
  SCENE_GENERATED: 'scene:generated',
  SCENE_FAILED: 'scene:failed',

  // Session
  SESSION_CREATED: 'session:created',
  SESSION_CLOSED: 'session:closed',
  SESSION_FAILED: 'session:failed',

  // Idea
  IDEA_GENERATED: 'idea:generated',

  // Clip
  CLIP_GENERATED: 'clip:generated',
} as const;

// ============================================================================
// Typed Event Helpers
// ============================================================================

export type VideoCreatedEvent = Event<VideoCreatedPayload>;
export type VideoUpdatedEvent = Event<VideoUpdatedPayload>;
export type VideoCompletedEvent = Event<VideoCompletedPayload>;
export type VideoFailedEvent = Event<VideoFailedPayload>;
export type SceneGeneratedEvent = Event<SceneGeneratedPayload>;
export type SceneFailedEvent = Event<SceneFailedPayload>;
export type ScenePlannedEvent = Event<ScenePlannedPayload>;
export type SessionCreatedEvent = Event<SessionCreatedPayload>;
export type SessionClosedEvent = Event<SessionClosedPayload>;
export type SessionFailedEvent = Event<SessionFailedPayload>;
export type IdeaGeneratedEvent = Event<IdeaGeneratedPayload>;
export type ClipGeneratedEvent = Event<ClipGeneratedPayload>;
