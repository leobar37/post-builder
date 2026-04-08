# Índice de Tareas: Mejora de Documentación

## Resumen del Plan

**Objetivo**: Fortalecer la documentación técnica del Video Pipeline System con 4 capacidades avanzadas.

**Ubicación**: `.plans/docs-improvement/`

**Dependencias principales**:
```
T1 ──┬──▶ T2
     └──▶ T3
          ▼
          T4
```

---

## Lista de Tareas

| ID | Nombre | Archivo | Estado | Requisitos Cubiertos |
|----|--------|---------|--------|----------------------|
| T1 | [Contexto Jerárquico](tasks/01-hierarchical-context.md) | `tasks/01-hierarchical-context.md` | pending | FR-001, FR-002, NFR-001 |
| T2 | [Remotion Live Editing](tasks/02-remotion-live-editing.md) | `tasks/02-remotion-live-editing.md` | pending | FR-003, FR-004, NFR-001 |
| T3 | [Control de Modelos OpenCode](tasks/03-opencode-model-control.md) | `tasks/03-opencode-model-control.md` | pending | FR-005, FR-007, NFR-001 |
| T4 | [Control MiniMax Avanzado](tasks/04-minimax-advanced-control.md) | `tasks/04-minimax-advanced-control.md` | pending | FR-006, NFR-001 |
| T5 | [Actualización de Índices](tasks/05-update-indices.md) | `tasks/05-update-indices.md` | pending | IR-001, IR-002, IR-003 |

---

## Orden de Ejecución Recomendado

### Opción A: Por Dependencias (Recomendado)
1. **T1** - Contexto Jerárquico (base de todo)
2. **T2** y **T3** - Pueden ejecutarse en paralelo después de T1
3. **T4** - Independiente, puede ir en cualquier momento
4. **T5** - Siempre al final

### Opción B: Por Prioridad de Negocio
1. **T1** - Contexto Jerárquico (bloqueante)
2. **T2** - Remotion Live Editing (diferenciador clave)
3. **T3** - Control de Modelos
4. **T4** - Control MiniMax
5. **T5** - Actualización de Índices

---

## Archivos a Crear/Modificar

### Nuevos Archivos (Output)
| Ruta | Tarea | Descripción |
|------|-------|-------------|
| `docs/architecture/hierarchical-context.md` | T1 | Documentación del contexto en 3 niveles |
| `docs/integrations/remotion-code-generation.md` | T2 | Generación de código por agente |
| `docs/code-snippets/remotion-hot-reload.md` | T2 | Patrones de recarga del player |
| `docs/integrations/opencode-advanced.md` | T3 | Control de modelos y parámetros |
| `docs/integrations/minimax-advanced.md` | T4 | Control granular de generaciones |

### Archivos a Modificar (Update)
| Ruta | Tarea | Modificación |
|------|-------|--------------|
| `docs/database/schema.md` | T1 | Agregar columnas context |
| `docs/models/README.md` | T1 | Agregar interfaces VideoContext, SceneContext |
| `docs/architecture/state-machine.md` | T2 | Agregar estados de edición |
| `docs/reference/api-endpoints.md` | T4 | Agregar endpoints de control MiniMax |
| `docs/index.md` | T5 | Agregar links a nuevos documentos |
| `docs/README.md` | T5 | Actualizar descripción de capacidades |

---

## Checklist de Completitud

- [ ] T1: Contexto Jerárquico documentado
- [ ] T2: Remotion Live Editing documentado
- [ ] T3: Control de Modelos documentado
- [ ] T4: Control MiniMax avanzado documentado
- [ ] T5: Índices actualizados
- [ ] Validación: Todos los requisitos FR cubiertos
- [ ] Validación: Todos los requisitos NFR cumplidos
- [ ] Validación: Sin breaking changes en docs existentes

---

## Referencias Rápidas

- [Contexto del Plan](context.md)
- [Requisitos](requirements.md)
- [Checklist Operativo](checklist.json)
