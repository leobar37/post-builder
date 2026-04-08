# Tarea 2: Documentar Remotion Live Editing

**ID**: T2  
**Estado**: pending  
**Requisitos**: FR-003, FR-004, FR-007, NFR-001, NFR-003  
**Dependencias**: T1 (Contexto Jerárquico)  

---

## Objetivo

Documentar el flujo completo de edición interactiva donde OpenCode genera código Remotion, el usuario ve cambios en tiempo real, y puede iterar hasta obtener el resultado deseado.

---

## Archivos de Entrada

| Archivo | Descripción |
|---------|-------------|
| `docs/integrations/remotion.md` | Integración Remotion básica actual |
| `docs/architecture/state-machine.md` | Estados del video |
| `docs/integrations/opencode.md` | Integración OpenCode actual |

---

## Archivos de Salida

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `docs/integrations/remotion-code-generation.md` | Crear | Documento principal de generación de código |
| `docs/code-snippets/remotion-hot-reload.md` | Crear | Patrones de recarga del player |
| `docs/architecture/state-machine.md` | Modificar | Agregar estados de edición |
| `docs/code-snippets/opencode-bridge.md` | Modificar | Agregar métodos para generación de código |

---

## Contenido a Documentar

### 1. Arquitectura del Flujo de Edición

**Nuevo documento `docs/integrations/remotion-code-generation.md`** con diagrama:

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
│  ┌──────────────┐     contexto mergeado (T1)     ┌──────────┐  │
│  │  Express API │───────────────────────────────▶│ OpenCode │  │
│  │              │                                │  Agent   │  │
│  │ • context    │◀───────────────────────────────│          │  │
│  │ • prompt     │     código JSX generado        │          │  │
│  └──────┬───────┘                                └──────────┘  │
│         │                                                       │
│         │ POST /api/scenes/:id/code                             │
│         ▼                                                       │
│  ┌──────────────┐     guarda archivo      ┌──────────────┐     │
│  │  Filesystem  │───────────────────────▶│ ./src/remotion│     │
│  │              │                        │ /generated/   │     │
│  └──────┬───────┘                        │ Scene2.tsx    │     │
│         │                                └──────┬───────┘     │
│         │ SSE "code_updated"                      │             │
│         ▼                                         │ HMR         │
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

### 2. Prompts Separados por Capa

Documentar la separación clara de prompts:

```typescript
// PROMPT TIPO 1: Generación de Idea (contenido)
const IDEA_GENERATION_PROMPT = `
Analiza el contexto del proyecto y genera una idea de video.

Contexto del proyecto: {{projectContext}}
Contexto del video: {{videoContext}}

Genera:
1. Título del video
2. Descripción general
3. Lista de escenas (3-5) con duración y descripción
`;

// PROMPT TIPO 2: Generación de Código Remotion (estructura)
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
import { Video, Text } from 'remotion';

export default function Scene() {
  return (
    <div>
      {/* tu código aquí */}
    </div>
  );
}
\`\`\`
`;

// PROMPT TIPO 3: Edición Incremental (modificación)
const EDIT_PROMPT = `
Modifica el código existente según la instrucción del usuario.

Código actual:
{{currentCode}}

Instrucción del usuario: {{userInstruction}}

Responde ÚNICAMENTE con el código completo modificado, sin explicaciones.
`;
```

### 3. Estructura de Archivos Generados

**Documentar en `remotion-code-generation.md`**:

```
src/remotion/
├── compositions/
│   └── VideoComposition.tsx      # Importa escenas dinámicamente
├── components/                   # Componentes reutilizables
│   ├── AnimatedText.tsx
│   ├── LogoOverlay.tsx
│   └── CTAButton.tsx
└── generated/                    # CÓDIGO GENERADO POR AGENTE
    ├── Scene1.tsx
    ├── Scene2.tsx
    ├── Scene3.tsx
    └── index.ts                  # Exporta todas las escenas
```

### 4. Componente VideoComposition Dinámico

```typescript
// compositions/VideoComposition.tsx
import { Composition } from 'remotion';
import { useEffect, useState } from 'react';

// Import dinámico de escenas generadas
const loadScenes = async () => {
  const modules = import.meta.glob('../generated/Scene*.tsx');
  const scenes = [];
  for (const path in modules) {
    const mod = await modules[path]();
    scenes.push(mod.default);
  }
  return scenes;
};

export function VideoComposition({ videoId }: { videoId: string }) {
  const [scenes, setScenes] = useState([]);
  
  useEffect(() => {
    loadScenes().then(setScenes);
  }, [videoId]);
  
  return (
    <div>
      {scenes.map((Scene, i) => (
        <Scene key={i} />
      ))}
    </div>
  );
}
```

### 5. Hot Reload / Recarga del Player

**Nuevo archivo `docs/code-snippets/remotion-hot-reload.md`**:

```typescript
// React Hook para recarga del player
export function useRemotionReload(videoId: string) {
  const [key, setKey] = useState(0);
  
  useEffect(() => {
    const es = new EventSource(`/api/videos/${videoId}/events`);
    
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'code_updated') {
        // Forzar re-mount del player
        setKey(k => k + 1);
        
        // O usar HMR si está disponible
        // import.meta.hot?.accept();
      }
    };
    
    return () => es.close();
  }, [videoId]);
  
  return { key };
}

// Uso en componente
function VideoPreview({ videoId }) {
  const { key } = useRemotionReload(videoId);
  
  return (
    <Player
      key={key}  // Re-mount cuando cambia
      component={VideoComposition}
      // ... props
    />
  );
}
```

### 6. Estados de Edición en State Machine

**Modificar `docs/architecture/state-machine.md`** para agregar:

```typescript
// Nuevos estados para edición Remotion
type VideoStatus = 
  | 'draft'
  | 'generating_idea'
  | 'idea_ready'
  | 'editing_remotion'      // NUEVO: Agente generando código
  | 'preview_ready'         // NUEVO: Código listo para preview
  | 'generating_clips'
  | 'clips_ready'
  | 'composing'
  | 'completed'
  | 'failed';

// Handler para editing_remotion
editing_remotion: {
  onEnter: async (video) => {
    // OpenCode genera código para cada escena
    for (const scene of video.scenes) {
      const code = await openCode.generateSceneCode(scene);
      await saveSceneCode(scene.id, code);
    }
    
    // Notificar que el código está listo
    sseEmitter.emit(`video:${video.id}`, {
      type: 'code_updated',
      videoId: video.id,
    });
    
    await transitionTo(video.id, 'preview_ready');
  },
}
```

### 7. API Endpoints para Edición

```typescript
// POST /api/scenes/:sceneId/code
// Genera código para una escena específica
router.post('/:sceneId/code', async (req, res) => {
  const { sceneId } = req.params;
  const { instruction } = req.body; // "Agrega título animado"
  
  const scene = await db.scenes.findById(sceneId);
  const context = await buildMergedContext(scene); // T1
  
  // Llamar a OpenCode con prompt de edición
  const code = await openCodeBridge.generateCode({
    instruction,
    context,
    currentCode: await loadSceneCode(sceneId),
  });
  
  // Guardar código generado
  await saveSceneCode(sceneId, code);
  
  // Notificar via SSE
  sseEmitter.emit(`scene:${sceneId}`, { type: 'code_updated' });
  
  res.json({ status: 'code_generated' });
});

// GET /api/videos/:videoId/code
// Obtiene todo el código generado
router.get('/:videoId/code', async (req, res) => {
  const scenes = await db.scenes.findByVideoId(req.params.videoId);
  const code = {};
  
  for (const scene of scenes) {
    code[scene.id] = await loadSceneCode(scene.id);
  }
  
  res.json({ scenes: code });
});
```

### 8. Validación de Código Generado

```typescript
// Validación básica de código generado
function validateGeneratedCode(code: string): ValidationResult {
  const errors = [];
  
  // Verificar que exporta default
  if (!code.includes('export default')) {
    errors.push('El código debe exportar un componente default');
  }
  
  // Verificar imports permitidos
  const allowedImports = ['remotion', './components'];
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    const pkg = match[1];
    if (!allowedImports.some(a => pkg.startsWith(a))) {
      errors.push(`Import no permitido: ${pkg}`);
    }
  }
  
  // Verificar dimensiones
  if (!code.includes('1080') || !code.includes('1920')) {
    errors.push('Las dimensiones deben ser 1080x1920');
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

## Checklist de Completitud

- [ ] Documento `remotion-code-generation.md` creado con arquitectura completa
- [ ] Documento `remotion-hot-reload.md` creado con patrones de recarga
- [ ] Estados `editing_remotion` y `preview_ready` agregados a state-machine.md
- [ ] Prompts separados documentados (idea vs código vs edición)
- [ ] Ejemplos de código React/Remotion generado incluidos
- [ ] API endpoints para edición documentados
- [ ] Estrategia de validación de código documentada
- [ ] Estructura de archivos `generated/` documentada

---

## Ejemplo de Iteración Completa

Documentar flujo completo de ejemplo:

```
1. Usuario: "Crea una escena con el logo del gimnasio"
   ↓
2. Agente genera Scene1.tsx con <Logo /> estático
   ↓
3. Player muestra logo estático
   ↓
4. Usuario: "Haz que el logo rote al entrar"
   ↓
5. Agente modifica Scene1.tsx agregando <AnimatedLogo />
   ↓
6. Player se recarga, muestra logo con rotación
   ↓
7. Usuario: "Perfecto, genera el video"
   ↓
8. Sistema pasa a estado generating_clips (MiniMax)
```

---

## Notas de Implementación

1. **Sandboxing**: El código generado corre en el cliente, no en servidor - riesgo reducido
2. **Versionado**: Guardar historial de cambios para poder hacer "undo"
3. **Preview antes de clips**: El usuario puede iterar el diseño antes de gastar créditos de MiniMax
4. **Types**: Generar archivos `.d.ts` para autocompletado en editor integrado (opcional futuro)
