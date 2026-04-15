# T-003 Update SessionManager

## Objective

Extender SessionManager para soportar queries por videoId y session ID format estandarizado.

## Requirements Covered

- `FR-006` - SessionManager soporta crear/obtener sesiones por sceneId y por videoId
- `FR-007` - Session ID format: `{videoId}_{sceneId}`
- `FR-008` - Cada escena tiene su propia sesión de agente (1:1)

## Dependencies

- T-001 (SessionManager se actualiza después de AgentFactory)

## Files or Areas Involved

- `api/agent/core/SessionManager.ts` - **Modify** - Agregar métodos por videoId
- `api/db/repositories/session.repository.ts` - **Modify** - Agregar getByVideo, getActiveSession
- `api/agent/core/types.ts` - **Read** - SessionMetadata type

## Actions

1. Actualizar SessionRepository:
   - Agregar método `getByVideo(videoId): AgentSession[]`
   - OAgregar método `getActiveSession(videoId): AgentSession | null`
   - Verificar que `create()` genera sessionId como `{videoId}_{sceneId}`
2. Actualizar SessionManager:
   - Agregar método `getSessionsByVideo(videoId): Promise<AgentSession[]>`
   - Agregar método `getOrCreateSession({ videoId, sceneId, sceneType, projectId })`
   - Este método retorna sesión existente si ya existe para esa sceneId

## Completion Criteria

- SessionManager.getSessionsByVideo("video_123") retorna todas las sesiones del video
- SessionManager.getOrCreateSession() reutiliza sesión existente si existe
- Session IDs siguen formato `{videoId}_{sceneId}`

## Validation

- Verificar con queries directas a SQLite que los métodos funcionan
- Probar getOrCreateSession: mismo sceneId no crea sesión duplicada

## Risks or Notes

- Mantener backward compatibility con sesiones existentes (sin formato en ID)
