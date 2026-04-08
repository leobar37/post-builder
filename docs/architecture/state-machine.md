# State Machine - Video Pipeline

## Overview

El sistema usa una máquina de estados finita para el ciclo de vida de cada video. Los videos pertenecen a un **Proyecto**, que define el contexto para OpenCode.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROJECT SELECTION                           │
│                                                                     │
│  1. User selects project (or creates new)                          │
│  2. Project provides contextPath for OpenCode                       │
│  3. All videos created inherit this context                         │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VIDEO STATE MACHINE                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Video State Machine

```
┌─────────┐
│  draft  │◄────────────────────────────────────────┐
└────┬────┘                                         │
     │ POST /api/videos                             │
     ▼                                              │
┌─────────────────┐                                 │
│ generating_idea │──────┐                          │
└────────┬────────┘      │ Error                   │
         │               ▼                         │
         │ Success  ┌─────────┐                    │
         │          │ failed  │────────────────────┘
         ▼          └─────────┘
┌──────────────┐
│  idea_ready  │◄──────────────────────────┐
└──────┬───────┘                           │
       │ User approves                     │
       ▼                                    │
┌──────────────────┐                       │
│ editing_remotion │────┐                  │
└────────┬─────────┘    │                  │
         │ Code ready   │ Error            │
         ▼              ▼                  │
┌──────────────┐   ┌─────────┐             │
│ preview_ready│──►│ failed  │─────────────┤
└──────┬───────┘   └─────────┘             │
       │ User approves preview             │
       ▼                                    │
┌──────────────────┐     Error             │
│ generating_clips │───────────────────────┤
└────────┬─────────┘                       │
         │ All scenes complete             │
         ▼                                  │
┌───────────────┐     Error                │
│  clips_ready  │──────────────────────────┤
└───────┬───────┘                          │
        │ POST /api/videos/:id/render      │
        ▼                                  │
┌─────────────┐      Error                 │
│  composing  │────────────────────────────┘
└──────┬──────┘
       │ Render complete
       ▼
┌───────────┐
│ completed │
└───────────┘
```

## Transitions

| From | To | Trigger | Description |
|------|-----|---------|-------------|
| `draft` | `generating_idea` | `createVideo(projectId)` | User submits prompt with project |
| N/A | `draft` | `createProject()` | Creates new project with contextPath |
| `generating_idea` | `idea_ready` | OpenCode success | Idea generated |
| `generating_idea` | `failed` | OpenCode error | Generation failed |
| `idea_ready` | `editing_remotion` | `startEditing()` | User starts code editing |
| `editing_remotion` | `preview_ready` | Code generation complete | All scenes have code |
| `editing_remotion` | `failed` | Code generation error | Failed to generate code |
| `preview_ready` | `generating_clips` | `approvePreview()` | User approves design |
| `preview_ready` | `editing_remotion` | `editScene(sceneId)` | User requests edit |
| `generating_clips` | `clips_ready` | All scenes success | Clips generated |
| `generating_clips` | `failed` | Max retries exceeded | Critical failure |
| `clips_ready` | `composing` | `startRender()` | User starts export |
| `clips_ready` | `generating_clips` | `regenerateScene()` | Retry failed clip |
| `composing` | `completed` | Remotion success | Video ready |
| `composing` | `failed` | Render error | Export failed |
| `failed` | `generating_idea` | `retry()` | Manual retry |

## Scene State Machine (MiniMax)

```
┌─────────┐
│ pending │◄──────────────────────────────┐
└────┬────┘                                │
     │ API call                             │
     ▼                                      │
┌─────────┐     Fail + retry available      │
│ queued  │─────────────────────────────────┤
└────┬────┘                                 │
     │ API reports processing               │
     ▼                                      │
┌────────────┐     Fail + retry available   │
│ processing │─────────────────────────────┤
└─────┬──────┘                             │
      │ API reports success                │
      ▼                                     │
┌──────────┐     Fail (no more retries)    │
│ success  │────────────────────────────────
└──────────┘
```

## State Handlers

### Video State Handlers

```typescript
// lib/state-machine/video-states.ts

export const videoStateHandlers: Record<VideoStatus, StateHandler> = {
  draft: {
    onEnter: async (video) => {
      // Initialize video record
      await db.videos.create(video);
    },
    onExit: async (video) => {
      // Cleanup if needed
    },
  },

  generating_idea: {
    onEnter: async (video) => {
      // Load project to get contextPath
      const project = await db.projects.findById(video.projectId);

      // Spawn OpenCode session with project's context
      const session = await opencodeBridge.createSession(video.id, project.contextPath);

      // Send prompt
      await opencodeBridge.sendPrompt(video.id, video.prompt, {
        submitResultTo: `/api/videos/${video.id}/idea`,
      });
    },
    onExit: async (video) => {
      // Close session if needed
    },
    timeout: 180000, // 3 minutes
  },

  idea_ready: {
    onEnter: async (video) => {
      // Notify user (SSE)
      sseEmitter.emit(`video:${video.id}`, {
        type: 'idea_ready',
        videoId: video.id,
        idea: video.idea,
      });
    },
    // Wait for user action
  },

  editing_remotion: {
    onEnter: async (video) => {
      // Load project to get contextPath
      const project = await db.projects.findById(video.projectId);

      // Generate code for each scene using OpenCode
      for (const scene of video.idea.scenes) {
        // Build merged context: project + video + scene
        const context = await buildMergedContext(project, video, scene);

        // Generate code with OpenCode
        const code = await opencodeBridge.generateSceneCode({
          scene,
          context,
          prompt: `Genera código Remotion para: ${scene.description}`,
        });

        // Validate generated code
        const validation = validateGeneratedCode(code);
        if (!validation.valid) {
          throw new Error(`Invalid code generated for scene ${scene.id}: ${validation.errors.join(', ')}`);
        }

        // Save code to filesystem
        await saveSceneCode(scene.id, code);

        // Notify progress
        sseEmitter.emit(`video:${video.id}`, {
          type: 'code_generated',
          sceneId: scene.id,
        });
      }

      // Notify that all code is ready
      sseEmitter.emit(`video:${video.id}`, {
        type: 'code_updated',
        videoId: video.id,
      });

      // Transition to preview_ready
      await transitionTo(video.id, 'preview_ready');
    },
    onExit: async (video) => {
      // Cleanup if needed
    },
    timeout: 300000, // 5 minutes
  },

  preview_ready: {
    onEnter: async (video) => {
      sseEmitter.emit(`video:${video.id}`, {
        type: 'preview_ready',
        videoId: video.id,
        message: 'El preview está listo. Revisa el diseño y aprueba para generar clips.',
        scenes: video.idea.scenes.map(s => ({
          id: s.id,
          hasCode: true,
        })),
      });
    },
    // Wait for user action: approve or edit
  },

  generating_clips: {
    onEnter: async (video) => {
      // Create scenes in DB
      for (const sceneDef of video.idea.scenes) {
        const scene = await db.scenes.create({
          videoId: video.id,
          ...sceneDef,
          minimaxStatus: 'pending',
        });

        // Queue for generation
        await minimaxQueue.add(scene);
      }
    },
    onTransition: async (video) => {
      // Check if all scenes complete
      const pending = await db.scenes.count({
        videoId: video.id,
        minimaxStatus: { $in: ['pending', 'queued', 'processing'] },
      });

      if (pending === 0) {
        const failed = await db.scenes.count({
          videoId: video.id,
          minimaxStatus: 'fail',
        });

        if (failed > 0) {
          await transitionTo(video.id, 'failed');
        } else {
          await transitionTo(video.id, 'clips_ready');
        }
      }
    },
  },

  clips_ready: {
    onEnter: async (video) => {
      sseEmitter.emit(`video:${video.id}`, {
        type: 'clips_ready',
        videoId: video.id,
        scenes: video.scenes,
      });
    },
  },

  composing: {
    onEnter: async (video) => {
      // Start Remotion render
      const outputPath = await remotionRenderer.render(video);
      
      await db.videos.update(video.id, {
        outputPath,
        status: 'completed',
      });
    },
    timeout: 300000, // 5 minutes
  },

  completed: {
    onEnter: async (video) => {
      sseEmitter.emit(`video:${video.id}`, {
        type: 'completed',
        videoId: video.id,
        outputUrl: video.outputUrl,
      });
    },
  },

  failed: {
    onEnter: async (video, error) => {
      await db.events.create({
        videoId: video.id,
        type: 'error',
        data: { error: error?.message },
      });

      sseEmitter.emit(`video:${video.id}`, {
        type: 'failed',
        videoId: video.id,
        error: error?.message,
      });
    },
  },
};
```

## State Transition Function

```typescript
// lib/state-machine/index.ts

export async function transitionTo(
  videoId: string,
  newStatus: VideoStatus,
  context?: { error?: Error }
): Promise<void> {
  const video = await db.videos.findById(videoId);
  const oldStatus = video.status;

  // Validate transition
  if (!isValidTransition(oldStatus, newStatus)) {
    throw new Error(`Invalid transition: ${oldStatus} -> ${newStatus}`);
  }

  // Execute exit handler
  const oldHandler = videoStateHandlers[oldStatus];
  if (oldHandler?.onExit) {
    await oldHandler.onExit(video);
  }

  // Update database
  await db.videos.update(videoId, {
    status: newStatus,
    updatedAt: new Date(),
  });

  // Execute enter handler
  const newHandler = videoStateHandlers[newStatus];
  if (newHandler?.onEnter) {
    await newHandler.onEnter({ ...video, status: newStatus }, context?.error);
  }

  // Log transition
  await db.events.create({
    videoId,
    type: 'state_transition',
    data: { from: oldStatus, to: newStatus },
  });
}

function isValidTransition(from: VideoStatus, to: VideoStatus): boolean {
  const validTransitions: Record<VideoStatus, VideoStatus[]> = {
    draft: ['generating_idea'],
    generating_idea: ['idea_ready', 'failed'],
    idea_ready: ['editing_remotion'],
    editing_remotion: ['preview_ready', 'failed'],
    preview_ready: ['generating_clips', 'editing_remotion'],
    generating_clips: ['clips_ready', 'failed'],
    clips_ready: ['composing', 'generating_clips'],
    composing: ['completed', 'failed'],
    completed: [],
    failed: ['generating_idea', 'generating_clips'],
  };

  return validTransitions[from]?.includes(to) ?? false;
}
```

## Timeouts

| State | Timeout | Action on Timeout |
|-------|---------|-------------------|
| `generating_idea` | 3 min | → `failed` |
| `editing_remotion` | 5 min | → `failed` |
| `generating_clips` | 10 min per scene | Retry or → `failed` |
| `composing` | 5 min | → `failed` |

## Retry Strategy

### Scene Retry (MiniMax)

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function handleSceneFailure(scene: Scene): Promise<void> {
  if (scene.retryCount < MAX_RETRIES) {
    await db.scenes.update(scene.id, {
      minimaxStatus: 'pending',
      retryCount: scene.retryCount + 1,
    });

    await sleep(RETRY_DELAY * (scene.retryCount + 1)); // Exponential backoff
    await minimaxQueue.add(scene);
  } else {
    await db.scenes.update(scene.id, {
      minimaxStatus: 'fail',
    });

    // Check if this causes video failure
    await checkVideoCompletion(scene.videoId);
  }
}
```
