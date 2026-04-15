# Multi-Agent Scene Architecture Requirements

## Objective

Separar el VideoEditorAgent en múltiples agentes especializados por tipo de escena, manteniendo sesiones independientes y un output estándar unificado.

## Scope

- In scope: Agent system refactor, SessionManager, routes de agent, tipos, schema
- Out of scope: Frontend, MiniMax service, Project service, otros domains

## Functional Requirements

- `FR-001` - AgentFactory crea el agente correcto según sceneType de la sesión
- `FR-002` - HookAgent tiene system prompt especializado para escenas de apertura
- `FR-003` - StatsAgent tiene system prompt especializado para escenas de datos
- `FR-004` - CTAAgent tiene system prompt especializado para escenas de CTA
- `FR-005` - TransitionAgent tiene system prompt especializado para transiciones
- `FR-006` - SessionManager soporta crear/obtener sesiones por sceneId y por videoId
- `FR-007` - Session ID format: `{videoId}_{sceneId}`
- `FR-008` - Cada escena tiene su propia sesión de agente (1:1)
- `FR-009` - Tool `editSceneCode` disponible en todos los agentes
- `FR-010` - Routes usan AgentFactory para seleccionar agente por session.sceneType
- `FR-011` - Scene entity tiene `scene_type` y `agent_session_id`
- `FR-012` - Video entity limpia campos legacy (`opencode_session_id`, `opencode_status`)

## Non-Functional Requirements

- `NFR-001` - Backward compatible: existing sessions继续 trabajando
- `NFR-002` - Session recovery: si existe sesión para scene, reutilizarla

## Acceptance Criteria

- AgentFactory.createAgent('hook') devuelve HookAgent instance
- AgentFactory.createAgent('stats') devuelve StatsAgent instance
- POST /api/agent/chat con session de hook usa HookAgent
- GET /api/agent/sessions?videoId=X devuelve todas las sesiones del video
- Scene.type existe en schema y API
- Video.opencode_session_id removido de API response

## Constraints

- No modificar contratos de API existentes excepto limpieza de legacy fields
- Mantener compatibilidad con sesiones existentes en DB

## Open Questions

- ¿Las tools específicas por agente difieren significativamente o son mayormente compartidas?
- ¿Se necesita migrar datos existentes de `opencode_session_id` a nuevas sesiones?
