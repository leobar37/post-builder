# Requirements: Video Editor Agent

## Functional Requirements

### FR-001: VideoEditorAgent Core
El sistema debe implementar un agente IA (`VideoEditorAgent`) que:
- Procese mensajes del usuario via AI SDK `streamText`
- Mantenga estado de sesión (historial de mensajes)
- Soporte tool calling para acciones específicas
- Retorne streams de texto para UI en tiempo real

### FR-002: Session Management (Scene = Session)
Cada escena es una sesión del agente:
- `POST /api/agent/sessions` - Crear sesión para una escena
- `GET /api/agent/sessions/:id` - Obtener estado de sesión
- Sessions persisten en SQLite con historial completo
- Una escena puede tener múltiples sesiones (historial de intentos)

### FR-003: Tool System
El agente debe exponer tools que puedan invocarse:
- `editSceneCode` - Invoca OpenCode ACP para generar/editar código Remotion
- `updateSceneConfig` - Actualiza configuración de escena en DB
- `generateVideo` - Inicia generación de video vía MiniMax u otro servicio
- Las tools retornan resultados que el agente incorpora a su respuesta

### FR-004: OpenCode Integration via Tool
OpenCode se integra como una tool, no como backend directo:
- Tool `editSceneCode` recibe descripción y contexto
- Internamente llama a `AcpClient` (existente en `api/core/opencode/`)
- Retorna código generado al agente para presentar al usuario

### FR-005: API Migration Express → Hono
Migrar el servidor API de Express a Hono:
- Mantener rutas existentes durante migración
- Nueva ruta `/api/agent/*` implementada en Hono
- Hono corre en paralelo o reemplaza Express gradualmente

### FR-006: Frontend con TanStack Query + AI SDK
Implementar frontend usando `@ai-sdk/react` + TanStack Query:
- Hook `useAgentChat` basado en `useChat` de `@ai-sdk/react`
- Manejo de estado server (sessions, mensajes) vía TanStack Query
- Cache y refetch de historiales
- UI en tiempo real con streaming nativo del AI SDK

### FR-006A: Soporte Multimodal
El sistema debe soportar inputs multimodales en las conversaciones:
- Imágenes de referencia adjuntas a mensajes
- Videos o clips como contexto
- Tipo `UserContent` del AI SDK (string o array de parts)

### FR-007: Extensibilidad (Skills Strategy)
La arquitectura debe permitir extensión vía skills:
- Base `Agent` class genérica en `src/agent/core/`
- System prompt componible (módulos de contexto)
- Registro de tools dinámico
- Soporte para múltiples agentes especializados

## Non-Functional Requirements

### NFR-001: TypeScript Strict
- TypeScript en modo estricto (`strict: true`)
- Tipos definidos para todas las interfaces públicas
- No uso de `any` sin justificación

### NFR-002: Streaming Performance
- Respuesta inicial del stream < 500ms
- Tool calls no bloquean el stream (async)
- Buffering eficiente para SSE

### NFR-003: Session Persistence
- Sessions persisten inmediatamente en SQLite
- Recuperación de sesiones posible tras restart
- TTL opcional para sesiones antiguas

### NFR-004: Error Handling
- Errores de tools no crashean el agente
- Mensajes de error presentados al usuario vía stream
- Retry automático para fallos transitorios

### NFR-005: Configuración
- Modelo LLM configurable via env var (`AI_MODEL`, `AI_API_KEY`)
- Temperatura y parámetros ajustables
- Feature flags para tools (habilitar/deshabilitar)

## Acceptance Criteria

- [ ] Usuario puede crear sesión para una escena existente
- [ ] Usuario envía mensaje y recibe stream de respuesta
- [ ] Agente invoca tool `editSceneCode` cuando necesita código
- [ ] Código generado aparece en panel de preview
- [ ] Historial de conversación persiste y es recuperable
- [ ] Múltiples sesiones por escena son posibles
- [ ] Tests unitarios para VideoEditorAgent
- [ ] Tests de integración para flujo completo

## Out of Scope

- Autenticación/Autorización (se asume auth existente)
- UI de administración de agentes
- Analytics/Metrics de uso
- Multi-tenant (un tenant por ahora)
- WebSockets (usamos SSE via AI SDK)
