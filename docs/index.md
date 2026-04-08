# Video Pipeline System - Documentation Index

## Quick Navigation

### Getting Started
| Document | Description |
|----------|-------------|
| [README](./README.md) | Overview del sistema |
| [Architecture Overview](./architecture/overview.md) | Arquitectura general |

### Architecture
| Document | Description |
|----------|-------------|
| [Overview](./architecture/overview.md) | Componentes y data flow |
| [Projects](./architecture/projects.md) | Organización por proyectos con contextId |
| [Context Convention](./architecture/context-convention.md) | Convención de carpetas projects/{contextId}/ |
| [Unified Agent UI](./architecture/unified-agent-ui.md) | Estrategia de agente unificado (panel persistente) |
| [State Machine](./architecture/state-machine.md) | Estados del pipeline |
| [Hierarchical Context](./architecture/hierarchical-context.md) | Contexto en 3 niveles (Project→Video→Scene) |
| [Error Handling](./architecture/error-handling.md) | Estrategia de errores |

### Integrations
| Document | Description |
|----------|-------------|
| [OpenCode](./integrations/opencode.md) | ACP integration |
| [OpenCode Advanced](./integrations/opencode-advanced.md) | Control de modelos y parámetros |
| [Session Manager](./integrations/session-manager.md) | Gestión robusta de sesiones ACP |
| [MiniMax](./integrations/minimax.md) | Video generation API |
| [MiniMax Advanced](./integrations/minimax-advanced.md) | Control granular de generaciones |
| [Remotion](./integrations/remotion.md) | Video composition |
| [Remotion Code Generation](./integrations/remotion-code-generation.md) | Edición interactiva con agente |

### Reference
| Document | Description |
|----------|-------------|
| [API Endpoints](./reference/api-endpoints.md) | REST + SSE reference |
| [ACP SDK](./reference/acp-sdk-reference.md) | SDK documentation |
| [Database Schema](./database/schema.md) | SQLite schema |
| [Configuration](./configuration/schema.md) | config.yaml schema |

### Code Snippets
| Document | Description |
|----------|-------------|
| [OpenCode Bridge](./code-snippets/opencode-bridge.md) | Reusable code |
| [Remotion Hot Reload](./code-snippets/remotion-hot-reload.md) | Patrones de recarga del player |

### Data Models
| Document | Description |
|----------|-------------|
| [Models](./models/README.md) | TypeScript interfaces |

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [x] Database setup (SQLite)
- [x] Config system (YAML)
- [x] Express API skeleton
- [x] **Projects system** (contextId convention)
- [x] **Context Convention** (projects/{contextId}/)
- [x] **Session Manager** (robust session metadata & health)
- [x] OpenCode Bridge (ACP)
- [x] **Hierarchical Context** (Project→Video→Scene)

### Phase 2: Video Pipeline
- [x] MiniMax service
- [x] MiniMax Advanced Control (cancel, regenerate, pause/resume)
- [x] Scene generation
- [x] Clip management
- [x] Status tracking

### Phase 3: Frontend
- [x] React app setup
- [x] useOpenCode hook
- [x] Video list view
- [x] Preview player
- [x] **Remotion Hot Reload** (live editing)
- [x] **Unified Agent Panel** (persistent right sidebar)

### Phase 4: Composition
- [x] Remotion setup
- [x] VideoComposition
- [x] **Agent Code Generation** (interactive editing)
- [x] Render endpoint
- [x] Export flow

### Advanced Features
- [x] **Model Selection** (Claude Opus/Sonnet/Haiku per task)
- [x] **OpenCode via ACP** (with auth & model access)
- [x] **Context-Aware Prompts** (merged context for OpenCode)

## Key Decisions

| Decision | Status | Document |
|----------|--------|----------|
| ACP over CLI | ✅ Decided | [OpenCode](./integrations/opencode.md) |
| SSE over WebSocket | ✅ Decided | [Architecture](./architecture/overview.md) |
| SQLite over Postgres | ✅ Decided | [Architecture](./architecture/overview.md) |
| Filesystem storage | ✅ Decided | [Architecture](./architecture/overview.md) |
| **Projects with contextId** | ✅ Documented | [Projects](./architecture/projects.md) |
| **Context Convention** | ✅ Documented | [Context Convention](./architecture/context-convention.md) |
| **Unified Agent UI** | ✅ Documented | [Unified Agent UI](./architecture/unified-agent-ui.md) |
| Hierarchical Context | ✅ Documented | [Hierarchical Context](./architecture/hierarchical-context.md) |
| Agent Code Generation | ✅ Documented | [Remotion Code Generation](./integrations/remotion-code-generation.md) |
| Model Selection per Task | ✅ Documented | [OpenCode Advanced](./integrations/opencode-advanced.md) |
| MiniMax Advanced Control | ✅ Documented | [MiniMax Advanced](./integrations/minimax-advanced.md) |
| Session Manager | ✅ Documented | [Session Manager](./integrations/session-manager.md) |
