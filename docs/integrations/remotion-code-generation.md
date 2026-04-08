# Remotion Code Generation

## Overview

Flujo de edición interactiva donde **OpenCode genera código React/Remotion** directamente, permitiendo al usuario iterar sobre el diseño del video en tiempo real antes de generar los clips con MiniMax.

## Arquitectura del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│              FLUJO DE EDICIÓN REMOTION INTERACTIVA              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │    Usuario   │  "Agrega título animado en escena 2"         │
│  └──────┬───────┘                                               │
│         │ prompt                                                │
│         ▼                                                       │
│  ┌──────────────┐     contexto mergeado                        │
│  │  Express API │────────────────────────▶  OpenCode Agent     │
│  │              │                           (genera código)    │
│  │ • context    │◀────────────────────────                     │
│  │ • prompt     │     código JSX generado                       │
│  └──────┬───────┘                                               │
│         │ POST /api/scenes/:id/code                             │
│         ▼                                                       │
│  ┌──────────────┐     guarda archivo      ┌──────────────┐     │
│  │  Filesystem  │───────────────────────▶│ ./src/remotion│     │
│  │              │                        │ /generated/   │     │
│  └──────┬───────┘                        │ Scene2.tsx    │     │
│         │                                └──────┬───────┘     │
│         │ SSE "code_updated"                      │ HMR         │
│         ▼                                         │             │
│  ┌──────────────┐                                 │             │
│  │  React UI    │◀────────────────────────────────┘             │
│  │              │     Player se recarga automáticamente         │
│  │ Remotion     │                                               │
│  │ Player       │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ "Se ve bien!" / "Cambia el color a azul"             │
│         └───────────────────────────────────────────────────────┘
│                              (loop de edición)
└─────────────────────────────────────────────────────────────────┘
```

## Separación de Prompts

### 1. Prompt de Generación de Idea (Contenido)

```typescript
const IDEA_GENERATION_PROMPT = `
Analiza el contexto del proyecto y genera una idea de video.

Contexto del proyecto: {{projectContext}}
Contexto del video: {{videoContext}}

Genera:
1. Título del video
2. Descripción general
3. Lista de escenas (3-5) con duración y descripción
4. Prompt para cada escena (para MiniMax)

Responde en formato JSON válido.
`;
```

### 2. Prompt de Generación de Código (Estructura)

```typescript
const CODE_GENERATION_PROMPT = `
Genera código React/Remotion para la siguiente escena.

Contexto completo: {{mergedContext}}
Escena actual: {{sceneContext}}

Requisitos:
- Exporta un componente Scene default
- Usa componentes de @remotion/core
- Incluye texto overlay si se especifica
- Usa animaciones de entrada/salida
- DIMENSIONES: 1080x1920 (9:16 para Reels)

Ejemplo de estructura:
\`\`\`tsx
import { AbsoluteFill, Text, useCurrentFrame, useVideoConfig } from 'remotion';

export default function Scene() {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // tu código aquí
  
  return (
    <AbsoluteFill>
      {/* contenido */}
    </AbsoluteFill>
  );
}
\`\`\`

Genera SOLO el código, sin explicaciones adicionales.
`;
```

### 3. Prompt de Edición (Modificación)

```typescript
const EDIT_PROMPT = `
Modifica el código existente según la instrucción del usuario.

Código actual:
{{currentCode}}

Instrucción del usuario: {{userInstruction}}

Responde ÚNICAMENTE con el código completo modificado, sin explicaciones.
Mantén la estructura y los imports existentes.
`;
```

## Estructura de Archivos Generados

```
src/remotion/
├── compositions/
│   └── VideoComposition.tsx      # Importa escenas dinámicamente
├── components/                   # Componentes reutilizables
│   ├── AnimatedText.tsx
│   ├── LogoOverlay.tsx
│   ├── CTAButton.tsx
│   └── transitions/
│       ├── FadeTransition.tsx
│       └── SlideTransition.tsx
└── generated/                    # CÓDIGO GENERADO POR AGENTE
    ├── Scene1.tsx
    ├── Scene2.tsx
    ├── Scene3.tsx
    └── index.ts                  # Exporta todas las escenas
```

## Componente VideoComposition Dinámico

```typescript
// compositions/VideoComposition.tsx
import { Composition, AbsoluteFill } from 'remotion';
import { useEffect, useState, Suspense, lazy } from 'react';

// Import dinámico de escenas generadas
const loadScenes = async () => {
  const modules = import.meta.glob('../generated/Scene*.tsx');
  const scenes = [];
  
  for (const path in modules) {
    const mod = await modules[path]();
    scenes.push({
      component: mod.default,
      name: path.replace('../generated/', '').replace('.tsx', ''),
    });
  }
  
  // Ordenar por nombre (Scene1, Scene2, etc.)
  scenes.sort((a, b) => {
    const numA = parseInt(a.name.replace('Scene', ''));
    const numB = parseInt(b.name.replace('Scene', ''));
    return numA - numB;
  });
  
  return scenes;
};

interface VideoCompositionProps {
  videoId: string;
}

export function VideoComposition({ videoId }: VideoCompositionProps) {
  const [scenes, setScenes] = useState<Array<{ component: any; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadScenes().then((loaded) => {
      setScenes(loaded);
      setIsLoading(false);
    });
  }, [videoId]);
  
  if (isLoading) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#fff' }}>Cargando escenas...</p>
      </AbsoluteFill>
    );
  }
  
  return (
    <AbsoluteFill>
      {scenes.map(({ component: SceneComponent, name }, index) => (
        <Sequence key={name} from={index * 180} durationInFrames={180}>
          <SceneComponent />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

// Componente de transición entre escenas
function SceneSequence({ 
  Component, 
  startFrame, 
  duration 
}: { 
  Component: React.ComponentType; 
  startFrame: number; 
  duration: number;
}) {
  return (
    <Sequence from={startFrame} durationInFrames={duration}>
      <Component />
    </Sequence>
  );
}
```

## Hot Reload / Recarga del Player

### Hook useRemotionReload

```typescript
// hooks/useRemotionReload.ts
import { useState, useEffect, useCallback } from 'react';

interface UseRemotionReloadOptions {
  videoId: string;
  apiUrl?: string;
  onCodeUpdate?: () => void;
}

export function useRemotionReload({ 
  videoId, 
  apiUrl = 'http://localhost:3000',
  onCodeUpdate 
}: UseRemotionReloadOptions) {
  const [reloadKey, setReloadKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  useEffect(() => {
    const es = new EventSource(`${apiUrl}/api/videos/${videoId}/events`);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'code_updated') {
          console.log('Code updated, reloading player...');
          setReloadKey(k => k + 1);
          setLastUpdate(new Date());
          onCodeUpdate?.();
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };
    
    es.onerror = (error) => {
      console.error('SSE error:', error);
    };
    
    return () => es.close();
  }, [videoId, apiUrl, onCodeUpdate]);
  
  const forceReload = useCallback(() => {
    setReloadKey(k => k + 1);
  }, []);
  
  return { reloadKey, lastUpdate, forceReload };
}
```

### Uso en Componente

```typescript
import { Player } from '@remotion/player';
import { VideoComposition } from '../remotion/compositions/VideoComposition';
import { useRemotionReload } from '../hooks/useRemotionReload';

function VideoPreview({ videoId }: { videoId: string }) {
  const { reloadKey } = useRemotionReload({ videoId });
  
  return (
    <div className="video-preview">
      <Player
        key={reloadKey}  // Re-mount cuando cambia
        component={VideoComposition}
        durationInFrames={900}  // 30s @ 30fps
        fps={30}
        compositionWidth={1080}
        compositionHeight={1920}
        inputProps={{ videoId }}
        controls
        autoPlay
        loop
      />
    </div>
  );
}
```

## Estados de Edición en State Machine

```typescript
// Estados extendidos para flujo de edición
type VideoStatus = 
  | 'draft'
  | 'generating_idea'
  | 'idea_ready'
  | 'editing_remotion'      // NUEVO: Agente generando código
  | 'preview_ready'         // NUEVO: Código listo para preview
  | 'generating_clips'      // MiniMax generando clips
  | 'clips_ready'
  | 'composing'
  | 'completed'
  | 'failed';

// Handlers para nuevos estados
const videoStateHandlers: Record<VideoStatus, StateHandler> = {
  // ... estados existentes ...
  
  editing_remotion: {
    onEnter: async (video) => {
      // OpenCode genera código para cada escena
      for (const scene of video.scenes) {
        const context = await buildMergedContext(scene);
        
        // Generar código con OpenCode
        const code = await openCodeBridge.generateSceneCode({
          scene,
          context,
          prompt: `Genera código Remotion para: ${scene.description}`,
        });
        
        // Guardar archivo
        await saveSceneCode(scene.id, code);
        
        // Notificar progreso
        sseEmitter.emit(`video:${video.id}`, {
          type: 'code_generated',
          sceneId: scene.id,
        });
      }
      
      // Notificar que todo el código está listo
      sseEmitter.emit(`video:${video.id}`, {
        type: 'code_updated',
        videoId: video.id,
      });
      
      // Transicionar a preview_ready
      await transitionTo(video.id, 'preview_ready');
    },
    timeout: 300000,  // 5 minutos
  },
  
  preview_ready: {
    onEnter: async (video) => {
      sseEmitter.emit(`video:${video.id}`, {
        type: 'preview_ready',
        videoId: video.id,
        message: 'El preview está listo. Revisa el diseño y aprueba para generar clips.',
      });
    },
    // Espera acción del usuario: approve o edit
  },
  
  // ... resto de estados ...
};
```

## API Endpoints para Edición

### Generar Código para Escena

```typescript
// POST /api/scenes/:sceneId/code
router.post('/:sceneId/code', async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { instruction } = req.body;  // "Agrega título animado"
    
    // Obtener escena y contexto
    const scene = await db.scenes.findById(sceneId);
    const context = await buildMergedContext(scene);
    
    // Cargar código actual (si existe)
    const currentCode = await loadSceneCode(sceneId);
    
    // Generar código con OpenCode
    let code: string;
    if (currentCode) {
      // Edición incremental
      code = await openCodeBridge.editCode({
        currentCode,
        instruction,
        context,
      });
    } else {
      // Generación desde cero
      code = await openCodeBridge.generateCode({
        instruction,
        context,
        scene,
      });
    }
    
    // Validar código generado
    const validation = validateGeneratedCode(code);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Generated code is invalid',
        details: validation.errors,
      });
    }
    
    // Guardar código
    await saveSceneCode(sceneId, code);
    
    // Notificar via SSE
    sseEmitter.emit(`scene:${sceneId}`, { 
      type: 'code_updated',
      sceneId,
    });
    
    res.json({ 
      status: 'code_generated',
      sceneId,
      validation: validation.errors,
    });
    
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});
```

### Obtener Código de Escena

```typescript
// GET /api/scenes/:sceneId/code
router.get('/:sceneId/code', async (req, res) => {
  const { sceneId } = req.params;
  const code = await loadSceneCode(sceneId);
  
  if (!code) {
    return res.status(404).json({ error: 'No code found for this scene' });
  }
  
  res.json({ sceneId, code });
});
```

### Obtener Todo el Código del Video

```typescript
// GET /api/videos/:videoId/code
router.get('/:videoId/code', async (req, res) => {
  const scenes = await db.scenes.findByVideoId(req.params.videoId);
  const codeMap: Record<string, string> = {};
  
  for (const scene of scenes) {
    const code = await loadSceneCode(scene.id);
    if (code) {
      codeMap[scene.id] = code;
    }
  }
  
  res.json({ 
    videoId: req.params.videoId,
    scenes: codeMap,
  });
});
```

## Validación de Código Generado

```typescript
// lib/code-validation.ts

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ALLOWED_IMPORTS = [
  'remotion',
  './components',
  '../components',
  './transitions',
];

function validateGeneratedCode(code: string): ValidationResult {
  const errors: string[] = [];
  
  // 1. Verificar que exporta default
  if (!code.includes('export default')) {
    errors.push('El código debe exportar un componente default');
  }
  
  // 2. Verificar imports permitidos
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    const pkg = match[1];
    const isAllowed = ALLOWED_IMPORTS.some(allowed => 
      pkg.startsWith(allowed) || pkg === allowed
    );
    
    if (!isAllowed) {
      errors.push(`Import no permitido: ${pkg}`);
    }
  }
  
  // 3. Verificar dimensiones en comentarios o código
  const hasDimensions = 
    code.includes('1080') && 
    code.includes('1920');
  
  if (!hasDimensions) {
    errors.push('Las dimensiones 1080x1920 deben estar definidas');
  }
  
  // 4. Verificar que no usa hooks peligrosos
  const dangerousPatterns = [
    'eval(',
    'Function(',
    'document.write',
    'window.location',
  ];
  
  for (const pattern of dangerousPatterns) {
    if (code.includes(pattern)) {
      errors.push(`Patrón no permitido encontrado: ${pattern}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export { validateGeneratedCode };
```

## Ejemplo de Iteración Completa

```
1. Usuario crea video y se genera idea
   ↓
2. Sistema pasa a estado 'editing_remotion'
   ↓
3. Agente genera Scene1.tsx, Scene2.tsx, Scene3.tsx
   ↓
4. Player muestra preview con código generado
   ↓
5. Usuario: "Haz que el título de la escena 2 tenga animación de fade"
   ↓
6. POST /api/scenes/scene-2/code { instruction: "..." }
   ↓
7. Agente modifica Scene2.tsx
   ↓
8. SSE notifica 'code_updated'
   ↓
9. Player se recarga con nueva animación
   ↓
10. Usuario: "Perfecto, genera el video"
    ↓
11. Sistema pasa a 'generating_clips' (MiniMax)
```

## Mejores Prácticas

1. **Sandboxing**: El código corre en cliente, no servidor - riesgo reducido
2. **Versionado**: Guardar historial de cambios para "undo"
3. **Preview antes de clips**: Iterar diseño sin gastar créditos MiniMax
4. **Componentes reutilizables**: Crear biblioteca de componentes pre-aprobados
5. **Validación estricta**: Revisar imports y patrones peligrosos

## Ver También

- [Hot Reload Patterns](../code-snippets/remotion-hot-reload.md) - Patrones de recarga
- [MiniMax Advanced](./minimax-advanced.md) - Control de generaciones
- [Contexto Jerárquico](../architecture/hierarchical-context.md) - Contexto para prompts
