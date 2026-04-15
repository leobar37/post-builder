# Multi-Agent Scene Architecture Task Index

## Summary

- Mode: Structured
- Slug: `multi-agent-scene-architecture`
- Requirements File: `requirements.md`
- Checklist File: `checklist.json`

## Requirements Coverage

| Requirement | Covered By |
| --- | --- |
| `FR-001` | `tasks/01-create-agent-factory.md` |
| `FR-002` | `tasks/02-create-scene-agents.md` |
| `FR-003` | `tasks/02-create-scene-agents.md` |
| `FR-004` | `tasks/02-create-scene-agents.md` |
| `FR-005` | `tasks/02-create-scene-agents.md` |
| `FR-006` | `tasks/03-update-session-management.md` |
| `FR-007` | `tasks/03-update-session-management.md` |
| `FR-008` | `tasks/03-update-session-management.md` |
| `FR-009` | `tasks/02-create-scene-agents.md` |
| `FR-010` | `tasks/05-update-routes.md` |
| `FR-011` | `tasks/04-update-entities-schema.md` |
| `FR-012` | `tasks/04-update-entities-schema.md` |
| `NFR-001` | `tasks/04-update-entities-schema.md`, `tasks/05-update-routes.md` |

## Task List

| Task ID | File | Purpose | Dependencies |
| --- | --- | --- | --- |
| `T-001` | `tasks/01-create-agent-factory.md` | Create AgentFactory with agent registry | none |
| `T-002` | `tasks/02-create-scene-agents.md` | Create HookAgent, StatsAgent, CTAAgent, TransitionAgent | T-001 |
| `T-003` | `tasks/03-update-session-management.md` | Extend SessionManager with videoId queries | T-001 |
| `T-004` | `tasks/04-update-entities-schema.md` | Update Video/Scene types and DB schema | T-003 |
| `T-005` | `tasks/05-update-routes.md` | Update routes to use AgentFactory | T-001, T-002, T-003 |

## Suggested Execution Order

1. `T-001` - Foundation: AgentFactory sin agentes reales (stubs), permite continuar
2. `T-002` - Agentes especializados: depende de T-001 para registry
3. `T-003` - SessionManager: independiente de agentes, puede correr en paralelo con T-002
4. `T-004` - Entities/Schema: depende de T-003 para methods
5. `T-005` - Routes: integra todo, último

## Notes

- T-002 y T-003 pueden ejecutarse en paralelo (son independientes)
- T-004 depende de T-003 porque necesita los métodos de SessionManager
- T-005 es integration task, depende de todos los anteriores
