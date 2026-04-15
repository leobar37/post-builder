# Context — Projects → Videos → Scenes: Repository + Services + Routes

## Project Overview

Sistema de generación de Instagram Reels para GymSpace. El pipeline completo es:

```
Projects → Videos → Scenes → MiniMax clips → Remotion compose → MP4 final
```

## Arquitectura actual (lo que existe)

### Capa de datos ✅ (ya está)
- `api/db/schema.sql` — tablas `projects`, `videos`, `scenes`, `events` (actualizadas en conversacion previa)
- `api/db/client.ts` — `ProjectQueries`, `VideoQueries`, `SceneQueries`, `EventQueries` (ya actualizados)

### Capa de servicios ⚠️ (parcial)
- `VideoService` — existe pero flat, no sigue la jerarquia project → video → scene
- `MiniMaxService` — existe pero no está conectado a ninguna ruta
- `SceneGenerator` — existe internamente en VideoService
- No existen: `ProjectService`, `SceneService`, `EventService`

### Capa de rutas ⚠️ (incompleta)
- `/api/videos` — existe pero no está nested bajo projects
- `/api/projects` — **no existe**
- `/events` — **no existe** (SSE)
- `MiniMaxService` no está conectado a ninguna ruta

### Capa de tipos ❌ (no existe)
- No hay interfaces request/response para ningún endpoint

## Arquitectura objetivo

```
Routes → Services → Repositories (client.ts) → SQLite
```

Cada nivel solo conoce al de abajo:
- **Routes** — solo reciben HTTP, llaman al service correspondiente, devuelven JSON
- **Services** — lógica de negocio, no saben de HTTP ni de SQL
- **Repositories (client.ts)** — solo saben de SQLite, nada de negocio

## Entidades y relaciones

```
projects (1) ──────< (N) videos
videos (1) ─────────< (N) scenes
videos (1) ─────────< (N) events
```

- Un `project` tiene `context_id` que define carpeta `projects/{context_id}/`
- Un `video` tiene `idea_json` (JSON de escenas generadas por OpenCode)
- Una `scene` tiene `minimax_task_id` y `minimax_status` para tracking
- Un `event` es auditoría pura, no tiene relaciones propias

## Estado de cada entidad

### Project
```
draft → active / archived / deleted
```

### Video
```
draft → generating_idea → idea_ready → generating_clips → clips_ready → composing → completed
                                                        ↓
                                                   failed (desde cualquier estado menos completed)
```

### Scene
```
pending → queued → processing → success
                          ↓
                       fail / retrying
```

## Flujo de negocio

1. `POST /api/projects` → crea project + carpeta `projects/{context_id}/`
2. `POST /api/projects/:projectId/videos` → crea video + dispara OpenCode
3. OpenCode genera idea → se guarda en `videos.idea_json`
4. Se crean `scenes` en DB a partir de la idea
5. `POST /api/videos/:id/generate-all` → MiniMax genera clips
6. `POST /api/videos/:id/render` → Remotion compose
7. `GET /events/:videoId` → SSE con todo el progreso

## Verified Context

- `api/db/schema.sql` tiene las 4 tablas con campos completos según docs
- `api/db/client.ts` tiene los 4 query objects con métodos completos
- No hay SQL fuera de `client.ts`
- Services son planos (no hay composición project → video → scene)
- Routes llaman a `VideoQueries` directamente en algunos casos
- No hay interfaces request/response en los routes
- `MiniMaxService` existe pero no está conectado a ninguna ruta

## Tech stack

- Express + TypeScript
- better-sqlite3
- ACP/OpenCode SDK (@agentclientprotocol/sdk)
- Remotion CLI
- MiniMax Hailuo AI API
- SSE para eventos
