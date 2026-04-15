# T-005 — VideoService (refactor con jerarquía + OpenCode)

## Objetivo

Refactorizar `api/services/video-service.ts` para que:
1. Se acceda desde routes como service (no se llame a VideoQueries directo desde routes)
2. Soporte la jerarquía project → video → scene
3. Dispare OpenCode para generar idea

## Depende de

T-001 (types), T-002 (ProjectService — para leer context del proyecto), T-003 (EventService)

## Archivos a tocar

**Actualizar:** `api/services/video-service.ts`

## Arquitectura nueva

```
VideoService.createFromProject(projectId, prompt)
    │
    ├─ ProjectService.getById(projectId)  ──→ obtiene context_id
    ├─ VideoQueries.create()               ──→ video en DB, status: generating_idea
    ├─ OpenCodeSDK.sendPrompt()            ──→ genera idea
    ├─ VideoQueries.updateIdea()           ──→ guarda idea_json
    ├─ SceneQueries.create() × N           ──→ crea scenes desde idea
    ├─ VideoQueries.updateProgress()        ──→ actualiza progress
    └─ EventService.emit(idea_ready)       ──→ notifica al frontend
```

## Implementación (método clave: createFromProject)

```typescript
// api/services/video.service.ts (refactor)

export class VideoService {
  private projectService = getProjectService();
  private eventService = getEventService();
  private openCodeSDK = createOpenCodeSDK();

  /**
   * Flujo completo:
   * 1. Obtiene project para tener context_id
   * 2. Crea video en DB (status: generating_idea)
   * 3. Conecta OpenCode y envia prompt con contexto
   * 4. Cuando OpenCode responde, parsea idea_json
   * 5. Crea scenes en DB
   * 6. Pasa video a idea_ready
   * 7. Emite evento
   */
  async createFromProject(projectId: string, prompt: string): Promise<VideoResponse> {
    // 1. Obtener project (para context_id)
    const project = this.projectService.getById(projectId);

    // 2. Conectar OpenCode si no está conectado
    if (!this.openCodeSDK.isConnected()) {
      const session = await this.openCodeSDK.connect(`video-${Date.now()}`);
      this.eventService.emit({
        video_id: undefined,
        type: 'opencode_connected',
        source: 'opencode',
        data: { sessionId: session.id },
      });
    }

    // 3. Crear video en DB
    const video = VideoQueries.create({
      project_id: projectId,
      title: prompt.substring(0, 60), // title provisional del prompt
      prompt,
      status: 'generating_idea',
    });

    this.eventService.emit({
      video_id: video.id,
      type: 'video_created',
      source: 'system',
      data: { videoId: video.id, projectId },
    });

    // 4. Enviar prompt a OpenCode con contexto del proyecto
    const contextPath = join(process.cwd(), 'projects', project.context_id);
    const systemPrompt = await this.buildSystemPrompt(contextPath);

    // 5. OpenCode genera la idea (estructurada)
    let idea: { title: string; description: string; scenes: unknown[] };
    try {
      const response = await this.openCodeSDK.sendPromptStructured(
        `Basado en el contexto del proyecto y el prompt del usuario, genera una idea de video para Instagram Reel.

Prompt: ${prompt}

Responde con JSON válido.`,
        z.object({
          title: z.string(),
          description: z.string(),
          scenes: z.array(z.object({
            description: z.string(),
            duration: z.number().default(6),
            minimax_prompt: z.string(),
          })),
        })
      );
      idea = response.data;
    } catch (err) {
      VideoQueries.updateStatus(video.id, 'failed');
      this.eventService.emit({
        video_id: video.id,
        type: 'opencode_error',
        source: 'opencode',
        data: { error: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }

    // 6. Guardar idea en video
    VideoQueries.updateIdea(video.id, idea);

    // 7. Crear scenes en DB
    for (let i = 0; i < idea.scenes.length; i++) {
      const s = idea.scenes[i] as { description: string; duration: number; minimax_prompt: string };
      SceneQueries.create({
        video_id: video.id,
        sequence: i + 1,
        description: s.description,
        duration: s.duration,
        minimax_prompt: s.minimax_prompt,
      });
    }

    // 8. Actualizar total_scenes y progress
    VideoQueries.update(video.id, { total_scenes: idea.scenes.length });
    VideoQueries.updateProgress(video.id);

    // 9. Notificar
    this.eventService.emit({
      video_id: video.id,
      type: 'idea_ready',
      source: 'opencode',
      data: { title: idea.title, sceneCount: idea.scenes.length },
    });

    return VideoQueries.getById(video.id)!;
  }

  private async buildSystemPrompt(contextPath: string): Promise<string> {
    const files = ['system.md', 'brand.md', 'audience.md'];
    const parts: string[] = [];
    for (const file of files) {
      const filePath = join(contextPath, file);
      if (existsSync(filePath)) {
        parts.push(await readFileSync(filePath, 'utf-8'));
      }
    }
    return parts.join('\n\n');
  }

  // ─── Otros métodos existentes refactorizados ───────────────────────────────

  getById(id: string): VideoResponse {
    const video = VideoQueries.getById(id);
    if (!video) throw new Error('Video not found');
    return video;
  }

  getByProjectId(projectId: string): VideoResponse[] {
    return VideoQueries.getByProjectId(projectId);
  }

  getAll(status?: VideoStatus): VideoResponse[] {
    return VideoQueries.getAll(status);
  }

  async approveIdea(videoId: string): Promise<VideoResponse> {
    const video = VideoQueries.getById(videoId);
    if (!video) throw new Error('Video not found');
    if (video.status !== 'idea_ready') {
      throw new Error(`Cannot approve: video is ${video.status}`);
    }

    VideoQueries.updateStatus(videoId, 'generating_clips');

    this.eventService.emit({
      video_id: videoId,
      type: 'scene_created',
      source: 'system',
      data: { message: 'Ready to generate clips' },
    });

    return VideoQueries.getById(videoId)!;
  }

  async startRender(videoId: string): Promise<VideoResponse> {
    const video = VideoQueries.getById(videoId);
    if (!video) throw new Error('Video not found');

    VideoQueries.updateStatus(videoId, 'composing');
    return VideoQueries.getById(videoId)!;
  }

  // ... el resto de métodos existentes adaptados
}
```

## Notas

- Se reutiliza `OpenCodeSDK` de `api/core/opencode/sdk.ts`
- `sendPromptStructured` usa Zod para validar la respuesta de OpenCode
- Los métodos que disparan operaciones async (OpenCode, MiniMax) son `async`
- Los métodos de solo lectura son síncronos
- Se mantiene backward compatibility con el método `buildFinalVideo` existente

## Validación

- `tsc --noEmit` pasa
- Los routes pueden borrar sus llamados directos a `VideoQueries`
