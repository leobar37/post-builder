# Tarea 3: Documentar Control de Modelos OpenCode

**ID**: T3  
**Estado**: pending  
**Requisitos**: FR-005, FR-007, NFR-001  
**Dependencias**: T1 (Contexto Jerárquico)  

---

## Objetivo

Documentar cómo configurar y seleccionar diferentes modelos de IA para OpenCode, con parámetros específicos por tipo de tarea (generación de ideas, generación de código, edición).

---

## Archivos de Entrada

| Archivo | Descripción |
|---------|-------------|
| `docs/integrations/opencode.md` | Integración OpenCode básica |
| `docs/configuration/schema.md` | Configuración YAML actual |
| `docs/code-snippets/opencode-bridge.md` | OpenCodeBridge actual |

---

## Archivos de Salida

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `docs/integrations/opencode-advanced.md` | Crear | Configuración avanzada de OpenCode |
| `docs/configuration/schema.md` | Modificar | Agregar sección de modelos |
| `docs/code-snippets/opencode-bridge.md` | Modificar | Agregar soporte de múltiples modelos |

---

## Contenido a Documentar

### 1. Configuración de Modelos

**Modificar `docs/configuration/schema.md`**:

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

### 2. Interface TypeScript

**Agregar a `docs/models/README.md`**:

```typescript
// Configuración de un modelo específico
export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'local';
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_prompt?: string;
  tools?: string[];  // Herramientas disponibles para este modelo
}

// Configuración completa de modelos
export interface OpenCodeModelsConfig {
  default: ModelConfig;
  idea_generation: ModelConfig;
  code_generation: ModelConfig;
  editing: ModelConfig;
  economy?: ModelConfig;
  custom?: Record<string, ModelConfig>;
}

// AppConfig actualizado
export interface OpenCodeConfig {
  mode: 'acp' | 'cli' | 'skill';
  timeout: number;
  retries: number;
  models: OpenCodeModelsConfig;  // NUEVO
  acp: {
    reconnect: boolean;
    maxReconnects: number;
  };
}
```

### 3. OpenCodeBridge con Selección de Modelo

**Nuevo documento `docs/integrations/opencode-advanced.md`**:

```typescript
// OpenCodeBridge extendido con selección de modelo

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
}
```

### 4. Mapeo de Tareas a Modelos

Documentar en `opencode-advanced.md`:

```typescript
// Mapeo de operaciones del sistema a tipos de modelo
const TASK_MODEL_MAPPING = {
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

// Uso en la API
async function handleGenerateIdea(req, res) {
  const result = await openCodeBridge.sendPrompt(
    sessionId,
    req.body.prompt,
    { 
      taskType: 'idea',  // Usa modelo idea_generation
      context: req.body.context,
    }
  );
}

async function handleEditScene(req, res) {
  const result = await openCodeBridge.sendPrompt(
    sessionId,
    req.body.instruction,
    { 
      taskType: 'editing',  // Usa modelo editing (rápido)
      context: req.body.context,
    }
  );
}
```

### 5. Comparativa de Modelos

Incluir tabla comparativa:

| Modelo | Uso Recomendado | Velocidad | Costo | Calidad Código | Creatividad |
|--------|-----------------|-----------|-------|----------------|-------------|
| Claude Opus 4.6 | Ideas complejas | Lenta | Alta | Alta | Muy Alta |
| Claude Sonnet 4.6 | Código, balance | Media | Media | Alta | Alta |
| Claude Haiku 4.5 | Ediciones rápidas | Rápida | Baja | Media | Media |
| GPT-4o | General | Media | Media | Alta | Alta |
| GPT-4o-mini | Tareas simples | Rápida | Muy Baja | Media | Media |
| Llama 3.1 (local) | Desarrollo offline | Variable | Gratis | Media | Media |

### 6. Prompts Especializados por Modelo

```typescript
// System prompts optimizados por tarea

const SYSTEM_PROMPTS = {
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

### 7. Fallback y Circuit Breaker

```typescript
// Estrategia de fallback si un modelo falla

async function sendWithFallback(
  bridge: OpenCodeBridge,
  sessionId: string,
  prompt: string,
  options: any
): Promise<void> {
  const fallbackChain = [
    options.taskType,
    'default',
    'economy',  // Último recurso
  ];
  
  for (const taskType of fallbackChain) {
    try {
      await bridge.sendPrompt(sessionId, prompt, {
        ...options,
        taskType,
      });
      return;  // Éxito
    } catch (error) {
      console.warn(`Model ${taskType} failed, trying fallback...`);
      continue;  // Intentar siguiente
    }
  }
  
  throw new Error('All models failed');
}
```

---

## Checklist de Completitud

- [ ] Sección de configuración de modelos agregada a `schema.md`
- [ ] Interfaces `ModelConfig` y `OpenCodeModelsConfig` documentadas
- [ ] Documento `opencode-advanced.md` creado
- [ ] Mapeo de tareas a modelos documentado
- [ ] Tabla comparativa de modelos incluida
- [ ] System prompts especializados documentados
- [ ] Estrategia de fallback documentada
- [ ] Ejemplos de uso con diferentes modelos

---

## Ejemplos de Uso

Documentar ejemplos concretos:

```typescript
// Ejemplo 1: Generar idea creativa (modelo potente)
await openCode.sendPrompt(sessionId, 
  "Crea una idea viral para promocionar el gimnasio",
  { taskType: 'idea' }  // Usa Claude Opus
);

// Ejemplo 2: Generar código (modelo balanceado)
await openCode.sendPrompt(sessionId,
  "Crea una escena con el logo girando",
  { taskType: 'code' }  // Usa Claude Sonnet
);

// Ejemplo 3: Edición rápida (modelo rápido)
await openCode.sendPrompt(sessionId,
  "Cambia el color del texto a azul",
  { taskType: 'editing' }  // Usa Claude Haiku
);

// Ejemplo 4: Fallback automático
await sendWithFallback(openCode, sessionId, prompt, {
  taskType: 'code',
  context: sceneContext,
});
```

---

## Notas de Implementación

1. **Variables de entorno**: Cada proveedor necesita su API key
2. **Cost tracking**: Considerar agregar tracking de costos por modelo
3. **Rate limiting**: Diferentes límites por proveedor
4. **Streaming**: Algunos modelos soportan streaming, otros no
