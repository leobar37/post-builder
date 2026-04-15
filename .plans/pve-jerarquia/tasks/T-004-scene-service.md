# T-004 — SceneService

## Objetivo

Crear `api/services/scene.service.ts` con lógica de negocio para escenas individuales.

## Depende de

T-001 (types), T-003 (EventService — paraemitir eventos de progreso)

## Archivos a tocar

**Nuevo:** `api/services/scene.service.ts`

## Implementación

```typescript
// api/services/scene.service.ts
import { SceneQueries, VideoQueries } from '../db/client';
import { getEventService } from './event.service';
import { getMiniMaxService } from './minimax.service';
import type { SceneResponse } from '../types';

export class SceneService {
  private eventService = getEventService();
  private minimaxService = getMiniMaxService();

  getById(id: string): SceneResponse {
    const scene = SceneQueries.getById(id);
    if (!scene) throw new Error('Scene not found');
    return scene;
  }

  getByVideoId(videoId: string): SceneResponse[] {
    return SceneQueries.getByVideoId(videoId);
  }

  /**
   * Genera una escena con MiniMax
   * - Crea task en MiniMax API
   * - Actualiza scene con minimax_task_id y status 'queued'
   * - Emite evento
   */
  async generateScene(id: string, outputDir: string): Promise<SceneResponse> {
    const scene = SceneQueries.getById(id);
    if (!scene) throw new Error('Scene not found');

    if (!scene.minimax_prompt) {
      throw new Error('Scene has no minimax_prompt');
    }

    // Crear task en MiniMax
    const task = await this.minimaxService.createVideoGeneration({
      prompt: scene.minimax_prompt,
      duration: scene.duration as 6 | 8 | 10,
      resolution: '1080p',
      aspectRatio: '9:16',
    });

    // Actualizar scene
    SceneQueries.updateStatus(id, 'queued', { taskId: task.taskId });
    VideoQueries.updateProgress(scene.video_id);

    this.eventService.emit({
      video_id: scene.video_id,
      type: 'minimax_queued',
      source: 'minimax',
      data: { scene_id: id, task_id: task.taskId },
    });

    return SceneQueries.getById(id)!;
  }

  /**
   * Cancela una escena en curso
   */
  async cancelScene(id: string): Promise<SceneResponse> {
    const scene = SceneQueries.getById(id);
    if (!scene) throw new Error('Scene not found');

    if (!scene.minimax_task_id) {
      throw new Error('Scene has no active MiniMax task');
    }

    // MiniMax no tiene cancel API público, pero marcamos como cancelled
    SceneQueries.updateStatus(id, 'fail', { errorMessage: 'Cancelled by user' });

    this.eventService.emit({
      video_id: scene.video_id,
      type: 'minimax_fail',
      source: 'minimax',
      data: { scene_id: id, error: 'Cancelled by user' },
    });

    VideoQueries.updateProgress(scene.video_id);
    return SceneQueries.getById(id)!;
  }

  /**
   * Reintenta una escena fallida
   */
  async retryScene(id: string, outputDir: string): Promise<SceneResponse> {
    const scene = SceneQueries.getById(id);
    if (!scene) throw new Error('Scene not found');
    if (scene.minimax_status !== 'fail') {
      throw new Error('Can only retry failed scenes');
    }

    SceneQueries.update(id, {
      minimax_status: 'pending',
      retry_count: scene.retry_count + 1,
    } as Partial<Scene>);

    return this.generateScene(id, outputDir);
  }

  /**
   * Actualiza datos de una escena (ej: prompt改了)
   */
  updateScene(id: string, data: { description?: string; duration?: number; minimax_prompt?: string }): SceneResponse {
    const scene = SceneQueries.getById(id);
    if (!scene) throw new Error('Scene not found');
    SceneQueries.update(id, data as Partial<Scene>);
    return SceneQueries.getById(id)!;
  }
}

let instance: SceneService | null = null;
export function getSceneService(): SceneService {
  if (!instance) instance = new SceneService();
  return instance;
}
```

## Notas

- `MiniMaxService` se llama directamente desde el service (no hay route para MiniMax)
- Los eventos de scene (queued, processing, success, fail) se emiten a través de EventService
- El `outputDir` se pasa como parámetro porque el service no sabe de paths de filesystem más allá del proyecto
- `SceneQueries.update` se usa con `Partial<Scene>` para campos opcionales

## Validación

- `tsc --noEmit` pasa
- Los methods lanzan errores claros
- El service no sabe de HTTP ni de SSE
