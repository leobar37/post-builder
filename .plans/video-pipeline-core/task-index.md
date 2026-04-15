# Video Pipeline Core - Task Index

## Summary

- Mode: Structured
- Slug: `video-pipeline-core`
- Requirements File: `requirements.md`
- Checklist File: `checklist.json`

## Requirements Coverage

| Requirement | Covered By |
| --- | --- |
| `FR-001` | `tasks/01-core-infrastructure.md` |
| `FR-002` | `tasks/01-core-infrastructure.md` |
| `FR-003` | `tasks/01-core-infrastructure.md` |
| `FR-004` | `tasks/03-opencode-sdk.md` |
| `FR-005` | `tasks/04-session-manager.md` |
| `FR-006` | `tasks/04-session-manager.md` |
| `FR-007` | `tasks/04-session-manager.md` |
| `FR-008` | `tasks/05-event-bus.md` |
| `FR-009` | `tasks/05-event-bus.md` |
| `FR-010` | `tasks/03-opencode-sdk.md` |
| `FR-011` | `tasks/06-ffmpeg-wrapper.md` |
| `FR-012` | `tasks/01-core-infrastructure.md` |
| `FR-013` | `tasks/02-utilities.md` |
| `FR-014` | `tasks/07-scene-planning.md` |
| `FR-015` | `tasks/08-folder-structure.md` |

## Task List

| Task ID | File | Purpose | Dependencies |
| --- | --- | --- | --- |
| `T-001` | `tasks/01-core-infrastructure.md` | Config, logger, errors, validation base | none |
| `T-002` | `tasks/02-utilities.md` | Utilidades reutilizables (files, paths, validation) | `T-001` |
| `T-003` | `tasks/03-opencode-sdk.md` | SDK OpenCode con soporte ACP | `T-001`, `T-002` |
| `T-004` | `tasks/04-session-manager.md` | Gestión de sesiones con health checks | `T-003` |
| `T-005` | `tasks/05-event-bus.md` | Event Bus pub/sub y estructura de eventos | `T-001` |
| `T-006` | `tasks/06-ffmpeg-wrapper.md` | Wrapper FFmpeg para operaciones de video | `T-002` |
| `T-007` | `tasks/07-scene-planning.md` | Base para planificación de escenas | `T-005` |
| `T-008` | `tasks/08-folder-structure.md` | Estructura de carpetas del proyecto | none |

## Suggested Execution Order

1. `T-008` - Establecer estructura de carpetas primero (foundation)
2. `T-001` - Core infrastructure (config, logger, errors)
3. `T-002` - Utilidades reutilizables
4. `T-003` - OpenCode SDK (depende de core)
5. `T-004` - Session Manager (depende de SDK)
6. `T-005` - Event Bus (independiente, puede ir en paralelo)
7. `T-006` - FFmpeg wrapper (depende de utilidades)
8. `T-007` - Scene planning base (depende de Event Bus)

## Notes

- El Event Bus (`T-005`) puede desarrollarse en paralelo con `T-003` y `T-004`
- FFmpeg wrapper es independiente del flujo OpenCode
- Scene planning usa Event Bus para comunicación entre componentes
- La estructura de carpetas (`T-008`) debe hacerse primero para tener dónde colocar los archivos
