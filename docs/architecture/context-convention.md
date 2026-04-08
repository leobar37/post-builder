# Context Convention

## Overview

Convención de carpetas para organizar el contexto que OpenCode utiliza. OpenCode siempre se ejecuta desde el directorio raíz del proyecto y accede al contexto mediante referencias a carpetas.

## Estructura de Carpetas

```
workspace/                              # Raíz del proyecto
│
├── .context/                           # Contexto global (opcional)
│   ├── system.md                       # System prompt base por defecto
│   └── shared/                         # Recursos compartidos
│       ├── common-patterns.md
│       └── base-templates/
│
├── projects/                           # Contexto por proyecto (REQUERIDO)
│   ├── promo-mayo-2024/                # ID del proyecto = nombre de carpeta
│   │   ├── system.md                   # System prompt específico del proyecto
│   │   ├── brand.md                    # Guía de marca
│   │   ├── audience.md                 # Público objetivo
│   │   ├── guidelines/
│   │   │   ├── tone.md                 # Tono de voz
│   │   │   └── visuals.md              # Guía visual
│   │   └── assets/
│   │       ├── logo.png
│   │       └── colors.json
│   │
│   ├── testimonios-q2/
│   │   ├── system.md
│   │   └── ...
│   │
│   └── navidad-2024/
│       └── ...
│
├── src/                                # Código fuente
├── videos/                             # Output de videos
└── ...config files
```

## Convenciones

### 1. Nombre de Carpetas de Proyecto

- Usar kebab-case: `promo-mayo-2024`, `testimonios-clientes`
- Sin espacios ni caracteres especiales
- Único en toda la aplicación
- Se almacena en `projects.context_id`

### 2. Archivos de Contexto

| Archivo | Propósito | Requerido |
|---------|-----------|-----------|
| `system.md` | Instrucciones base para OpenCode | Sí |
| `brand.md` | Guía de marca y valores | Recomendado |
| `audience.md` | Descripción del público objetivo | Recomendado |
| `guidelines/*.md` | Reglas específicas por categoría | Opcional |
| `assets/*` | Imágenes, logos, archivos de referencia | Opcional |

### 3. Archivo system.md

Template base:

```markdown
# System Prompt: {Nombre del Proyecto}

## Rol
Eres un experto en marketing digital para el sector fitness.

## Contexto del Proyecto
- **Marca**: GymSpace Fitness Center
- **Objetivo**: Incrementar membresías en un 20%
- **Período**: Mayo 2024

## Directrices de Contenido
- Tono: Motivador pero profesional
- Audiencia: Adultos 25-45 años, nivel intermedio
- Plataforma: Instagram Reels (9:16)

## Restricciones
- Duración: 15-30 segundos por video
- Máximo 5 escenas por video
- Incluir siempre call-to-action

## Ejemplos de Éxito
[Incluir ejemplos de videos previos exitosos]
```

## Flujo de Uso

### 1. Crear Proyecto

```typescript
// POST /api/projects
{
  "name": "Promoción Mayo 2024",
  "contextId": "promo-mayo-2024"  // = nombre de carpeta en projects/
}
```

### 2. Crear Carpeta de Contexto

```bash
mkdir -p projects/promo-mayo-2024/guidelines
mkdir -p projects/promo-mayo-2024/assets

# Crear archivos de contexto
echo "# System Prompt..." > projects/promo-mayo-2024/system.md
echo "# Brand Guidelines..." > projects/promo-mayo-2024/brand.md
```

### 3. Usar en OpenCode

```typescript
// OpenCode siempre corre desde workspace/
// El prompt referencia la carpeta del proyecto

await openCode.sendPrompt(sessionId, `
  Lee el contexto en projects/promo-mayo-2024/ y genera una idea para:
  "${videoPrompt}"
  
  Archivos a considerar:
  - system.md (instrucciones base)
  - brand.md (guía de marca)
  - audience.md (público objetivo)
`);
```

## Ventajas

| Aspecto | Beneficio |
|---------|-----------|
| **Permisos** | OpenCode corre en directorio controlado del proyecto |
| **Versionado** | Carpetas `projects/` pueden versionarse con git |
| **Aislamiento** | Cada proyecto tiene su contexto aislado |
| **Simplicidad** | No hay que gestionar paths absolutos variables |
| **Multi-proyecto** | Fácil crear múltiples contextos |

## Ejemplo Completo

```typescript
// Crear proyecto con contexto
const project = await projectService.create({
  name: "Promo Mayo 2024",
  description: "Campaña de membresías",
  contextId: "promo-mayo-2024"
});

// Crear carpeta de contexto
await fs.mkdir(`projects/${project.contextId}`, { recursive: true });
await fs.writeFile(
  `projects/${project.contextId}/system.md`,
  systemPromptTemplate
);

// Crear video usando el contexto
const video = await videoService.create({
  projectId: project.id,
  prompt: "Video sobre membresías con descuento"
});

// OpenCode accede automáticamente a projects/promo-mayo-2024/
await openCodeService.generateIdea(video.id, project.contextId);
```

## Migración desde contextPath

Antes:
```yaml
context:
  paths:
    promo-mayo: './content/campaigns/mayo-2024'
```

Ahora:
```
projects/
└── promo-mayo-2024/          # context_id = "promo-mayo-2024"
    └── system.md
```

## Notas de Implementación

1. **OpenCode nunca recibe `--cwd`**: Siempre se ejecuta desde el directorio raíz del proyecto
2. **Los prompts referencian carpetas**: No se cargan archivos, se referencian
3. **Estructura plana por diseño**: Facilita debugging y comprensión
4. **Git**: Agregar `projects/*/assets/` a `.gitignore` si son archivos binarios grandes
