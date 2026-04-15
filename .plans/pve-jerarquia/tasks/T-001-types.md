# T-001 — Tipos request/response centralizados

## Objetivo

Crear un archivo `api/types/index.ts` (o `api/types/api.ts`) con todas las interfaces TypeScript para requests y responses de los endpoints. Esto reemplaza los `req.body as any` que hay hoy en los routes.

## Archivos a tocar

**Nuevo:** `api/types/index.ts`

## Interfaces requeridas

```typescript
// ─── Projects ───────────────────────────────────────────────────────────────

export interface CreateProjectRequest {
  name: string;
  description?: string;
  context_id: string;
  config?: Record<string, unknown>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'archived' | 'deleted';
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  context_id: string;
  config: Record<string, unknown> | null;
  status: 'active' | 'archived' | 'deleted';
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

// ─── Videos ─────────────────────────────────────────────────────────────────

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

// ─── Scenes ─────────────────────────────────────────────────────────────────

export type SceneStatus = 'pending' | 'queued' | 'processing' | 'success' | 'fail' | 'retrying';

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
  created_at: string;
  updated_at: string;
  generated_at: string | null;
}

export interface SceneListResponse {
  scenes: SceneResponse[];
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventType =
  | 'opencode_connected' | 'opencode_message' | 'opencode_tool_call'
  | 'opencode_error' | 'opencode_done'
  | 'minimax_queued' | 'minimax_processing' | 'minimax_success'
  | 'minimax_fail' | 'minimax_downloaded'
  | 'video_created' | 'scene_created' | 'scene_updated'
  | 'idea_ready' | 'clips_ready'
  | 'composition_started' | 'composition_completed'
  | 'error' | 'state_transition';

export interface EventResponse {
  id: number;
  video_id: string | null;
  session_id: string | null;
  type: EventType;
  source: 'opencode' | 'minimax' | 'system';
  data: Record<string, unknown> | null;
  created_at: string;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export type VideoStatus =
  | 'draft' | 'generating_idea' | 'idea_ready'
  | 'generating_clips' | 'clips_ready'
  | 'composing' | 'completed' | 'failed';
```

## Notas

- Los tipos `VideoStatus` y `SceneStatus` se exportan desde `api/types/index.ts` para que services y routes usen los mismos.
- No incluir lógica de negocio, solo tipos.
- Verificar que los tipos coincidan con los campos del `client.ts` actualizado.

## Validación

- `tsc --noEmit` pasa sin errores en `api/types/index.ts`
- Los routes pueden importar de `api/types` en vez de definir inline
