// API Types - Request/Response contracts for Projects → Videos → Scenes API

// ─── Entity Types (from database) ─────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  context_id: string;
  config: Record<string, unknown> | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  project_id: string | null;
  title: string;
  status: VideoStatus;
  prompt: string | null;
  idea_title: string | null;
  idea_description: string | null;
  idea_json: string | null;
  context: Record<string, unknown> | null;
  output_path: string | null;
  output_url: string | null;
  total_scenes: number;
  completed_scenes: number;
  progress: number;
  active_scene_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type SceneType = 'hook' | 'stats' | 'cta' | 'transition';

export interface Scene {
  id: string;
  video_id: string;
  sequence: number;
  description: string | null;
  duration: number;
  scene_type: SceneType | null;
  minimax_task_id: string | null;
  minimax_status: SceneStatus | null;
  minimax_prompt: string | null;
  context: Record<string, unknown> | null;
  clip_path: string | null;
  clip_url: string | null;
  file_id: string | null;
  error_message: string | null;
  retry_count: number;
  code_edit_status: SceneCodeEditStatus;
  code_edit_job_id: string | null;
  code_path: string | null;
  agent_session_id: string | null;
  created_at: string;
  updated_at: string;
  generated_at: string | null;
}

export interface Event {
  id: number;
  video_id: string | null;
  session_id: string | null;
  type: EventType;
  source: EventSource;
  data: Record<string, unknown> | null;
  created_at: string;
}

// ─── Project Status ───────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived' | 'deleted';

// ─── Video Status ─────────────────────────────────────────────────────────────

export type VideoStatus =
  | 'draft'
  | 'generating_idea'
  | 'idea_ready'
  | 'generating_clips'
  | 'clips_ready'
  | 'composing'
  | 'completed'
  | 'failed';

// ─── Scene Status ─────────────────────────────────────────────────────────────

export type SceneStatus = 'pending' | 'queued' | 'processing' | 'success' | 'fail' | 'retrying';
export type SceneCodeEditStatus = 'idle' | 'editing' | 'completed' | 'failed';

// ─── Event Types ──────────────────────────────────────────────────────────────

export type EventType =
  | 'opencode_connected'
  | 'opencode_message'
  | 'opencode_tool_call'
  | 'opencode_error'
  | 'opencode_done'
  | 'minimax_queued'
  | 'minimax_processing'
  | 'minimax_success'
  | 'minimax_fail'
  | 'minimax_downloaded'
  | 'video_created'
  | 'scene_created'
  | 'scene_updated'
  | 'scene_code_edit_started'
  | 'scene_code_edit_completed'
  | 'scene_code_edit_failed'
  | 'idea_ready'
  | 'clips_ready'
  | 'composition_started'
  | 'composition_completed'
  | 'error'
  | 'state_transition';

export type EventSource = 'opencode' | 'minimax' | 'system';

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface CreateProjectRequest {
  name: string;
  description?: string;
  context_id: string;
  config?: Record<string, unknown>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  context_id: string;
  config: Record<string, unknown> | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithCounts extends ProjectResponse {
  video_count: number;
  completed_videos: number;
}

export interface ProjectListResponse {
  projects: ProjectWithCounts[];
  total: number;
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export interface CreateVideoRequest {
  prompt: string;
}

export interface VideoResponse {
  id: string;
  project_id: string;
  title: string;
  status: VideoStatus;
  prompt: string | null;
  idea_title: string | null;
  idea_description: string | null;
  idea_json: unknown | null;
  context: Record<string, unknown> | null;
  output_path: string | null;
  output_url: string | null;
  total_scenes: number;
  completed_scenes: number;
  progress: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface VideoWithScenes extends VideoResponse {
  scenes: SceneResponse[];
}

export interface VideoListResponse {
  videos: VideoResponse[];
  total: number;
}

// ─── Scenes ───────────────────────────────────────────────────────────────────

export interface SceneResponse {
  id: string;
  video_id: string;
  sequence: number;
  description: string | null;
  duration: number;
  minimax_task_id: string | null;
  minimax_status: SceneStatus | null;
  minimax_prompt: string | null;
  context: Record<string, unknown> | null;
  clip_path: string | null;
  clip_url: string | null;
  file_id: string | null;
  error_message: string | null;
  retry_count: number;
  code_edit_status: SceneCodeEditStatus;
  code_edit_job_id: string | null;
  code_path: string | null;
  created_at: string;
  updated_at: string;
  generated_at: string | null;
}

export interface SceneListResponse {
  scenes: SceneResponse[];
}

export interface UpdateSceneRequest {
  description?: string;
  duration?: number;
  minimax_prompt?: string;
  context?: Record<string, unknown>;
  code_edit_status?: SceneCodeEditStatus;
  code_edit_job_id?: string;
  code_path?: string;
}

// Scene code editing
export interface SceneCodeEditRequest {
  sceneId: string;
  description: string;
  requirements?: string[];
}

export interface SceneCodeEditResponse {
  success: boolean;
  sceneId: string;
  jobId: string;
  status: 'editing';
  message: string;
}

export interface SceneCodeEditCallbackBody {
  status: 'completed' | 'failed';
  files?: string[];
  error?: string;
  summary?: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface EventResponse {
  id: number;
  video_id: string | null;
  session_id: string | null;
  type: EventType;
  source: EventSource;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface EventListResponse {
  events: EventResponse[];
}

// ─── SSE Event (for streaming) ────────────────────────────────────────────────

export interface SSEEvent {
  type: EventType;
  source: EventSource;
  data: Record<string, unknown> | null;
  timestamp: string;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
