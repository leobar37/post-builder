# Task Index — Projects → Videos → Scenes

## Tasks

| ID | Task | Requirements | Status |
|----|------|-------------|--------|
| T-001 | Definir tipos request/response centralizados | RE-001 | pending |
| T-002 | ProjectService — lógica de negocio de projects | RE-002 | pending |
| T-003 | EventService — event bus + SSE helper | RE-005 | pending |
| T-004 | SceneService — lógica de scenes | RE-004 | pending |
| T-005 | VideoService — refactor con jerarquía y OpenCode | RE-003 | pending |
| T-006 | ProjectsRouter — CRUD projects | RE-006 | pending |
| T-007 | VideosRouter — nested bajo projects | RE-007 | pending |
| T-008 | ScenesRouter — operaciones individuales | RE-008 | pending |
| T-009 | EventsRouter — SSE endpoint | RE-009 | pending |
| T-010 | Wiring — montar routers en api/index.ts | RE-010 | pending |

## Orden de ejecución

```
T-001 (types)
    ↓
T-002 (ProjectService) ──┐
T-003 (EventService)  ───┤ (paralelos entre sí)
T-004 (SceneService)  ────┤
T-005 (VideoService)  ────┘
    ↓
T-006 (ProjectsRouter) ──┐
T-007 (VideosRouter)  ───┤ (paralelos)
T-008 (ScenesRouter)  ───┤
T-009 (EventsRouter)  ────┘
    ↓
T-010 (Wiring)
```

## Notas

- T-001 es prerrequisito de todos los services y routes
- T-002, T-003, T-004, T-005 son independientes entre sí y pueden hacerse en paralelo
- T-006, T-007, T-008, T-009 son independientes entre sí y pueden hacerse en paralelo
- T-010 es el último paso
