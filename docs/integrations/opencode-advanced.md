# OpenCode Advanced Control

## Overview

Control avanzado de OpenCode con selección de modelos según tipo de tarea, prompts especializados por operación, y estrategias de fallback para máxima flexibilidad.

## Configuración de Modelos

### Estructura YAML

```yaml
# ============================================
# OpenCode Advanced Configuration
# ============================================
opencode:
  # Configuración por defecto
  mode: 'acp'
  timeout: 180000

  # CONFIGURACIÓN DE MODELOS
  models:
    # Modelo por defecto para tareas generales
    default:
      provider: "anthropic"
      model: "claude-sonnet-4-6"
      temperature: 0.7
      max_tokens: 4000

    # Modelo para generación de ideas complejas
    idea_generation:
      provider: "anthropic"
      model: "claude-opus-4-6"  # Más potente para creatividad
      temperature: 0.8          # Más creativo
      max_tokens: 8000
      system_prompt: |
        Eres un experto en marketing de gimnasios y fitness.
        Genera ideas de video creativas y atractivas para Instagram Reels.

    # Modelo para generación de código Remotion
    code_generation:
      provider: "anthropic"
      model: "claude-sonnet-4-6"  # Balance velocidad/calidad
      temperature: 0.2            # Más determinístico
      max_tokens: 4000
      system_prompt: |
        Eres un experto en React y Remotion.
        Genera código TypeScript/React válido y bien estructurado.
        Sigue las mejores prácticas de componentes funcionales.

    # Modelo para ediciones rápidas
    editing:
      provider: "anthropic"
      model: "claude-haiku-4-5"   # Rápido para iteraciones
      temperature: 0.3
      max_tokens: 2000

    # Modelo económico para tareas simples
    economy:
      provider: "openai"
      model: "gpt-4o-mini"
      temperature: 0.7
      max_tokens: 2000

  # Proveedores disponibles
  providers:
    anthropic:
      api_key: "${ANTHROPIC_API_KEY}"
      base_url: "https://api.anthropic.com/v1"

    openai:
      api_key: "${OPENAI_API_KEY}"
      base_url: "https://api.openai.com/v1"

    # Proveedor local (Ollama, etc.)
    local:
      base_url: "http://localhost:11434/v1"
      model: "llama3.1"
```

## OpenCodeBridge con Selección de Modelo

```typescript
// lib/opencode/bridge.ts

import { EventEmitter } from 'events';

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'local';
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_prompt?: string;
  tools?: string[];
}

export interface OpenCodeModelsConfig {
  default: ModelConfig;
  idea_generation: ModelConfig;
  code_generation: ModelConfig;
  editing: ModelConfig;
  economy?: ModelConfig;
  custom?: Record<string, ModelConfig>;
}

export class OpenCodeBridge extends EventEmitter {
  private clients: Map<string, AcpClient> = new Map();
  private config: OpenCodeConfig;

  constructor(config: OpenCodeConfig) {
    super();
    this.config = config;
  }

  /**
   * Envía un prompt usando el modelo configurado para la tarea
   */
  async sendPrompt(
    sessionId: string,
    prompt: string,
    options: {
      taskType?: 'idea' | 'code' | 'editing' | 'economy';
      context?: any;
    } = {}
  ): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) throw new Error(`Session ${sessionId} not found`);

    // Seleccionar modelo según tipo de tarea
    const modelConfig = this.selectModel(options.taskType);

    // Emitir metadata del modelo usado
    this.emit('event', {
      type: 'model_selected',
      sessionId,
      data: {
        provider: modelConfig.provider,
        model: modelConfig.model,
        taskType: options.taskType || 'default',
      },
    });

    // Enviar mensaje con configuración del modelo
    await client.sendMessage({
      role: 'user',
      content: prompt,
      context: options.context,
      // Parámetros del modelo (depende del proveedor)
      model_params: {
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        top_p: modelConfig.top_p,
      },
    });
  }

  /**
   * Selecciona el modelo apropiado según el tipo de tarea
   */
  private selectModel(taskType?: string): ModelConfig {
    const models = this.config.models;

    switch (taskType) {
      case 'idea':
        return models.idea_generation || models.default;
      case 'code':
        return models.code_generation || models.default;
      case 'editing':
        return models.editing || models.code_generation || models.default;
      case 'economy':
        return models.economy || models.default;
      default:
        return models.default;
    }
  }

  /**
   * Crea una nueva sesión de OpenCode
   * OpenCode se ejecuta siempre desde workspace/, accede a contexto via projects/{contextId}/
   */
  async createSession(
    sessionId: string,
    contextId?: string,  // Project context folder (e.g., "promo-mayo-2024")
    options?: {
      taskType?: 'idea' | 'code' | 'editing' | 'economy';
    }
  ): Promise<AcpClient> {
    const modelConfig = this.selectModel(options?.taskType);

    const client = new AcpClient({
      provider: modelConfig.provider,
      model: modelConfig.model,
      contextId,  // Referencia a carpeta projects/{contextId}/
      systemPrompt: modelConfig.system_prompt,
    });

    this.clients.set(sessionId, client);

    // Forward events
    client.on('event', (event) => {
      this.emit('event', { ...event, sessionId });
    });

    return client;
  }
}
```

## Mapeo de Tareas a Modelos

```typescript
// lib/opencode/task-mapping.ts

// Mapeo de operaciones del sistema a tipos de modelo
export const TASK_MODEL_MAPPING = {
  // Generación de ideas
  'generate_video_idea': 'idea',
  'analyze_context': 'idea',
  'create_storyboard': 'idea',

  // Generación de código
  'generate_scene_code': 'code',
  'create_composition': 'code',
  'setup_transitions': 'code',

  // Edición
  'edit_scene': 'editing',
  'modify_animation': 'editing',
  'change_text': 'editing',
  'adjust_timing': 'editing',

  // Tareas simples (pueden usar economía)
  'summarize': 'economy',
  'validate': 'economy',
} as const;

export type TaskType = keyof typeof TASK_MODEL_MAPPING;

/**
 * Obtiene el tipo de modelo para una tarea
 */
export function getTaskModelType(taskName: TaskType): string {
  return TASK_MODEL_MAPPING[taskName] || 'default';
}

// Uso en la API
export async function handleGenerateIdea(
  bridge: OpenCodeBridge,
  sessionId: string,
  prompt: string,
  context: any
): Promise<void> {
  await bridge.sendPrompt(sessionId, prompt, {
    taskType: 'idea',  // Usa modelo idea_generation
    context,
  });
}

export async function handleEditScene(
  bridge: OpenCodeBridge,
  sessionId: string,
  instruction: string,
  context: any
): Promise<void> {
  await bridge.sendPrompt(sessionId, instruction, {
    taskType: 'editing',  // Usa modelo editing (rápido)
    context,
  });
}
```

## Comparativa de Modelos

| Modelo | Uso Recomendado | Velocidad | Costo | Calidad Código | Creatividad |
|--------|-----------------|-----------|-------|----------------|-------------|
| Claude Opus 4.6 | Ideas complejas | Lenta | Alta | Alta | Muy Alta |
| Claude Sonnet 4.6 | Código, balance | Media | Media | Alta | Alta |
| Claude Haiku 4.5 | Ediciones rápidas | Rápida | Baja | Media | Media |
| GPT-4o | General | Media | Media | Alta | Alta |
| GPT-4o-mini | Tareas simples | Rápida | Muy Baja | Media | Media |
| Llama 3.1 (local) | Desarrollo offline | Variable | Gratis | Media | Media |

## Prompts Especializados por Modelo

```typescript
// lib/opencode/system-prompts.ts

export const SYSTEM_PROMPTS = {
  idea_generation: `
Eres un director creativo especializado en marketing fitness.
Tu trabajo es crear ideas de video atractivas para Instagram Reels.

Directrices:
- Videos de 15-30 segundos (6-10 segundos por escena)
- Enfoque en beneficios, no características
- Usa storytelling: problema → solución → CTA
- Mantén energía alta y motivadora

Formato de salida:
{
  "title": "Título catchy",
  "description": "Concepto general",
  "scenes": [
    {"sequence": 0, "description": "...", "duration": 6, "prompt": "..."}
  ]
}
`,

  code_generation: `
Eres un desarrollador React/Remotion experto.
Genera código limpio, tipado y eficiente.

Reglas estrictas:
1. Usa TypeScript con tipos explícitos
2. Exporta SIEMPRE un componente default
3. Dimensiones: 1080x1920 para Instagram Reels
4. Usa hooks de Remotion: useCurrentFrame, useVideoConfig
5. Animaciones con spring() o interpolate()
6. NUNCA uses librerías externas (solo remotion)

Estructura del componente:
interface SceneProps {
  // props específicas
}

export default function Scene(props: SceneProps) {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // tu lógica aquí

  return (
    <AbsoluteFill>
      {/* contenido */}
    </AbsoluteFill>
  );
}
`,

  editing: `
Eres un editor de código rápido y preciso.
Modifica el código según la instrucción del usuario.

Restricciones:
- Mantén la estructura general intacta
- Solo cambia lo solicitado
- Preserva los imports existentes
- Mantén los tipos TypeScript

Responde ÚNICAMENTE con el código modificado, sin explicaciones.
`,
};
```

## Estrategia de Fallback

```typescript
// lib/opencode/fallback.ts

import { OpenCodeBridge } from './bridge';

/**
   * Estrategia de fallback si un modelo falla
   */
export async function sendWithFallback(
  bridge: OpenCodeBridge,
  sessionId: string,
  prompt: string,
  options: {
    taskType?: 'idea' | 'code' | 'editing' | 'economy';
    context?: any;
  }
): Promise<void> {
  const fallbackChain = [
    options.taskType,
    'default',
    'economy',  // Último recurso
  ].filter(Boolean);

  const errors: Error[] = [];

  for (const taskType of fallbackChain) {
    try {
      await bridge.sendPrompt(sessionId, prompt, {
        ...options,
        taskType: taskType as any,
      });

      // Emitir evento de éxito con fallback usado
      bridge.emit('event', {
        type: 'fallback_success',
        sessionId,
        data: {
          originalTask: options.taskType,
          fallbackUsed: taskType,
          attempts: errors.length + 1,
        },
      });

      return;  // Éxito
    } catch (error) {
      console.warn(`Model ${taskType} failed, trying fallback...`);
      errors.push(error as Error);
      continue;  // Intentar siguiente
    }
  }

  // Todos los modelos fallaron
  throw new AggregateError(errors, 'All models failed');
}

/**
 * Circuit breaker simple
 */
export class ModelCircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailure: Map<string, number> = new Map();
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minuto

  canUse(model: string): boolean {
    const failures = this.failures.get(model) || 0;
    const lastFail = this.lastFailure.get(model) || 0;

    if (failures >= this.threshold) {
      const timeSinceLastFail = Date.now() - lastFail;
      if (timeSinceLastFail < this.timeout) {
        return false; // Circuito abierto
      }
      // Reset después del timeout
      this.failures.set(model, 0);
    }

    return true;
  }

  recordFailure(model: string): void {
    const current = this.failures.get(model) || 0;
    this.failures.set(model, current + 1);
    this.lastFailure.set(model, Date.now());
  }
}
```

## Ejemplos de Uso

### Ejemplo 1: Generar idea creativa (modelo potente)

```typescript
await openCode.sendPrompt(sessionId,
  "Crea una idea viral para promocionar el gimnasio",
  { taskType: 'idea' }  // Usa Claude Opus
);
```

### Ejemplo 2: Generar código (modelo balanceado)

```typescript
await openCode.sendPrompt(sessionId,
  "Crea una escena con el logo girando",
  { taskType: 'code' }  // Usa Claude Sonnet
);
```

### Ejemplo 3: Edición rápida (modelo rápido)

```typescript
await openCode.sendPrompt(sessionId,
  "Cambia el color del texto a azul",
  { taskType: 'editing' }  // Usa Claude Haiku
);
```

### Ejemplo 4: Fallback automático

```typescript
await sendWithFallback(openCode, sessionId, prompt, {
  taskType: 'code',
  context: sceneContext,
});
```

### Ejemplo 5: Generación de video completo con modelos especializados

```typescript
async function generateVideoWithModels(videoId: string, prompt: string) {
  // 1. Crear sesión para generación de ideas (modelo potente)
  // OpenCode se ejecuta desde workspace/, contextId referencia projects/{id}/
  const ideaSession = await openCode.createSession(videoId, 'promo-mayo-2024', {
    taskType: 'idea',
  });

  // 2. Generar idea
  await openCode.sendPrompt(ideaSession.id, prompt, { taskType: 'idea' });

  // 3. Esperar y procesar idea...

  // 4. Para cada escena, generar código (modelo balanceado)
  for (const scene of idea.scenes) {
    await openCode.sendPrompt(
      ideaSession.id,
      `Genera código para: ${scene.description}`,
      { taskType: 'code' }
    );
  }
}
```

## Consideraciones

### Variables de Entorno

Cada proveedor necesita su propia API key:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Cost Tracking

Para tracking de costos por modelo:

```typescript
interface CostTracker {
  trackUsage(
    model: string,
    tokensIn: number,
    tokensOut: number
  ): void;

  getCostForVideo(videoId: string): number;
  getCostByModel(): Record<string, number>;
}
```

### Rate Limiting

Diferentes límites por proveedor:

```typescript
const RATE_LIMITS = {
  anthropic: { rpm: 50, tpm: 40000 },
  openai: { rpm: 60, tpm: 60000 },
  local: { rpm: Infinity, tpm: Infinity },
};
```

### Streaming

Algunos modelos soportan streaming, otros no:

```typescript
async function* streamResponse(
  sessionId: string,
  prompt: string,
  options: { taskType?: string }
): AsyncGenerator<string> {
  const model = openCode.selectModel(options.taskType);

  if (supportsStreaming(model.provider)) {
    yield* openCode.stream(sessionId, prompt, options);
  } else {
    const response = await openCode.sendPrompt(sessionId, prompt, options);
    yield response;
  }
}
```

## Ver También

- [OpenCode Integration](./opencode.md) - Integración básica
- [Configuration Schema](../configuration/schema.md) - Configuración completa
- [Remotion Code Generation](./remotion-code-generation.md) - Generación de código con modelos especializados
