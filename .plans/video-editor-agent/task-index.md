# Task Index: Video Editor Agent

## Tasks Overview

| ID | Task | Status | Dependencies |
|----|------|--------|--------------|
| T-001 | Bootstrap Hono API | pending | - |
| T-002 | Agent Core Infrastructure | pending | T-001 |
| T-003 | VideoEditorAgent Implementation | pending | T-002 |
| T-004 | OpenCode Tool Integration | pending | T-003 |
| T-005 | Session Management System | pending | T-002 |
| T-006 | Agent API Routes (Hono) | pending | T-003, T-005 |
| T-007 | TanStack Query + Frontend Hook | pending | T-006 |
| T-008 | Frontend Chat UI | pending | T-007 |
| T-009 | Migration Strategy Express→Hono | pending | T-001, T-006 |
| T-010 | Testing & Validation | pending | T-004, T-008 |

## Execution Order

```
Phase 1: Foundation
├── T-001: Bootstrap Hono API
├── T-002: Agent Core Infrastructure
└── T-005: Session Management System

Phase 2: Agent Implementation
├── T-003: VideoEditorAgent Implementation
├── T-004: OpenCode Tool Integration
└── T-006: Agent API Routes (Hono)

Phase 3: Frontend
├── T-007: TanStack Query + Frontend Hook
└── T-008: Frontend Chat UI

Phase 4: Migration & Polish
├── T-009: Migration Strategy Express→Hono
└── T-010: Testing & Validation
```

## Task Details

### T-001: Bootstrap Hono API
**Scope:** Setup inicial de Hono como framework API
**Key Files:**
- `src/server/hono.ts` - Instancia de Hono
- `src/server/middleware/` - Middlewares base (CORS, logging, error handling)
- `src/server/index.ts` - Entry point del servidor

### T-002: Agent Core Infrastructure
**Scope:** Clases base y sistema de agentes genérico
**Key Files:**
- `src/agent/core/Agent.ts` - Clase base abstracta
- `src/agent/core/SessionManager.ts` - Gestión de sesiones
- `src/agent/core/types.ts` - Tipos fundamentales

### T-003: VideoEditorAgent Implementation
**Scope:** Implementación específica del agente de video
**Key Files:**
- `src/agent/video-editor/VideoEditorAgent.ts` - Agente concreto
- `src/agent/video-editor/prompts/system.ts` - System prompt
- `src/agent/video-editor/types.ts` - Tipos específicos

### T-004: OpenCode Tool Integration
**Scope:** Tool que invoca OpenCode vía ACP
**Key Files:**
- `src/agent/video-editor/tools/editSceneCode.ts` - Tool de edición
- `src/agent/video-editor/tools/index.ts` - Registro de tools
- Integración con `api/core/opencode/acp-client.ts`

### T-005: Session Management System
**Scope:** Persistencia de sesiones en SQLite
**Key Files:**
- `api/db/repositories/session.repository.ts` - CRUD de sesiones
- `api/db/schema.sql` - Tabla sessions (migración)
- `src/agent/core/Session.ts` - Modelo de sesión

### T-006: Agent API Routes (Hono)
**Scope:** Endpoints HTTP para el agente
**Key Files:**
- `src/server/routes/agent.ts` - Rutas `/api/agent/*`
- Stream handling con `streamText`
- Integración con Hono

### T-007: TanStack Query + AI SDK Frontend Hook
**Scope:** Hook de React usando `@ai-sdk/react` `useChat` + TanStack Query para cacheo
**Key Files:**
- `src/hooks/useAgentChat.ts` - Hook basado en `useChat` de AI SDK
- `src/lib/queryClient.ts` - Configuración de TanStack Query
- Integración AI SDK v4+ con streaming nativo

### T-008: Frontend Chat UI
**Scope:** Componentes UI para el chat
**Key Files:**
- `src/components/chat/AgentChat.tsx` - Componente principal
- `src/components/chat/MessageList.tsx` - Lista de mensajes
- `src/components/chat/InputBox.tsx` - Input con streaming

### T-009: Migration Strategy Express→Hono
**Scope:** Estrategia de migración gradual
**Key Files:**
- Documentación de migración
- Posible proxy/compatibility layer
- Actualización de scripts (`package.json`)

### T-010: Testing & Validation
**Scope:** Tests y validación del sistema
**Key Files:**
- `tests/agent/video-editor.test.ts` - Tests del agente
- `tests/api/agent.test.ts` - Tests de API
- Tests de integración end-to-end
