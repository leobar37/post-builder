# T-003: VideoEditorAgent Implementation

## Objective
Implementar el agente específico para edición de video con tools y prompts especializados.

## Requirements
- FR-001: VideoEditorAgent Core
- FR-003: Tool System
- FR-007: Extensibilidad

## Implementation

### 1. Tipos específicos

**File: `src/agent/video-editor/types.ts`**
```typescript
import type { AgentSession } from '../core/types';

export interface VideoEditorSession extends AgentSession {
  metadata: {
    sceneId: string;
    videoId: string;
    projectId: string;
    sceneType: 'hook' | 'stats' | 'cta' | 'transition';
    currentCode?: string;
  };
}

export interface SceneContext {
  projectName: string;
  brandColors: string[];
  targetAudience: string;
  videoObjective: 'awareness' | 'conversion' | 'engagement';
}
```

### 2. System Prompt

**File: `src/agent/video-editor/prompts/system.ts`**
```typescript
import type { VideoEditorSession } from '../types';

export function buildVideoEditorSystemPrompt(session: VideoEditorSession): string {
  const { metadata } = session;

  return `You are an expert video editor AI assistant specializing in creating Instagram Reels and short-form video content.

CONTEXT:
- Scene ID: ${metadata.sceneId}
- Video ID: ${metadata.videoId}
- Project ID: ${metadata.projectId}
- Scene Type: ${metadata.sceneType}

YOUR CAPABILITIES:
1. Generate React/TypeScript code using Remotion for video scenes
2. Suggest visual improvements and animations
3. Optimize for 9:16 aspect ratio (1080x1920)
4. Consider brand guidelines and target audience

TOOLS AVAILABLE:
- \\\"editSceneCode\\\": Generate or modify scene code (invokes OpenCode)
- \\\"updateSceneConfig\\\": Update scene configuration
- \\\"generateVideo\\\": Start video generation process

RULES:
- Always confirm changes with the user before applying
- Provide code explanations when relevant
- Suggest optimizations for performance
- Consider the scene's position in the overall video flow

RESPONSE STYLE:
- Concise but informative
- Use bullet points for lists
- Include code snippets when discussing code changes`;
}
```

### 3. VideoEditorAgent

**File: `src/agent/video-editor/VideoEditorAgent.ts`**
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { Agent } from '../core/Agent';
import type { AgentConfig, AgentSession } from '../core/types';
import { buildVideoEditorSystemPrompt } from './prompts/system';
import type { VideoEditorSession } from './types';

export interface VideoEditorConfig extends AgentConfig {
  // Configuración específica del video editor
  defaultSceneDuration?: number;
  brandColors?: string[];
}

export class VideoEditorAgent extends Agent {
  private sceneContext: Map<string, unknown> = new Map();

  constructor(config: VideoEditorConfig) {
    super(config);
  }

  /**
   * Set scene context for better responses
   */
  setSceneContext(sessionId: string, context: unknown): void {
    this.sceneContext.set(sessionId, context);
  }

  /**
   * Build system prompt specific to video editing
   */
  protected buildSystemPrompt(session: AgentSession): string {
    return buildVideoEditorSystemPrompt(session as VideoEditorSession);
  }

  /**
   * Get AI model based on configuration
   */
  protected getModel(): any {
    const modelName = this.config.model;

    if (modelName.startsWith('claude')) {
      return anthropic(modelName);
    }
    if (modelName.startsWith('gpt')) {
      return openai(modelName);
    }

    // Default to Claude
    return anthropic('claude-3-5-sonnet-20241022');
  }

  /**
   * Process message with video editor specific logic
   */
  async processMessage(
    session: VideoEditorSession,
    userMessage: string
  ): Promise<ReadableStream> {
    // Inyectar contexto de escena si existe
    const context = this.sceneContext.get(session.sessionId);
    if (context) {
      // El contexto se maneja a nivel de system prompt o mensajes
      // Implementación específica aquí
    }

    return super.processMessage(session, userMessage);
  }
}
```

### 4. Factory e index

**File: `src/agent/video-editor/index.ts`**
```typescript
import { VideoEditorAgent } from './VideoEditorAgent';
import type { VideoEditorConfig, VideoEditorSession } from './types';

export { VideoEditorAgent };
export type { VideoEditorConfig, VideoEditorSession };

// Singleton instance
let agent: VideoEditorAgent | null = null;

export function getVideoEditorAgent(config?: VideoEditorConfig): VideoEditorAgent {
  if (!agent) {
    agent = new VideoEditorAgent(config || {
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
      apiKey: process.env.AI_API_KEY || '',
      temperature: 0.7,
      maxSteps: 5,
    });
  }
  return agent;
}
```

## Verification

- [ ] VideoEditorAgent extiende correctamente la clase Agent
- [ ] buildSystemPrompt incluye contexto de escena
- [ ] getModel soporta múltiples providers (Anthropic, OpenAI)
- [ ] Factory function getVideoEditorAgent funciona correctamente
- [ ] Tipos exportados y usables desde otros módulos

## Dependencies
- T-002: Agent Core Infrastructure
- Variables de entorno: `AI_MODEL`, `AI_API_KEY`

## Estimated Effort
5-6 hours
