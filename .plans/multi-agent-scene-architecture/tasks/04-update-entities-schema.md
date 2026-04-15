# T-004 Update Entities and Schema

## Objective

Actualizar tipos de Video y Scene, limpiar campos legacy, adicionar columnas de agent session.

## Requirements Covered

- `FR-011` - Scene entity tiene `scene_type` y `agent_session_id`
- `FR-012` - Video entity limpia campos legacy (`opencode_session_id`, `opencode_status`)
- `NFR-001` - Backward compatible

## Dependencies

- T-003 (SessionManager actualizado antes de linked)

## Files or Areas Involved

- `api/types/index.ts` - **Modify** - Actualizar interfaces Video y Scene
- `api/db/schema.sql` - **Modify** - Agregar columnas, no remover legacy (migration)
- `api/db/repositories/video.repository.ts` - **Modify** - Remover select de campos legacy
- `api/db/repositories/scene.repository.ts` - **Modify** - Agregar scene_type, agent_session_id
- `api/db/migrations/006_add_scene_type_and_agent_session.sql` - **Create** - Migration SQL
- `api/routes/videos.ts` - **Read** - Ver cómo se usa Video entity
- `api/routes/scenes.ts` - **Read** - Ver cómo se usa Scene entity

## Actions

1. Types (`api/types/index.ts`):
   - Video: remover `opencode_session_id`, `opencode_status`
   - Video: agregar `active_scene_id: string | null`
   - Scene: agregar `scene_type: 'hook' | 'stats' | 'cta' | 'transition' | null`
   - Scene: agregar `agent_session_id: string | null`
2. Schema (`api/db/schema.sql`):
   - scenes: agregar `scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition'))`
   - scenes: agregar `agent_session_id TEXT REFERENCES agent_sessions(id)`
   - videos: agregar `active_scene_id TEXT` (para tracking)
3. Migration SQL (`api/db/migrations/006_add_scene_type_and_agent_session.sql`):
   - ALTER TABLE scenes ADD COLUMN scene_type TEXT
   - ALTER TABLE scenes ADD COLUMN agent_session_id TEXT
   - ALTER TABLE videos ADD COLUMN active_scene_id TEXT
   - UPDATE scenes SET scene_type = 'hook' WHERE sequence = 1
   - UPDATE scenes SET scene_type = 'cta' WHERE sequence = (SELECT MAX(sequence) FROM scenes)
4. Repositories:
   - video.repository.ts: dejar de retornar opencode_session_id, opencode_status
   - scene.repository.ts: agregar scene_type y agent_session_id en get/update

## Completion Criteria

- API de Video no retorna campos legacy
- API de Scene incluye scene_type
- Migration corre sin errores en SQLite

## Validation

- pnpm tsc --noEmit no tiene errores de tipos
- API responses match new interfaces

## Risks or Notes

- No DROP columnas legacy (mantener en schema por si acaso rollback)
- Migration debe ser idempotent
