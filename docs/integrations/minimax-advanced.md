# MiniMax Advanced Control

## Overview

Control granular de las generaciones de video con MiniMax Hailuo AI, incluyendo cancelación de trabajos en curso, regeneración de escenas individuales, parámetros avanzados por escena, y gestión completa del ciclo de vida de las generaciones.

## Estados Extendidos de Generación

```typescript
// Estados extendidos para control granular
export type MiniMaxStatus =
  | 'pending'      // Esperando inicio
  | 'queued'       // En cola de MiniMax
  | 'processing'   // Generando
  | 'cancelling'   // Cancelación solicitada
  | 'cancelled'    // Cancelado exitosamente
  | 'success'      // Completado
  | 'fail'         // Fallido
  | 'retrying';    // Reintentando

// Metadata extendida del trabajo
export interface MiniMaxJobMetadata {
  taskId: string;
  status: MiniMaxStatus;
  
  // Control de tiempos
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Progreso detallado
  progress: {
    percentage: number;
    stage: 'initialization' | 'generation' | 'encoding' | 'uploading';
    estimatedTimeRemaining?: number;  // segundos
  };
  
  // Parámetros usados
  params: MiniMaxGenerationParams;
  
  // Historial de reintentos
  attempts: {
    attemptNumber: number;
    status: MiniMaxStatus;
    error?: string;
    timestamp: Date;
  }[];
}
```

## Parámetros Avanzados de Generación

```typescript
export interface MiniMaxGenerationParams {
  // Básicos (ya documentados en minimax.md)
  prompt: string;
  duration: 6 | 8 | 10;
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16';
  
  // AVANZADOS
  
  // Modelo específico de MiniMax
  model?: 'T2V-01-Director' | 'T2V-01' | 'I2V-01';
  
  // Control de movimiento/cámara
  cameraControl?: {
    type: 'static' | 'pan' | 'zoom_in' | 'zoom_out' | 'orbit';
    speed?: 'slow' | 'normal' | 'fast';
  };
  
  // Estilo visual
  visualStyle?: {
    cinematic?: boolean;      // Look cinematográfico
    lighting?: 'natural' | 'studio' | 'dramatic' | 'neon';
    colorGrade?: 'warm' | 'cool' | 'vibrant' | 'muted' | 'bw';
  };
  
  // Control de calidad/velocidad
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  
  // Negative prompt (qué evitar)
  negativePrompt?: string;
  
  // Seed para reproducibilidad
  seed?: number;
  
  // Referencia de imagen (para I2V - Image to Video)
  imageReference?: {
    fileId: string;
    influence: 'low' | 'medium' | 'high';
  };
}
```

## API Endpoints de Control

### Generar Escena Individual

```http
POST /api/scenes/:sceneId/generate
Content-Type: application/json

{
  "prompt": "Atleta haciendo sentadillas en gimnasio moderno",
  "params": {
    "model": "T2V-01-Director",
    "cameraControl": {
      "type": "zoom_in",
      "speed": "slow"
    },
    "visualStyle": {
      "cinematic": true,
      "lighting": "studio"
    },
    "quality": "high"
  },
  "priority": "high"
}
```

**Response:**
```json
{
  "sceneId": "scene-uuid",
  "taskId": "minimax-task-123",
  "status": "queued",
  "estimatedTime": 120,
  "queuePosition": 2
}
```

### Cancelar Generación

```http
POST /api/scenes/:sceneId/cancel
```

**Response:**
```json
{
  "sceneId": "scene-uuid",
  "taskId": "minimax-task-123",
  "status": "cancelled",
  "refunded": false
}
```

### Regenerar Escena

```http
POST /api/scenes/:sceneId/regenerate
Content-Type: application/json

{
  "useSamePrompt": false,
  "newPrompt": "Atleta haciendo sentadillas, ángulo más amplio",
  "params": {
    "quality": "ultra",
    "seed": 12345
  },
  "reason": "quality"
}
```

### Estado Detallado

```http
GET /api/scenes/:sceneId/status
```

**Response:**
```json
{
  "sceneId": "scene-uuid",
  "status": "processing",
  "progress": {
    "percentage": 65,
    "stage": "generation",
    "estimatedTimeRemaining": 45
  },
  "metadata": {
    "taskId": "minimax-task-123",
    "queuedAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z",
    "params": { ... },
    "attempts": [
      {
        "attemptNumber": 1,
        "status": "processing",
        "timestamp": "2024-01-15T10:30:05Z"
      }
    ]
  }
}
```

### Generar Todas las Escenas

```http
POST /api/videos/:videoId/generate-all
Content-Type: application/json

{
  "baseParams": {
    "resolution": "1080p",
    "quality": "high",
    "visualStyle": {
      "cinematic": true,
      "colorGrade": "vibrant"
    }
  },
  "sceneParams": {
    "scene-1": {
      "cameraControl": { "type": "zoom_in", "speed": "slow" }
    },
    "scene-3": {
      "visualStyle": { "lighting": "dramatic" }
    }
  },
  "strategy": "staggered",
  "maxParallel": 3
}
```

### Pausar/Reanudar Generaciones

```http
POST /api/videos/:videoId/pause
```

**Response:**
```json
{
  "videoId": "video-uuid",
  "pausedScenes": ["scene-1", "scene-2"],
  "canResume": true
}
```

```http
POST /api/videos/:videoId/resume
```

## Eventos SSE de Progreso

```http
GET /api/scenes/:sceneId/events
Accept: text/event-stream
```

**Eventos emitidos:**

```
data: {"type": "queued", "sceneId": "s1", "timestamp": "...", "data": {"position": 3}}

data: {"type": "started", "sceneId": "s1", "timestamp": "...", "data": {"stage": "initialization"}}

data: {"type": "progress", "sceneId": "s1", "timestamp": "...", "data": {"percentage": 25, "stage": "generation"}}

data: {"type": "progress", "sceneId": "s1", "timestamp": "...", "data": {"percentage": 60, "stage": "generation"}}

data: {"type": "stage_change", "sceneId": "s1", "timestamp": "...", "data": {"stage": "encoding"}}

data: {"type": "completed", "sceneId": "s1", "timestamp": "...", "data": {"downloadUrl": "..."}}
```

## Estrategias de Generación

### Secuencial

```typescript
// Una escena a la vez
const sequentialStrategy = {
  order: 'sequence',      // 'sequence' | 'priority' | 'random'
  delayBetween: 5000,     // 5s entre escenas
};

// Pros: Predecible, usa menos recursos
// Cons: Más lento total
```

### Paralelo

```typescript
// Todas a la vez (hasta límite)
const parallelStrategy = {
  maxConcurrent: 5,
  batchSize: 3,
};

// Pros: Más rápido
// Cons: Puede saturar cuota
```

### Staggered (Recomendado)

```typescript
// Paralelo controlado con delays
const staggeredStrategy = {
  initialBatch: 2,
  staggerDelay: 10000,    // 10s entre batches
  maxConcurrent: 3,
};

// Balance entre velocidad y uso de recursos
```

### Implementación Staggered

```typescript
async function generateScenesStaggered(
  scenes: Scene[],
  options: {
    initialBatch: number;
    staggerDelay: number;
    maxConcurrent: number;
  }
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  const queue = [...scenes];
  const active = new Set<Promise<GenerationResult>>();
  
  while (queue.length > 0 || active.size > 0) {
    // Llenar batch inicial
    while (active.size < options.initialBatch && queue.length > 0) {
      const scene = queue.shift()!;
      active.add(generateScene(scene));
    }
    
    // Esperar que alguna termine
    const completed = await Promise.race(active);
    active.delete(completed);
    results.push(completed);
    
    // Delay antes de siguiente
    if (queue.length > 0) {
      await sleep(options.staggerDelay);
    }
  }
  
  return results;
}
```

## Gestión de Errores y Reintentos

### Configuración de Reintentos

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'linear' | 'exponential';
  baseDelay: number;      // ms
  maxDelay: number;       // ms
  
  // Errores que NO ameritan reintento
  nonRetryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoffStrategy: 'exponential',
  baseDelay: 5000,
  maxDelay: 60000,
  nonRetryableErrors: [
    'INVALID_PROMPT',
    'CONTENT_POLICY_VIOLATION',
    'INSUFFICIENT_CREDITS',
    'ACCOUNT_SUSPENDED',
  ],
};
```

### Lógica de Reintento

```typescript
async function generateWithRetry(
  scene: Scene,
  config: Partial<RetryConfig> = {}
): Promise<GenerationResult> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      // Actualizar estado a retrying
      await updateSceneStatus(scene.id, 'retrying', { attempt });
      
      return await minimax.generate(scene);
    } catch (error) {
      lastError = error as Error;
      
      // Verificar si es error no reintentable
      if (retryConfig.nonRetryableErrors.some(e => 
        lastError.message.includes(e)
      )) {
        throw lastError;
      }
      
      // Último intento
      if (attempt === retryConfig.maxAttempts) {
        await updateSceneStatus(scene.id, 'fail', { 
          error: lastError.message,
          attempts: attempt 
        });
        throw lastError;
      }
      
      // Calcular delay con backoff
      const delay = calculateBackoff(
        attempt,
        retryConfig.backoffStrategy,
        retryConfig.baseDelay,
        retryConfig.maxDelay
      );
      
      // Esperar antes de reintentar
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

function calculateBackoff(
  attempt: number,
  strategy: string,
  baseDelay: number,
  maxDelay: number
): number {
  let delay: number;
  
  switch (strategy) {
    case 'fixed':
      delay = baseDelay;
      break;
    case 'linear':
      delay = baseDelay * attempt;
      break;
    case 'exponential':
    default:
      delay = baseDelay * Math.pow(2, attempt - 1);
      break;
  }
  
  return Math.min(delay, maxDelay);
}
```

## Componente UI de Control

```typescript
import { useState, useEffect } from 'react';

interface GenerationControlPanelProps {
  videoId: string;
  scenes: Scene[];
}

export function GenerationControlPanel({ 
  videoId, 
  scenes 
}: GenerationControlPanelProps) {
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  
  // Suscribirse a eventos SSE
  useEffect(() => {
    const es = new EventSource(`/api/videos/${videoId}/events`);
    
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'progress':
          setProgress(prev => ({
            ...prev,
            [data.sceneId]: data.data.percentage
          }));
          break;
        case 'completed':
        case 'failed':
        case 'cancelled':
          setGenerating(prev => {
            const next = new Set(prev);
            next.delete(data.sceneId);
            return next;
          });
          break;
      }
    };
    
    return () => es.close();
  }, [videoId]);
  
  const handleGenerateAll = async () => {
    await fetch(`/api/videos/${videoId}/generate-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: 'staggered',
        maxParallel: 3,
      }),
    });
    
    // Marcar todas como generando
    setGenerating(new Set(scenes.map(s => s.id)));
  };
  
  const handleCancelScene = async (sceneId: string) => {
    await fetch(`/api/scenes/${sceneId}/cancel`, { method: 'POST' });
    setGenerating(prev => {
      const next = new Set(prev);
      next.delete(sceneId);
      return next;
    });
  };
  
  const handleRegenerate = async (sceneId: string) => {
    await fetch(`/api/scenes/${sceneId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        useSamePrompt: true,
        params: { quality: 'high' },
        reason: 'quality',
      }),
    });
    
    setGenerating(prev => new Set(prev).add(sceneId));
  };
  
  return (
    <div className="generation-control-panel">
      <div className="global-controls">
        <button 
          onClick={handleGenerateAll}
          disabled={generating.size > 0}
        >
          {generating.size > 0 
            ? `Generando ${generating.size} escenas...` 
            : 'Generar Todas'}
        </button>
        
        <button onClick={() => setPaused(!paused)}>
          {paused ? 'Reanudar' : 'Pausar'}
        </button>
      </div>
      
      <div className="scenes-list">
        {scenes.map(scene => (
          <SceneControl
            key={scene.id}
            scene={scene}
            progress={progress[scene.id] || 0}
            isGenerating={generating.has(scene.id)}
            onCancel={() => handleCancelScene(scene.id)}
            onRegenerate={() => handleRegenerate(scene.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SceneControl({ 
  scene, 
  progress, 
  isGenerating, 
  onCancel, 
  onRegenerate 
}: SceneControlProps) {
  return (
    <div className="scene-control">
      <div className="scene-info">
        <span className="sequence">Escena {scene.sequence + 1}</span>
        <span className="status">{scene.minimaxStatus}</span>
      </div>
      
      {isGenerating && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}
      
      <div className="actions">
        {isGenerating ? (
          <button onClick={onCancel}>Cancelar</button>
        ) : (
          <button onClick={onRegenerate}>Regenerar</button>
        )}
      </div>
    </div>
  );
}
```

## Flujo Completo de Ejemplo

```typescript
// Generar un video completo con control
async function generateVideoWithControl(videoId: string) {
  // 1. Configurar estrategia
  const strategy = {
    type: 'staggered' as const,
    initialBatch: 2,
    staggerDelay: 10000,
    maxConcurrent: 3,
  };
  
  // 2. Parámetros base para todas las escenas
  const baseParams: Partial<MiniMaxGenerationParams> = {
    resolution: '1080p',
    quality: 'high',
    model: 'T2V-01-Director',
    visualStyle: {
      cinematic: true,
      colorGrade: 'vibrant',
      lighting: 'studio',
    },
  };
  
  // 3. Parámetros específicos por escena
  const sceneParams: Record<string, Partial<MiniMaxGenerationParams>> = {
    'scene-1': {
      cameraControl: { type: 'zoom_in', speed: 'slow' },
    },
    'scene-2': {
      visualStyle: { lighting: 'natural' },
    },
    'scene-3': {
      cameraControl: { type: 'pan', speed: 'normal' },
    },
  };
  
  // 4. Iniciar generación
  await fetch(`/api/videos/${videoId}/generate-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseParams,
      sceneParams,
      strategy: strategy.type,
      maxParallel: strategy.maxConcurrent,
    }),
  });
  
  // 5. Escuchar progreso
  const es = new EventSource(`/api/videos/${videoId}/events`);
  es.onmessage = (event) => {
    const data: MiniMaxEvent = JSON.parse(event.data);
    
    switch (data.type) {
      case 'queued':
        console.log(`Escena ${data.sceneId} en cola (posición ${data.data.position})`);
        break;
      case 'progress':
        updateProgressBar(data.sceneId, data.data.percentage);
        break;
      case 'completed':
        markSceneCompleted(data.sceneId, data.data.downloadUrl);
        break;
      case 'failed':
        showError(data.sceneId, data.data.error);
        break;
    }
  };
}
```

## Configuración YAML

```yaml
# ============================================
# MiniMax Advanced Configuration
# ============================================
minimax:
  defaultDuration: 6
  defaultResolution: 1080p
  defaultAspectRatio: 9:16
  
  # Configuración de modelos
  models:
    default: "T2V-01"
    director: "T2V-01-Director"  # Mejor calidad, más lento
    fast: "T2V-01"               # Más rápido
  
  # Estrategia de generación por defecto
  generation:
    strategy: "staggered"        # sequential | parallel | staggered
    maxParallel: 3
    initialBatch: 2
    staggerDelay: 10000          # 10 segundos
  
  # Configuración de reintentos
  retry:
    maxAttempts: 3
    backoffStrategy: "exponential"
    baseDelay: 5000
    maxDelay: 60000
  
  # Parámetros por defecto
  defaults:
    quality: "high"
    visualStyle:
      cinematic: true
      lighting: "studio"
```

## Consideraciones

1. **Costos**: Cancelar una generación en curso generalmente no devuelve créditos
2. **Rate Limits**: Implementar rate limiting en el lado del cliente
3. **Almacenamiento**: Los clips deben descargarse y almacenarse localmente
4. **Cola propia**: Considerar implementar una cola propia si los límites de MiniMax son estrictos

## Ver También

- [MiniMax Integration](./minimax.md) - Documentación básica de MiniMax
- [API Endpoints](../reference/api-endpoints.md) - Referencia completa de endpoints
- [Database Schema](../database/schema.md) - Estructura de la base de datos
