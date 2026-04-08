# Tarea 4: Documentar Control MiniMax Avanzado

**ID**: T4  
**Estado**: pending  
**Requisitos**: FR-006, NFR-001, NFR-003  
**Dependencias**: Ninguna (independiente)  

---

## Objetivo

Documentar el control granular de las generaciones de video con MiniMax, incluyendo cancelación, regeneración, parámetros avanzados por escena, y gestión de errores.

---

## Archivos de Entrada

| Archivo | Descripción |
|---------|-------------|
| `docs/integrations/minimax.md` | Integración MiniMax básica |
| `docs/database/schema.md` | Esquema de scenes |
| `docs/reference/api-endpoints.md` | Endpoints actuales |

---

## Archivos de Salida

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `docs/integrations/minimax-advanced.md` | Crear | Control avanzado de MiniMax |
| `docs/reference/api-endpoints.md` | Modificar | Agregar endpoints de control |

---

## Contenido a Documentar

### 1. Estados Extendidos de Generación

**Nuevo documento `docs/integrations/minimax-advanced.md`**:

```typescript
// Estados extendidos para control granular
export type MiniMaxStatus =
  | 'pending'      // Esperando inicio
  | 'queued'       // En cola de MiniMax
  | 'processing'   // Generando
  | 'cancelling'   // NUEVO: Cancelación solicitada
  | 'cancelled'    // NUEVO: Cancelado exitosamente
  | 'success'      // Completado
  | 'fail'         // Fallido
  | 'retrying';    // Reintentando

// Metadata extendida
export interface MiniMaxJobMetadata {
  taskId: string;
  status: MiniMaxStatus;
  
  // Control
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;      // NUEVO
  
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

### 2. Parámetros Avanzados por Escena

```typescript
// Parámetros extendidos de generación
export interface MiniMaxGenerationParams {
  // Básicos (ya documentados)
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
  
  // Referencia de imagen (para I2V)
  imageReference?: {
    fileId: string;
    influence: 'low' | 'medium' | 'high';
  };
}
```

### 3. API de Control

**Modificar `docs/reference/api-endpoints.md`**:

```typescript
// ============================================
// CONTROL GRANULAR DE GENERACIONES MINIMAX
// ============================================

/**
 * POST /api/scenes/:sceneId/generate
 * Inicia generación con parámetros avanzados
 */
interface GenerateSceneRequest {
  // Si no se proporciona, usa el prompt almacenado
  prompt?: string;
  
  // Parámetros avanzados (opcional, usa defaults)
  params?: Partial<MiniMaxGenerationParams>;
  
  // Prioridad en cola
  priority?: 'low' | 'normal' | 'high';
}

interface GenerateSceneResponse {
  sceneId: string;
  taskId: string;
  status: MiniMaxStatus;
  estimatedTime: number;  // segundos estimados
  queuePosition?: number; // posición en cola si está queued
}

/**
 * POST /api/scenes/:sceneId/cancel
 * Cancela una generación en curso
 */
interface CancelGenerationResponse {
  sceneId: string;
  taskId: string;
  status: 'cancelled' | 'already_completed' | 'not_found';
  refunded?: boolean;  // Si se devuelve el crédito
}

/**
 * POST /api/scenes/:sceneId/regenerate
 * Regenera con los mismos o diferentes parámetros
 */
interface RegenerateRequest {
  // true = mismo prompt, false = nuevo prompt requerido
  useSamePrompt: boolean;
  
  // Nuevo prompt si useSamePrompt = false
  newPrompt?: string;
  
  // Ajustar parámetros
  params?: Partial<MiniMaxGenerationParams>;
  
  // Razón de regeneración (para analytics)
  reason?: 'quality' | 'content' | 'style' | 'other';
}

/**
 * GET /api/scenes/:sceneId/status
 * Estado detallado con progreso
 */
interface SceneStatusResponse {
  sceneId: string;
  status: MiniMaxStatus;
  progress: {
    percentage: number;
    stage: string;
    estimatedTimeRemaining: number | null;
  };
  metadata: MiniMaxJobMetadata;
}

/**
 * POST /api/videos/:videoId/generate-all
 * Genera todas las escenas pendientes
 */
interface GenerateAllRequest {
  // Parámetros base para todas las escenas
  baseParams?: Partial<MiniMaxGenerationParams>;
  
  // Parámetros específicos por escena
  sceneParams?: Record<string, Partial<MiniMaxGenerationParams>>;
  
  // Estrategia de ejecución
  strategy: 'sequential' | 'parallel' | 'staggered';
  maxParallel?: number;  // default: 3
}

/**
 * POST /api/videos/:videoId/pause
 * Pausa todas las generaciones en curso
 */
interface PauseGenerationResponse {
  videoId: string;
  pausedScenes: string[];
  canResume: boolean;
}

/**
 * POST /api/videos/:videoId/resume
 * Reanuda generaciones pausadas
 */
```

### 4. Polling Avanzado con SSE

```typescript
// SSE para updates en tiempo real de progreso

/**
 * GET /api/scenes/:sceneId/events
 * EventSource para progreso en tiempo real
 */

// Eventos emitidos:
interface MiniMaxEvent {
  type: 
    | 'queued'           // Entró a cola
    | 'started'          // Comenzó generación
    | 'progress'         // Update de progreso
    | 'stage_change'     // Cambió de etapa
    | 'completed'        // Terminó exitosamente
    | 'failed'           // Falló
    | 'cancelled'        // Fue cancelado
    | 'retry_scheduled'; // Se programó reintento
  
  sceneId: string;
  taskId: string;
  timestamp: string;
  data: {
    percentage?: number;
    stage?: string;
    estimatedTimeRemaining?: number;
    error?: string;
    downloadUrl?: string;
  };
}

// Ejemplo de flujo de eventos:
// data: {"type": "queued", "sceneId": "s1", "data": {"position": 3}}
// data: {"type": "started", "sceneId": "s1", "data": {"stage": "initialization"}}
// data: {"type": "progress", "sceneId": "s1", "data": {"percentage": 25, "stage": "generation"}}
// data: {"type": "progress", "sceneId": "s1", "data": {"percentage": 60, "stage": "generation"}}
// data: {"type": "stage_change", "sceneId": "s1", "data": {"stage": "encoding"}}
// data: {"type": "completed", "sceneId": "s1", "data": {"downloadUrl": "..."}}
```

### 5. Estrategias de Generación

```typescript
// Estrategias para generar múltiples escenas

export type GenerationStrategy = {
  // SECUENCIAL: Una escena a la vez
  // Pros: Predecible, usa menos recursos
  // Cons: Más lento total
  sequential: {
    order: 'sequence' | 'priority' | 'random';
    delayBetween: number;  // ms entre escenas
  };
  
  // PARALELO: Todas a la vez (hasta límite)
  // Pros: Más rápido
  // Cons: Puede saturar cuota
  parallel: {
    maxConcurrent: number;
    batchSize: number;
  };
  
  // STAGGERED: Paralelo controlado con delays
  // Balance entre ambos
  staggered: {
    initialBatch: number;
    staggerDelay: number;  // ms entre batches
    maxConcurrent: number;
  };
};

// Implementación recomendada: Staggered
async function generateScenesStaggered(
  scenes: Scene[],
  options: GenerationStrategy['staggered']
) {
  const results = [];
  const queue = [...scenes];
  const active = new Set();
  
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

### 6. Gestión de Errores y Reintentos

```typescript
// Estrategia de reintentos inteligente

interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'linear' | 'exponential';
  baseDelay: number;  // ms
  maxDelay: number;   // ms
  
  // Errores que NO ameritan reintento
  nonRetryableErrors: string[];
  
  // Callbacks
  onRetry?: (attempt: number, error: Error) => void;
  onExhausted?: (error: Error) => void;
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
  ],
};

// Lógica de reintento
async function generateWithRetry(
  scene: Scene,
  config: Partial<RetryConfig> = {}
): Promise<GenerationResult> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await minimax.generate(scene);
    } catch (error) {
      lastError = error as Error;
      
      // Verificar si es error no reintentable
      if (retryConfig.nonRetryableErrors.some(e => 
        lastError.message.includes(e)
      )) {
        throw lastError;
      }
      
      // Último intento, no reintentar
      if (attempt === retryConfig.maxAttempts) {
        retryConfig.onExhausted?.(lastError);
        throw lastError;
      }
      
      // Calcular delay
      const delay = calculateBackoff(
        attempt,
        retryConfig.backoffStrategy,
        retryConfig.baseDelay,
        retryConfig.maxDelay
      );
      
      retryConfig.onRetry?.(attempt, lastError);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}
```

### 7. UI de Control

```typescript
// Componente React para control de generaciones

interface GenerationControlPanelProps {
  videoId: string;
  scenes: Scene[];
}

function GenerationControlPanel({ videoId, scenes }: GenerationControlPanelProps) {
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  
  const handleGenerateAll = async () => {
    const pending = scenes.filter(s => s.minimaxStatus === 'pending');
    
    await fetch(`/api/videos/${videoId}/generate-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: 'staggered',
        maxParallel: 3,
      }),
    });
  };
  
  const handleCancelScene = async (sceneId: string) => {
    await fetch(`/api/scenes/${sceneId}/cancel`, { method: 'POST' });
  };
  
  const handleRegenerate = async (sceneId: string) => {
    await fetch(`/api/scenes/${sceneId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        useSamePrompt: true,
        params: { quality: 'high' },  // Mejor calidad en reintento
      }),
    });
  };
  
  return (
    <div className="generation-control">
      <div className="global-controls">
        <button onClick={handleGenerateAll}>
          Generar Todas
        </button>
        <button onClick={() => setPaused(!paused)}>
          {paused ? 'Reanudar' : 'Pausar'}
        </button>
      </div>
      
      {scenes.map(scene => (
        <SceneControl
          key={scene.id}
          scene={scene}
          onCancel={() => handleCancelScene(scene.id)}
          onRegenerate={() => handleRegenerate(scene.id)}
        />
      ))}
    </div>
  );
}
```

---

## Checklist de Completitud

- [ ] Estados extendidos (`cancelling`, `cancelled`) documentados
- [ ] Parámetros avanzados (`cameraControl`, `visualStyle`, etc.) documentados
- [ ] API endpoints de control agregados a `api-endpoints.md`
- [ ] Eventos SSE de progreso documentados
- [ ] Estrategias de generación (sequential/parallel/staggered) documentadas
- [ ] Lógica de reintentos con backoff documentada
- [ ] Componente UI de control incluido como ejemplo
- [ ] Configuración YAML actualizada con opciones avanzadas

---

## Ejemplo Completo de Flujo

```typescript
// Flujo completo: Generar 5 escenas con control

async function generateVideoWithControl(videoId: string) {
  // 1. Configurar estrategia
  const strategy = {
    type: 'staggered' as const,
    initialBatch: 2,
    staggerDelay: 10000,  // 10s entre batches
    maxConcurrent: 3,
  };
  
  // 2. Parámetros base
  const baseParams: Partial<MiniMaxGenerationParams> = {
    resolution: '1080p',
    quality: 'high',
    visualStyle: {
      cinematic: true,
      colorGrade: 'vibrant',
    },
  };
  
  // 3. Parámetros específicos por escena
  const sceneParams: Record<string, Partial<MiniMaxGenerationParams>> = {
    'scene-1': {
      cameraControl: { type: 'zoom_in', speed: 'slow' },
    },
    'scene-3': {
      visualStyle: { lighting: 'dramatic' },
    },
  };
  
  // 4. Iniciar generación
  const response = await fetch(`/api/videos/${videoId}/generate-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseParams,
      sceneParams,
      strategy: strategy.type,
      maxParallel: strategy.maxConcurrent,
    }),
  });
  
  // 5. Escuchar progreso via SSE
  const es = new EventSource(`/api/videos/${videoId}/events`);
  es.onmessage = (event) => {
    const data: MiniMaxEvent = JSON.parse(event.data);
    
    switch (data.type) {
      case 'progress':
        updateProgressBar(data.sceneId, data.data.percentage);
        break;
      case 'failed':
        showError(data.sceneId, data.data.error);
        break;
      case 'completed':
        markCompleted(data.sceneId, data.data.downloadUrl);
        break;
    }
  };
}
```

---

## Notas de Implementación

1. **Costos**: Cancelar una generación en curso puede no devolver créditos - verificar política de MiniMax
2. **Rate limits**: Implementar rate limiting por cuenta en lado cliente
3. **Storage**: Los clips generados deben descargarse y almacenarse localmente
4. **Queue**: Considerar implementar cola propia si MiniMax tiene límites estrictos
