# Tarea 5: Actualizar Índices y Referencias Cruzadas

**ID**: T5  
**Estado**: pending  
**Requisitos**: IR-001, IR-002, IR-003  
**Dependencias**: T1, T2, T3, T4  

---

## Objetivo

Actualizar todos los índices y referencias cruzadas para integrar la nueva documentación con la existente de manera cohesiva.

---

## Archivos a Modificar

| Archivo | Descripción de Cambios |
|---------|------------------------|
| `docs/index.md` | Agregar links a nuevos documentos |
| `docs/README.md` | Actualizar descripción de capacidades |
| `docs/architecture/projects.md` | Agregar referencia a contexto jerárquico |
| `docs/architecture/state-machine.md` | Referenciar documentos de edición y control |
| `docs/integrations/opencode.md` | Agregar link a documentación avanzada |
| `docs/integrations/minimax.md` | Agregar link a control avanzado |
| `docs/reference/api-endpoints.md` | Referenciar endpoints documentados en T2-T4 |

---

## Cambios Detallados

### 1. Actualizar `docs/index.md`

Agregar sección de "Capacidades Avanzadas":

```markdown
## Capacidades Avanzadas

### Contexto y Jerarquía
- [Contexto Jerárquico](./architecture/hierarchical-context.md) - Contexto en 3 niveles
- [Proyectos](./architecture/projects.md) - Organización de videos

### Edición Interactiva
- [Remotion Code Generation](./integrations/remotion-code-generation.md) - Agente genera código
- [Hot Reload](./code-snippets/remotion-hot-reload.md) - Recarga del player

### Control Avanzado
- [OpenCode Advanced](./integrations/opencode-advanced.md) - Control de modelos
- [MiniMax Advanced](./integrations/minimax-advanced.md) - Control de generaciones
```

### 2. Actualizar `docs/README.md`

Agregar sección de "Nuevas Capacidades":

```markdown
## Nuevas Capacidades

### 🎯 Contexto Jerárquico
Contexto en tres niveles: Proyecto → Video → Escena, con estrategia de merge inteligente.
[Ver documentación](./architecture/hierarchical-context.md)

### ✏️ Edición Interactiva con Agente
El agente puede generar y modificar código Remotion en tiempo real. El usuario ve cambios instantáneamente en el player.
[Ver documentación](./integrations/remotion-code-generation.md)

### 🤖 Control de Modelos
Configura diferentes modelos de IA para diferentes tareas: Claude Opus para ideas, Sonnet para código, Haiku para ediciones rápidas.
[Ver documentación](./integrations/opencode-advanced.md)

### 🎬 Control Granular de Generaciones
Cancela, pausa, reanuda y regenera escenas individuales. Control total sobre el proceso de generación MiniMax.
[Ver documentación](./integrations/minimax-advanced.md)
```

### 3. Agregar Referencias Cruzadas

En cada documento nuevo, agregar al final:

```markdown
## Ver También

- [Documentación relacionada](./path/to/doc.md)
- [Ejemplo práctico](../code-snippets/example.md)
```

### 4. Actualizar Diagrama de Arquitectura

En `docs/architecture/overview.md`, agregar nota:

```markdown
## Arquitectura Extendida

Para la versión completa con contexto jerárquico y edición interactiva, ver:
- [Contexto Jerárquico](./hierarchical-context.md)
- [Remotion Code Generation](../integrations/remotion-code-generation.md)
```

---

## Checklist de Completitud

- [ ] `docs/index.md` actualizado con nuevos links
- [ ] `docs/README.md` actualizado con nuevas capacidades
- [ ] Referencias cruzadas agregadas en T1-T4
- [ ] Links verificados (sin rotos)
- [ ] Jerarquía de navegación clara
- [ ] Documentación existente referencia a la nueva
