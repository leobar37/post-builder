# Projects - Architecture

## Overview

Los **Proyectos** son el contenedor principal para organizar videos. Cada proyecto tiene su propia carpeta de contexto (`projects/{contextId}/`) que OpenCode utiliza para generar ideas de video.

## Concepto

```
┌─────────────────────────────────────────────────────────────────┐
│                           PROJECTS                              │
├─────────────────────────────────────────────────────────────────┤
│  • Cada proyecto tiene un contextId único                       │
│  • Los videos heredan el contexto de su proyecto                │
│  • Un proyecto puede tener múltiples videos (1:N)               │
│  • El contextId define la carpeta: projects/{id}/               │
│  • OpenCode se ejecuta siempre desde el workspace/              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           VIDEOS                                │
├─────────────────────────────────────────────────────────────────┤
│  • Cada video pertenece a un proyecto                           │
│  • Usa el contextId del proyecto para referenciar carpeta       │
│  • Mantiene su propio estado y progreso                         │
└─────────────────────────────────────────────────────────────────┘
```

## Convención de Carpetas

Cada proyecto tiene su contexto en `projects/{contextId}/`:

```
projects/
├── promo-mayo-2024/              # contextId = "promo-mayo-2024"
│   ├── system.md                 # System prompt base
│   ├── brand.md                  # Guía de marca
│   └── audience.md               # Público objetivo
│
├── testimonios-q2/               # contextId = "testimonios-q2"
│   └── system.md
│
└── navidad-2024/                 # contextId = "navidad-2024"
    └── system.md
```

**Ver**: [Context Convention](./context-convention.md) para detalles completos.

## Casos de Uso

### Ejemplo 1: Campañas Mensuales
```
Proyecto: "Promoción Mayo 2024"
  ├── contextId: promo-mayo-2024
  ├── Carpeta: projects/promo-mayo-2024/
  ├── Video: "Membresías 50% off" (completado)
  ├── Video: "Nuevas instalaciones" (en progreso)
  └── Video: "Testimonios clientes" (draft)

Proyecto: "Verano Fit 2024"
  ├── contextId: verano-2024
  ├── Carpeta: projects/verano-2024/
  ├── Video: "Rutina playa" (completado)
  └── Video: "Nutrición verano" (draft)
```

### Ejemplo 2: Tipos de Contenido
```
Proyecto: "Testimonios"
  ├── contextId: testimonials
  ├── Carpeta: projects/testimonials/
  └── Videos: Testimonios de clientes

Proyecto: "Tips de Entrenamiento"
  ├── contextId: training-tips
  ├── Carpeta: projects/training-tips/
  └── Videos: Tips rápidos

Proyecto: "Promociones"
  ├── contextId: promos
  ├── Carpeta: projects/promos/
  └── Videos: Ofertas y descuentos
```

## Estructura del Contexto

La carpeta `projects/{contextId}/` contiene:

```
projects/promo-mayo-2024/
├── system.md              # System prompt base (requerido)
├── brand.md               # Guías de marca
├── audience.md            # Público objetivo
├── guidelines/
│   ├── tone.md           # Tono de voz
│   └── visuals.md        # Guía visual
└── assets/
    ├── logo.png
    └── colors.json
```

## Flujo de Trabajo

### 1. Crear Proyecto
```
Usuario crea proyecto → Define nombre, descripción, contextId
                           ↓
                    Sistema crea carpeta projects/{contextId}/
                           ↓
                    Usuario agrega archivos de contexto
                           ↓
                    Proyecto listo para usar
```

### 2. Crear Video en Proyecto
```
Usuario selecciona proyecto → Escribe prompt
                                   ↓
                            Sistema usa contextId del proyecto
                                   ↓
                            OpenCode lee archivos de projects/{id}/
                                   ↓
                            Genera idea de video relevante
```

### 3. OpenCode Accede al Contexto
```
OpenCode se ejecuta en workspace/
           ↓
Lee projects/promo-mayo-2024/system.md
           ↓
Lee projects/promo-mayo-2024/brand.md
           ↓
Genera respuesta basada en el contexto
```

**Importante**: OpenCode nunca recibe `--cwd`. Siempre se ejecuta desde el directorio raíz del proyecto y accede al contexto mediante referencias a carpetas.

## Interfaz de Usuario

### Selector de Proyecto
```
┌─────────────────────────────────────────────────────────┐
│  🎬 Nuevo Video                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Selecciona un proyecto:                             │
│                                                         │
│     ┌─────────────────────────────────────────────┐    │
│     │ 🔍 Buscar proyectos...                      │    │
│     └─────────────────────────────────────────────┘    │
│                                                         │
│     ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│     │ 🎯 Promo   │  │ 💬 Testi-  │  │ ➕ Nuevo   │    │
│     │    Mayo    │  │  monios    │  │  Proyecto  │    │
│     │            │  │            │  │            │    │
│     │ 5 videos   │  │ 12 videos  │  │            │    │
│     └────────────┘  └────────────┘  └────────────┘    │
│                                                         │
│  2. Escribe tu prompt:                                  │
│     ┌─────────────────────────────────────────────┐    │
│     │ Video sobre membresías con descuento...     │    │
│     └─────────────────────────────────────────────┘    │
│                                                         │
│     [Cancelar]              [Generar Idea →]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Lista de Proyectos
```
┌─────────────────────────────────────────────────────────┐
│  📁 Proyectos                              [+ Nuevo]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎯 Promoción Mayo 2024              [⋮] [→]    │   │
│  │    5 videos | 3 completados | Último: hace 2d  │   │
│  │    Contexto: promo-mayo-2024                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 💬 Testimonios Clientes             [⋮] [→]    │   │
│  │    12 videos | 8 completados | Último: ayer    │   │
│  │    Contexto: testimonials                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## API Flow

### Crear Proyecto
```typescript
// POST /api/projects
async function createProject(data: CreateProjectRequest) {
  const project = await db.projects.create({
    name: data.name,
    description: data.description,
    contextId: data.contextId,  // ej: "promo-mayo-2024"
  });

  // Crear carpeta de contexto
  await fs.mkdir(`projects/${project.contextId}`, { recursive: true });

  // Crear system.md base si no existe
  const systemPath = `projects/${project.contextId}/system.md`;
  if (!await fs.exists(systemPath)) {
    await fs.writeFile(systemPath, defaultSystemPrompt);
  }

  return project;
}
```

### Crear Video (con Proyecto)
```typescript
// POST /api/projects/:projectId/videos
async function createVideo(projectId: string, prompt: string) {
  // 1. Verificar que el proyecto existe
  const project = await db.projects.findById(projectId);
  if (!project) throw new Error('Project not found');

  // 2. Verificar que la carpeta de contexto existe
  const contextPath = `projects/${project.contextId}`;
  if (!await fs.exists(contextPath)) {
    throw new Error(`Context folder not found: ${contextPath}`);
  }

  // 3. Crear video asociado al proyecto
  const video = await db.videos.create({
    projectId: project.id,
    prompt,
    status: 'draft',
  });

  // 4. Iniciar generación con el contextId del proyecto
  await startIdeaGeneration(video.id, project.contextId);

  return video;
}
```

### Prompt a OpenCode
```typescript
async function generateIdea(videoId: string, contextId: string) {
  const video = await db.videos.findById(videoId);

  const prompt = `
Lee el contexto en projects/${contextId}/ y genera una idea de video.

Prompt del usuario: ${video.prompt}

Considera:
- system.md (instrucciones base)
- brand.md (guía de marca)
- audience.md (público objetivo)

Responde con JSON válido.
`;

  // OpenCode corre en workspace/, accede a projects/{id}/
  await openCode.sendPrompt(video.opencodeSessionId, prompt, {
    taskType: 'idea'
  });
}
```

## Base de Datos

### Relaciones
```sql
-- Un proyecto tiene muchos videos
projects (1) ───────< (N) videos

-- Foreign key en videos
project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
```

### Tabla projects
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,                    -- UUID v4
  name TEXT NOT NULL,                     -- "Promo Mayo 2024"
  description TEXT,                       -- Descripción opcional
  context_id TEXT NOT NULL,               -- ID de carpeta (ej: "promo-mayo-2024")

  -- Configuración del proyecto (JSON)
  config TEXT,                            -- { theme, defaultDuration, etc. }

  -- Status
  status TEXT DEFAULT 'active',           -- active | archived | deleted

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Queries Comunes

#### Videos por proyecto
```sql
SELECT * FROM videos
WHERE project_id = ?
ORDER BY created_at DESC;
```

#### Proyectos con conteo de videos
```sql
SELECT
  p.*,
  COUNT(v.id) as video_count,
  COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_videos
FROM projects p
LEFT JOIN videos v ON v.project_id = p.id
WHERE p.status = 'active'
GROUP BY p.id;
```

#### Buscar por contextId
```sql
SELECT * FROM projects
WHERE context_id = 'promo-mayo-2024';
```

## Migración desde contextPath

### Antes (config.yaml)
```yaml
context:
  paths:
    promo-mayo: './content/campaigns/mayo-2024'
    testimonials: './content/templates/testimonials'
```

### Ahora (carpetas + DB)
```sql
-- Proyecto con contextId
INSERT INTO projects (id, name, context_id)
VALUES ('uuid-1', 'Promo Mayo 2024', 'promo-mayo-2024');
```

```
projects/
├── promo-mayo-2024/          # context_id = "promo-mayo-2024"
│   └── system.md
└── testimonials/             # context_id = "testimonials"
    └── system.md
```

## Ventajas del Nuevo Sistema

| Aspecto | Antes (contextPath) | Ahora (contextId) |
|---------|--------------------|--------------------|
| **Ubicación** | Paths arbitrarios | Convención fija: `projects/{id}/` |
| **Permisos** | Problemas con paths externos | Todo dentro del proyecto |
| **OpenCode cwd** | Variable por proyecto | Siempre workspace/ |
| **Versionado** | Difícil de trackear | Carpetas en git |
| **Multi-proyecto** | Config en YAML | Carpetas autónomas |
| **Debugging** | Paths difíciles de encontrar | Estructura predecible |

## TypeScript Interface

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  contextId: string;        // Nombre de carpeta en projects/
  config?: ProjectConfig;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProjectRequest {
  name: string;
  description?: string;
  contextId: string;        // ej: "promo-mayo-2024"
}
```
