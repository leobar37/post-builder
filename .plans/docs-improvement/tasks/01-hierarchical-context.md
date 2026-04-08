# Tarea 1: Documentar Contexto Jerárquico de Tres Niveles

**ID**: T1  
**Estado**: pending  
**Requisitos**: FR-001, FR-002, NFR-001, NFR-002  
**Dependencias**: Ninguna (tarea base)  

---

## Objetivo

Documentar la extensión del modelo de datos para soportar contexto en tres niveles jerárquicos: Project → Video → Scene, incluyendo la estrategia de merge que combina los contextos para OpenCode.

---

## Archivos de Entrada

| Archivo | Descripción |
|---------|-------------|
| `docs/database/schema.md` | Esquema actual con projects, videos, scenes |
| `docs/models/README.md` | Interfaces TypeScript actuales |
| `docs/architecture/projects.md` | Concepto de proyectos ya documentado |

---

## Archivos de Salida

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `docs/architecture/hierarchical-context.md` | Crear | Documento principal del contexto jerárquico |
| `docs/database/schema.md` | Modificar | Agregar columnas `context` a videos y scenes |
| `docs/models/README.md` | Modificar | Agregar interfaces `VideoContext`, `SceneContext` |

---

## Contenido a Documentar

### 1. Esquema de Base de Datos Extendido

**Modificar `docs/database/schema.md`**:

```sql
-- Tabla videos: agregar columna context
ALTER TABLE videos ADD COLUMN context TEXT; -- JSON con contexto específico del video

-- Tabla scenes: agregar columna context
ALTER TABLE scenes ADD COLUMN context TEXT; -- JSON con contexto específico de la escena
```

### 2. Interfaces TypeScript

**Agregar a `docs/models/README.md`**:

```typescript
// Contexto específico de un video
export interface VideoContext {
  // Tema principal del video
  theme?: string;
  
  // Objetivo de comunicación
  objective?: 'awareness' | 'conversion' | 'engagement';
  
  // Estilo visual general
  visualStyle?: {
    mood?: 'energetic' | 'calm' | 'professional' | 'fun';
    colorPalette?: string[];
    typography?: 'modern' | 'classic' | 'bold';
  };
  
  // Target audience
  targetAudience?: {
    ageRange?: string;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  };
  
  // Settings adicionales
  settings?: Record<string, unknown>;
}

// Contexto específico de una escena
export interface SceneContext {
  // Acción específica que ocurre en la escena
  action?: string;
  
  // Elementos visuales presentes
  visualElements?: {
    people?: number;
    location?: string;
    props?: string[];
    lighting?: 'natural' | 'studio' | 'dramatic';
  };
  
  // Información de texto/sobres
  textOverlay?: {
    headline?: string;
    subheadline?: string;
    cta?: string;
  };
  
  // Emoción o tono de la escena
  emotion?: 'excitement' | 'motivation' | 'relaxation' | 'urgency';
  
  // Settings adicionales
  settings?: Record<string, unknown>;
}

// Interfaces actualizadas
export interface Video {
  id: string;
  projectId: string;
  status: VideoStatus;
  prompt: string;
  context?: VideoContext;  // NUEVO
  // ... resto de campos
}

export interface Scene {
  id: string;
  videoId: string;
  sequence: number;
  description: string;
  duration: 6 | 8 | 10;
  minimaxPrompt: string;
  context?: SceneContext;  // NUEVO
  // ... resto de campos
}
```

### 3. Estrategia de Merge de Contextos

**Nuevo documento `docs/architecture/hierarchical-context.md`** con:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MERGE DE CONTEXTO                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Project (contextPath)                                          │
│  ├── brand-guidelines.md                                        │
│  ├── color-palette.json                                         │
│  └── logo.png                                                   │
│         │                                                       │
│         ▼                                                       │
│  Video.context (JSON)                                           │
│  { theme: "summer promo", objective: "conversion" }            │
│         │                                                       │
│         ▼                                                       │
│  Scene.context (JSON)                                           │
│  { action: "gym tour", emotion: "excitement" }                 │
│         │                                                       │
│         ▼                                                       │
│  OpenCode recibe:                                               │
│  {                                                              │
│    project: { files: [...], guidelines: {...} },               │
│    video: { theme: "summer promo", ... },                      │
│    scene: { action: "gym tour", ... }                          │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Algoritmo de merge**:
- Project: Carga archivos físicos del `contextPath`
- Video: JSON almacenado en `video.context`
- Scene: JSON almacenado en `scene.context`
- Prioridad: Scene > Video > Project (campos en scene sobrescriben video, etc.)

### 4. Ejemplos Concretos

Documentar ejemplo completo del dominio del gimnasio:

```typescript
// Project: "Promo Verano 2024"
// contextPath: ./content/promo-verano-2024/
// Contiene: brand-guidelines.md, verano-theme.md, logo-verano.png

// Video: "Membresía 50% Off"
const videoContext: VideoContext = {
  theme: "Promoción de membresías con descuento de verano",
  objective: "conversion",
  visualStyle: {
    mood: "energetic",
    colorPalette: ["#FF6B35", "#004E89"], // Naranja cálido, azul profundo
    typography: "bold"
  },
  targetAudience: {
    ageRange: "18-35",
    fitnessLevel: "beginner",
    interests: ["weight loss", "summer body"]
  }
};

// Scene 1: "Hook inicial"
const sceneContext: SceneContext = {
  action: "Atleta entra al gimnasio con energía",
  visualElements: {
    people: 1,
    location: "Entrada principal del gimnasio",
    props: ["mochila deportiva", "botella de agua"],
    lighting: "natural"
  },
  textOverlay: {
    headline: "¿LISTO PARA EL VERANO?",
    subheadline: "50% OFF en tu primera membresía"
  },
  emotion: "excitement"
};
```

---

## Checklist de Completitud

- [ ] Esquema SQL actualizado con columnas `context`
- [ ] Interfaces TypeScript `VideoContext` y `SceneContext` definidas
- [ ] Documento `hierarchical-context.md` creado
- [ ] Diagrama de merge de contextos incluido
- [ ] Ejemplo concreto del dominio del gimnasio documentado
- [ ] Estrategia de prioridad documentada (scene > video > project)
- [ ] Referencias cruzadas con `projects.md` agregadas

---

## Notas de Implementación

1. **Tipo de datos**: Usar `TEXT` en SQLite para almacenar JSON; parsear en aplicación.
2. **Validación**: Incluir esquema Zod para validar estructura del contexto.
3. **Migrations**: Documentar query de migración para tablas existentes.
4. **Backward compatibility**: Los campos son opcionales (`?`) para no romper registros existentes.

---

## Relación con Otras Tareas

- **T2 (Remotion Live Editing)**: Depende de esta tarea - el contexto de escena alimenta los prompts de generación de código
- **T3 (Control de Modelos)**: Complementa - el contexto se envía al modelo seleccionado

