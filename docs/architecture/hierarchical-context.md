# Contexto Jerárquico de Tres Niveles

## Overview

El sistema utiliza un modelo de **contexto jerárquico** de tres niveles que permite definir información contextual en diferentes granularidades: **Project**, **Video** y **Scene**. Cada nivel puede contener metadatos específicos que se combinan (merge) para formar el contexto completo que OpenCode accede directamente desde el filesystem.

**Importante**: OpenCode se ejecuta siempre desde el workspace raíz y accede al contexto mediante referencias a carpetas en `projects/{contextId}/`.

## Jerarquía de Contexto

```
┌─────────────────────────────────────────────────────────────────┐
│                    JERARQUÍA DE CONTEXTO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │   PROJECT   │  contextId: "promo-verano-2024"               │
│  │             │                                                │
│  │  Archivos   │  projects/promo-verano-2024/                  │
│  │  físicos    │  • system.md (base)                           │
│  │             │  • brand.md (guía de marca)                   │
│  │             │  • audience.md (público objetivo)             │
│  │             │  • guidelines/                                │
│  └──────┬──────┘  • assets/                                    │
│         │                                                       │
│         │ 1:N                                                   │
│         ▼                                                       │
│  ┌─────────────┐    context JSON (DB)                           │
│  │    VIDEO    │  {                                             │
│  │             │    theme: "Promo membresías verano",          │
│  │  Metadatos  │    objective: "conversion",                   │
│  │  específicos│    visualStyle: {...},                        │
│  │             │    targetAudience: {...}                      │
│  └──────┬──────┘  }                                             │
│         │                                                       │
│         │ 1:N                                                   │
│         ▼                                                       │
│  ┌─────────────┐    context JSON (DB)                           │
│  │    SCENE    │  {                                             │
│  │             │    action: "Atleta entra al gym",             │
│  │  Detalle    │    visualElements: {...},                     │
│  │  escena     │    textOverlay: {...},                        │
│  │             │    emotion: "excitement"                      │
│  └─────────────┘  }                                             │
│         │                                                       │
│         │ OpenCode lee desde workspace/                         │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              OPENCODE ACCEDE:                           │   │
│  │                                                         │   │
│  │  Lee projects/promo-verano-2024/system.md              │   │
│  │  Lee projects/promo-verano-2024/brand.md               │   │
│  │  Recibe video.context y scene.context vía ACP          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Niveles de Contexto

### 1. Project Context (Nivel 1)

El contexto del proyecto se define a través del `contextId`: un identificador que determina la carpeta `projects/{contextId}/` en el filesystem.

**Ubicación**: `project.contextId` → carpeta `projects/{contextId}/`

**Convención de carpetas**:
```
projects/
└── promo-verano-2024/              # contextId = "promo-verano-2024"
    ├── system.md                   # System prompt base (requerido)
    ├── brand.md                    # Guía de marca
    ├── audience.md                 # Público objetivo
    ├── guidelines/
    │   ├── tone.md                 # Tono de voz
    │   └── visuals.md              # Guía visual
    └── assets/                     # Imágenes, logos, fuentes
```

**Acceso desde OpenCode**:
OpenCode se ejecuta siempre desde el workspace raíz y accede a los archivos usando la referencia a la carpeta:

```typescript
// El prompt referencia la carpeta del proyecto
const prompt = `
Lee el contexto en projects/${project.contextId}/ y genera una idea.

Archivos disponibles:
- projects/${project.contextId}/system.md
- projects/${project.contextId}/brand.md
- projects/${project.contextId}/audience.md

Prompt del usuario: ${userPrompt}
`;
```

**Ventajas**:
- Archivos grandes (imágenes, documentos extensos)
- Versionado natural (git)
- Fácil edición con cualquier editor
- Reutilizable entre videos del mismo proyecto

### 2. Video Context (Nivel 2)

El contexto del video es un objeto JSON almacenado en la base de datos que define metadatos específicos del video.

**Ubicación**: `video.context` → campo JSON en tabla `videos`

**Estructura**:
```typescript
interface VideoContext {
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
```

**Ejemplo**:
```json
{
  "theme": "Promoción de membresías con descuento de verano",
  "objective": "conversion",
  "visualStyle": {
    "mood": "energetic",
    "colorPalette": ["#FF6B35", "#004E89"],
    "typography": "bold"
  },
  "targetAudience": {
    "ageRange": "18-35",
    "fitnessLevel": "beginner",
    "interests": ["weight loss", "summer body"]
  }
}
```

### 3. Scene Context (Nivel 3)

El contexto de la escena es un objeto JSON almacenado en la base de datos que define detalles específicos de cada escena individual.

**Ubicación**: `scene.context` → campo JSON en tabla `scenes`

**Estructura**:
```typescript
interface SceneContext {
  // Acción específica que ocurre en la escena
  action?: string;
  
  // Elementos visuales presentes
  visualElements?: {
    people?: number;
    location?: string;
    props?: string[];
    lighting?: 'natural' | 'studio' | 'dramatic';
  };
  
  // Información de texto/overlay
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
```

**Ejemplo**:
```json
{
  "action": "Atleta entra al gimnasio con energía",
  "visualElements": {
    "people": 1,
    "location": "Entrada principal del gimnasio",
    "props": ["mochila deportiva", "botella de agua"],
    "lighting": "natural"
  },
  "textOverlay": {
    "headline": "¿LISTO PARA EL VERANO?",
    "subheadline": "50% OFF en tu primera membresía"
  },
  "emotion": "excitement"
}
```

## Estrategia de Construcción de Contexto

Cuando OpenCode necesita contexto para generar contenido, el sistema construye el prompt combinando referencias a archivos del proyecto con contextos JSON de video y escena.

### Algoritmo de Construcción

```typescript
/**
 * Construye el prompt para OpenCode con referencias a contexto
 * OpenCode lee directamente desde projects/{contextId}/
 */
async function buildContextPrompt(
  project: Project,
  video: Video,
  scene?: Scene
): Promise<string> {
  // 1. Contexto del proyecto se referencia por path
  // OpenCode lee: projects/{contextId}/system.md, brand.md, etc.
  const projectRef = `projects/${project.contextId}/`;
  
  // 2. Parsear contextos JSON de video y escena
  const videoContext = video.context ? JSON.parse(video.context) : {};
  const sceneContext = scene?.context ? JSON.parse(scene.context) : {};
  
  // 3. Construir prompt con referencias y contextos
  return `
Lee el contexto del proyecto en: ${projectRef}

CONTEXTO DEL VIDEO:
${JSON.stringify(videoContext, null, 2)}

${scene ? `CONTEXTO DE LA ESCENA:\n${JSON.stringify(sceneContext, null, 2)}` : ''}

Instrucción: Genera contenido basado en la información anterior.
`;
}
```

### Flujo de Acceso al Contexto

```
┌─────────────────────────────────────────────────────────────┐
│           FLUJO DE ACCESO AL CONTEXTO                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PROJECT (Archivos físicos)                              │
│     projects/{contextId}/                                   │
│     └── OpenCode lee directamente los archivos              │
│                                                             │
│  2. VIDEO (JSON via ACP)                                    │
│     video.context                                           │
│     └── Se incluye en el prompt enviado                     │
│                                                             │
│  3. SCENE (JSON via ACP)                                    │
│     scene.context                                           │
│     └── Se incluye en el prompt enviado                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PROMPT FINAL ENVIADO A OPENCODE:                   │   │
│  │                                                     │   │
│  │  Lee el contexto en projects/promo-mayo-2024/      │   │
│  │                                                     │   │
│  │  CONTEXTO DEL VIDEO:                               │   │
│  │  { theme: "Promo 50% off", ... }                   │   │
│  │                                                     │   │
│  │  CONTEXTO DE LA ESCENA:                            │   │
│  │  { action: "Atleta entra", ... }                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Ejemplo Completo: Promo de Verano

### Escenario
Crear un video promocional para el gimnasio con temática de verano.

### Configuración de Contexto

**Project: "Promo Verano 2024"**
```yaml
name: "Promo Verano 2024"
contextId: "promo-verano-2024"
```

Archivos en `projects/promo-verano-2024/`:
- `system.md`: Instrucciones base y formato de respuesta
- `brand.md`: Guía de marca, colores corporativos, logo posición
- `audience.md`: Público objetivo, intereses, pain points
- `guidelines/visuals.md`: Especificaciones visuales
- `assets/logo-verano.png`: Logo con temática veraniega

**Video: "Membresía 50% Off"**
```json
{
  "theme": "Promoción especial de membresías con 50% de descuento",
  "objective": "conversion",
  "visualStyle": {
    "mood": "energetic",
    "colorPalette": ["#FF6B35", "#004E89"],
    "typography": "bold"
  },
  "targetAudience": {
    "ageRange": "18-35",
    "fitnessLevel": "beginner",
    "interests": ["weight loss", "summer body", "beach ready"]
  }
}
```

**Scene 1: "Hook"**
```json
{
  "action": "Atleta entra al gimnasio con energía, sonriendo",
  "visualElements": {
    "people": 1,
    "location": "Entrada principal del gimnasio",
    "props": ["mochila deportiva roja", "botella de agua"],
    "lighting": "natural"
  },
  "textOverlay": {
    "headline": "¿LISTO PARA EL VERANO?",
    "subheadline": "50% OFF en tu primera membresía"
  },
  "emotion": "excitement"
}
```

**Scene 2: "Social Proof"**
```json
{
  "action": "Montaje de clientes entrenando felices",
  "visualElements": {
    "people": 4,
    "location": "Sala de pesas y cardio",
    "props": ["mancuernas", "máquinas"],
    "lighting": "studio"
  },
  "textOverlay": {
    "headline": "+1000 TRANSFORMACIONES",
    "subheadline": "Únete a la familia GymSpace"
  },
  "emotion": "motivation",
  "settings": {
    "useTestimonial": "testimonial-3"
  }
}
```

### Contexto Accesible para OpenCode

OpenCode lee directamente desde el filesystem y recibe contextos JSON via ACP:

```typescript
// Archivos que OpenCode lee de projects/promo-verano-2024/:
// - system.md
// - brand.md
// - audience.md

// Contextos enviados via ACP:
{
  "videoContext": {
    "theme": "Promoción especial de membresías con 50% de descuento",
    "objective": "conversion",
    "visualStyle": {
      "mood": "energetic",
      "colorPalette": ["#FF6B35", "#004E89"],
      "typography": "bold"
    },
    "targetAudience": {
      "ageRange": "18-35",
      "fitnessLevel": "beginner",
      "interests": ["weight loss", "summer body", "beach ready"]
    }
  },
  "sceneContext": {
    // Para Scene 1:
    "action": "Atleta entra al gimnasio con energía, sonriendo",
    "visualElements": { ... },
    "textOverlay": {
      "headline": "¿LISTO PARA EL VERANO?",
      "subheadline": "50% OFF en tu primera membresía"
    },
    "emotion": "excitement"
  }
}
```

## Uso en Prompts

### Prompt para Generar Idea de Video

```typescript
const IDEA_PROMPT = `
Genera una idea de video usando el siguiente contexto.

PRIMERO, lee los archivos de contexto del proyecto:
- projects/${contextId}/system.md
- projects/${contextId}/brand.md
- projects/${contextId}/audience.md

LUEGO, considera el contexto del video:
Tema: {{video.theme}}
Objetivo: {{video.objective}}
Estilo visual: {{video.visualStyle.mood}}
Audiencia: {{video.targetAudience.ageRange}} años, nivel {{video.targetAudience.fitnessLevel}}

Genera:
1. Título atractivo
2. 3-5 escenas con descripción y duración
3. Prompt para cada escena (para MiniMax)

Responde con JSON válido.
`;
```

### Prompt para Generar Código Remotion

```typescript
const CODE_PROMPT = `
Genera código React/Remotion para esta escena.

PRIMERO, revisa las guías visuales en:
- projects/${contextId}/guidelines/visuals.md
- projects/${contextId}/brand.md

CONTEXTO DEL VIDEO:
Tema: {{video.theme}}
Paleta: {{video.visualStyle.colorPalette}}
Tipografía: {{video.visualStyle.typography}}

CONTEXTO DE LA ESCENA:
Acción: {{scene.action}}
Elementos visuales: {{scene.visualElements}}
Texto: {{scene.textOverlay}}
Emoción: {{scene.emotion}}

Genera un componente Scene que represente esta escena.
Dimensiones: 1080x1920 (Instagram Reels)
Responde ÚNICAMENTE con el código TypeScript válido.
`;
```

## Base de Datos

### Esquema Extendido

```sql
-- Tabla videos: agregar columna context
ALTER TABLE videos ADD COLUMN context TEXT; -- JSON con contexto específico

-- Tabla scenes: agregar columna context
ALTER TABLE scenes ADD COLUMN context TEXT; -- JSON con contexto específico
```

### Queries Comunes

```sql
-- Obtener video con contexto
SELECT id, prompt, context
FROM videos
WHERE id = ?;

-- Obtener todas las escenas de un video con contexto
SELECT id, sequence, description, minimax_prompt, context
FROM scenes
WHERE video_id = ?
ORDER BY sequence;

-- Buscar videos por tema en contexto
SELECT id, name
FROM videos
WHERE json_extract(context, '$.theme') LIKE '%verano%';
```

## Mejores Prácticas

1. **Project Context**: Usar para información estática que no cambia frecuentemente (brand, guías, assets)
2. **Video Context**: Usar para metadatos del video específico (tema, objetivo, audiencia)
3. **Scene Context**: Usar para detalles granulares de cada escena (acción, texto, emoción)
4. **Validación**: Siempre validar el JSON antes de guardar (usar Zod)
5. **Backward Compatibility**: Campos opcionales para no romper registros existentes

## Ver También

- [Proyectos](./projects.md) - Concepto de proyectos y organización
- [Integración OpenCode](../integrations/opencode.md) - Cómo usar el contexto en OpenCode
- [Modelos de Datos](../models/README.md) - Interfaces TypeScript completas
- [Esquema de Base de Datos](../database/schema.md) - Estructura SQL
