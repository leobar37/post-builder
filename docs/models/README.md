# Data Models (TypeScript)

## Core Interfaces

### Project

```typescript
// models/project.ts

export interface Project {
  id: string;                          // UUID v4
  name: string;                        // "Promo Mayo 2024"
  description?: string;                // Optional description
  contextId: string;                   // "promo-mayo-2024" (folder name in projects/)
  
  // Project-specific configuration
  config?: ProjectConfig;
  
  // Status
  status: ProjectStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectConfig {
  // Video defaults for this project
  defaultDuration?: 6 | 8 | 10;
  defaultResolution?: '720p' | '1080p';
  defaultAspectRatio?: '16:9' | '9:16';
  
  // Remotion composition template
  template?: string;
  
  // Custom settings
  settings?: Record<string, unknown>;
}

export type ProjectStatus = 'active' | 'archived' | 'deleted';
```

### Video

```typescript
// models/video.ts

export interface Video {
  id: string;                          // UUID v4
  projectId: string;                   // FK to project
  status: VideoStatus;
  prompt: string;

  // Note: contextId is now inherited from project
  // Use project.config for project-specific settings

  // Contexto específico del video (JSON)
  context?: VideoContext;              // Tema, objetivo, estilo, audiencia

  // OpenCode session
  opencodeSessionId?: string;
  opencodeStatus?: OpenCodeSessionStatus;

  // Generated idea
  idea?: VideoIdea;

  // Output
  outputPath?: string;
  outputUrl?: string;

  // Progress
  totalScenes: number;
  completedScenes: number;
  progress: number;                    // 0-100

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Contexto específico de un video
export interface VideoContext {
  // Tema principal del video
  theme?: string;

  // Objetivo de comunicación
  objective?: 'awareness' | 'conversion' | 'engagement';

  // Estilo visual general
  visualStyle?: {
    mood?: 'energetic' | 'calm' | 'professional' | 'fun';
    colorPalette?: string[];
    typography?: 'modern' | 'classic' | 'bold';
  };

  // Target audience
  targetAudience?: {
    ageRange?: string;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  };

  // Settings adicionales
  settings?: Record<string, unknown>;
}

export interface VideoIdea {
  title: string;
  description: string;
  scenes: SceneDefinition[];
}

export interface SceneDefinition {
  id: string;
  sequence: number;
  description: string;
  duration: 6 | 8 | 10;
  prompt: string;                      // MiniMax prompt
  textOverlay?: TextOverlay;
}

export interface TextOverlay {
  text: string;
  position: 'top' | 'center' | 'bottom';
  startTime: number;                   // Seconds
  endTime: number;
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

export type OpenCodeSessionStatus =
  | 'connecting'
  | 'connected'
  | 'processing'
  | 'closed'
  | 'error';
```

### Scene

```typescript
// models/scene.ts

export interface Scene {
  id: string;
  videoId: string;

  // Metadata
  sequence: number;
  description: string;
  duration: 6 | 8 | 10;

  // MiniMax generation
  minimaxTaskId?: string;
  minimaxStatus: MiniMaxStatus;
  minimaxPrompt: string;

  // Contexto específico de la escena (JSON)
  context?: SceneContext;              // Acción, elementos, texto, emoción

  // Output
  clipPath?: string;
  clipUrl?: string;
  fileId?: string;                     // MiniMax file ID

  // Error handling
  errorMessage?: string;
  retryCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  generatedAt?: Date;
}

// Contexto específico de una escena
export interface SceneContext {
  // Acción específica que ocurre en la escena
  action?: string;

  // Elementos visuales presentes
  visualElements?: {
    people?: number;
    location?: string;
    props?: string[];
    lighting?: 'natural' | 'studio' | 'dramatic';
  };

  // Información de texto/sobres
  textOverlay?: {
    headline?: string;
    subheadline?: string;
    cta?: string;
  };

  // Emoción o tono de la escena
  emotion?: 'excitement' | 'motivation' | 'relaxation' | 'urgency';

  // Settings adicionales
  settings?: Record<string, unknown>;
}

export type MiniMaxStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'success'
  | 'fail'
  | 'retrying';
```

### OpenCode Events

```typescript
// models/opencode.ts

export interface OpenCodeStreamEvent {
  type: OpenCodeEventType;
  sessionId: string;
  data: unknown;
  timestamp: string;
}

export type OpenCodeEventType =
  | 'text'
  | 'tool_call'
  | 'tool_result'
  | 'reasoning'
  | 'error'
  | 'done'
  | 'connected';

// Specific event payloads
export interface TextEvent {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

export interface ToolCallEvent {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultEvent {
  id: string;
  result: unknown;
  error?: string;
}
```

### API Requests/Responses

```typescript
// models/api.ts

// ==================== PROJECTS ====================

// GET /api/projects
export interface ListProjectsRequest {
  status?: ProjectStatus;
  limit?: number;
  offset?: number;
}

export interface ListProjectsResponse {
  projects: ProjectSummary[];
  total: number;
}

export interface ProjectSummary extends Project {
  videoCount: number;
  completedVideos: number;
}

// POST /api/projects
export interface CreateProjectRequest {
  name: string;
  description?: string;
  contextId: string;                   // Folder name in projects/ (e.g., "promo-mayo-2024")
  config?: ProjectConfig;
}

export interface CreateProjectResponse {
  project: Project;
}

// GET /api/projects/:id
export interface GetProjectResponse extends Project {
  videos: VideoSummary[];
}

export interface VideoSummary {
  id: string;
  status: VideoStatus;
  prompt: string;
  progress: number;
  createdAt: string;
}

// PATCH /api/projects/:id
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  contextId?: string;
  config?: ProjectConfig;
  status?: ProjectStatus;
}

// ==================== VIDEOS ====================

// POST /api/projects/:projectId/videos
export interface CreateVideoRequest {
  prompt: string;
  // context is now inherited from project
}

export interface CreateVideoResponse {
  id: string;
  projectId: string;
  status: VideoStatus;
  prompt: string;
  createdAt: string;
}

// POST /command
export interface SendCommandRequest {
  prompt: string;
  contextId?: string;          // Project context folder (e.g., "promo-mayo-2024")
  sessionId?: string;          // Optional: reuse session
}

export interface SendCommandResponse {
  sessionId: string;
  status: 'started' | 'error';
  message: string;
}

// POST /api/videos/:id/idea
export interface SubmitIdeaRequest {
  title: string;
  description: string;
  scenes: SceneDefinition[];
}

// GET /api/videos/:id
export interface GetVideoResponse extends Video {
  scenes: Scene[];
}

// GET /api/config
export interface ConfigResponse {
  context: {
    paths: Record<string, string>;
  };
  minimax: {
    defaultDuration: 6 | 8 | 10;
    defaultResolution: '720p' | '1080p';
    defaultAspectRatio: '16:9' | '9:16';
  };
}
```

### Configuration

```typescript
// models/config.ts

export interface AppConfig {
  opencode: OpenCodeConfig;
  context: ContextConfig;
  minimax: MiniMaxConfig;
  database: DatabaseConfig;
  storage: StorageConfig;
}

export interface OpenCodeConfig {
  mode: 'acp' | 'cli' | 'skill';
  timeout: number;             // Milliseconds
  retries: number;
  acp: {
    reconnect: boolean;
    maxReconnects: number;
  };
}

export interface ContextConfig {
  paths: Record<string, string>;
}

export interface MiniMaxConfig {
  defaultDuration: 6 | 8 | 10;
  defaultResolution: '720p' | '1080p';
  defaultAspectRatio: '16:9' | '9:16';
  pollingInterval: number;     // Milliseconds
  maxPollingAttempts: number;
}

export interface DatabaseConfig {
  path: string;
}

export interface StorageConfig {
  videosPath: string;
  clipsPath: string;
  outputPath: string;
}
```

### Remotion

```typescript
// models/remotion.ts

export interface RemotionComposition {
  id: string;
  videoId: string;
  scenes: RemotionScene[];
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export interface RemotionScene {
  id: string;
  videoUrl: string;
  startFrame: number;
  endFrame: number;
  textOverlay?: RemotionTextOverlay;
}

export interface RemotionTextOverlay {
  text: string;
  startFrame: number;
  endFrame: number;
  style: TextStyle;
}

export interface TextStyle {
  fontSize: number;
  fontWeight: string;
  color: string;
  stroke?: string;
  strokeWidth?: number;
}
```

## Type Guards

```typescript
// models/guards.ts

export function isVideoStatus(status: string): status is VideoStatus {
  return [
    'draft', 'generating_idea', 'idea_ready', 'generating_clips',
    'clips_ready', 'composing', 'completed', 'failed'
  ].includes(status);
}

export function isMiniMaxStatus(status: string): status is MiniMaxStatus {
  return ['pending', 'queued', 'processing', 'success', 'fail', 'retrying'].includes(status);
}

export function isValidDuration(duration: number): duration is 6 | 8 | 10 {
  return [6, 8, 10].includes(duration);
}
```

## Validation Schemas (Zod)

```typescript
// models/validation.ts
import { z } from 'zod';

export const CreateVideoSchema = z.object({
  prompt: z.string().min(1).max(2000),
  contextKey: z.string().optional(),
});

export const SceneDefinitionSchema = z.object({
  id: z.string().uuid(),
  sequence: z.number().int().min(0),
  description: z.string(),
  duration: z.union([z.literal(6), z.literal(8), z.literal(10)]),
  prompt: z.string().min(1),
  textOverlay: z.object({
    text: z.string(),
    position: z.enum(['top', 'center', 'bottom']),
    startTime: z.number().min(0),
    endTime: z.number().min(0),
  }).optional(),
});

export const VideoIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  scenes: z.array(SceneDefinitionSchema).min(1),
});

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;
export type VideoIdeaInput = z.infer<typeof VideoIdeaSchema>;
```
