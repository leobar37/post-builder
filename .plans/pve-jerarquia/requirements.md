# Requirements — Projects → Videos → Scenes: Repository + Services + Routes

## Sobre este documento

Esto es el **qué**, no el cómo. Los archivos en `tasks/` son implementación. Este documento define qué tiene que existir y por qué.

---

## RE-001 — Tipos centralizados

**Qué:** Interfaces TypeScript para request y response de cada endpoint, en `api/types/`.

**Por qué:** Hoy los routes usan `req.body` sin tipar y retornan objetos inline. Necesitamos contratos fijos para que el frontend sepa qué mandar y qué esperar.

**Interfaces requeridas:**
- `CreateProjectRequest`, `UpdateProjectRequest`, `ProjectResponse`, `ProjectListResponse`
- `CreateVideoRequest`, `VideoResponse`, `VideoListResponse`, `VideoWithScenesResponse`
- `SceneResponse`, `SceneListResponse`
- `EventResponse`
- `ApiErrorResponse`

---

## RE-002 — ProjectService

**Qué:** Service con toda la lógica de negocio de projects.

**Por qué:** Separar la creación de projects + carpeta de las rutas HTTP.

**Operaciones:**
- `create(data)` — valida context_id único, crea en DB, crea carpeta `projects/{context_id}/`
- `getById(id)` — devuelve project
- `getAll(status?)` — lista con video count
- `update(id, data)` — actualiza campos permitidos
- `delete(id)` — soft delete

**No hace:** No sabe de HTTP, no sabe de videos.

---

## RE-003 — VideoService (refactor)

**Qué:** Refactorizar el VideoService existente para seguir la jerarquía.

**Por qué:** El VideoService actual crea videos desde `postsData` hardcodeado. Necesita crear videos desde un `project_id` y un `prompt` de usuario, disparando OpenCode.

**Operaciones:**
- `createFromProject(projectId, prompt)` — crea video en DB (status: generating_idea), invoca OpenCode, cuando OpenCode responde crea scenes, guarda idea_json, actualiza a idea_ready
- `getById(id)` — video con scenes
- `getByProjectId(projectId)` — videos del proyecto
- `getAll(status?)` — todos los videos
- `approveIdea(videoId)` — pasa de idea_ready a generating_clips
- `startRender(videoId)` — pasa a composing, invoca Remotion
- `buildFinal(videoId)` — concatena scenes con ffmpeg
- `getOutputPath(videoId)` — path del archivo final

**No hace:** No sabe de HTTP, no maneja archivos más allá de paths.

---

## RE-004 — SceneService

**Qué:** Service para operaciones de scene individuales.

**Por qué:** Las scenes pueden regenerarse, cancelarse, pausarse individualmente. Esto debe estar separado de VideoService.

**Operaciones:**
- `getById(id)` — una scene
- `getByVideoId(videoId)` — scenes de un video
- `generateScene(sceneId)` — dispara MiniMax para una scene
- `cancelScene(sceneId)` — cancela generación en curso
- `retryScene(sceneId)` — reintenta con el mismo prompt
- `updateScene(id, data)` — actualiza campos de una scene

---

## RE-005 — EventService + SSE

**Qué:** Service para emitir eventos + endpoint SSE.

**Por qué:** El frontend necesita escuchar progreso en tiempo real. El event bus existe en `api/core/events/bus.ts` pero no está conectado a ninguna ruta.

**Operaciones:**
- `emit(videoId, event)` — publica en el event bus
- `subscribe(videoId)` — returns event emitter para un videoId
- `logEvent(event)` — persiste en tabla events

**Endpoint:**
- `GET /events/:videoId` — SSE stream de eventos del video

---

## RE-006 — ProjectsRouter

**Qué:** Express router en `api/routes/projects.ts`.

**Por qué:** CRUD de projects según docs.

**Endpoints:**
| Método | Path | Service |
|--------|------|---------|
| POST | /api/projects | ProjectService.create |
| GET | /api/projects | ProjectService.getAll |
| GET | /api/projects/:id | ProjectService.getById |
| PATCH | /api/projects/:id | ProjectService.update |
| DELETE | /api/projects/:id | ProjectService.delete |

---

## RE-007 — VideosRouter (nested under projects)

**Qué:** Express router en `api/routes/videos.ts` (actualizado).

**Por qué:** Videos están anidados bajo projects. Se agregan los endpoints nuevos.

**Endpoints:**
| Método | Path | Service |
|--------|------|---------|
| POST | /api/projects/:projectId/videos | VideoService.createFromProject |
| GET | /api/projects/:projectId/videos | VideoService.getByProjectId |
| GET | /api/videos | VideoService.getAll |
| GET | /api/videos/:id | VideoService.getById |
| GET | /api/videos/:id/status | VideoService.getById con escenas |
| POST | /api/videos/:id/approve | VideoService.approveIdea |
| POST | /api/videos/:id/render | VideoService.startRender |
| GET | /api/videos/:id/download | Serve file |
| DELETE | /api/videos/:id | VideoService.delete |

---

## RE-008 — ScenesRouter

**Qué:** Express router en `api/routes/scenes.ts` (nuevo).

**Por qué:** Operaciones de scene individual.

**Endpoints:**
| Método | Path | Service |
|--------|------|---------|
| GET | /api/scenes/:id | SceneService.getById |
| POST | /api/scenes/:id/generate | SceneService.generateScene |
| POST | /api/scenes/:id/cancel | SceneService.cancelScene |
| POST | /api/scenes/:id/retry | SceneService.retryScene |

---

## RE-009 — EventsRouter + SSE

**Qué:** Express router en `api/routes/events.ts` (nuevo).

**Por qué:** Endpoint SSE para que el frontend se subscribe a progreso.

**Endpoints:**
| Método | Path | Service |
|--------|------|---------|
| GET | /events/:videoId | EventService.subscribe (SSE) |

---

## RE-010 — Wiring en api/index.ts

**Qué:** Montar los routers y verificar que todo compile.

**Por qué:** Los routers existen pero no están montados.

```ts
import projectsRoutes from './routes/projects';
import videosRoutes from './routes/videos';
import scenesRoutes from './routes/scenes';
import eventsRoutes from './routes/events';

app.use('/api/projects', projectsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/scenes', scenesRoutes);
app.use('/events', eventsRoutes);
```

---

## RE-011 — Migración de datos (opcional, postergable)

**Qué:** Script para importar los 17 posts hardcodeados de `posts-data.ts` como projects + videos.

**Por qué:** Hoy los posts viven en `postsData` (hardcoded). Podrían migrarse a la DB para que el pipeline completo funcione con ellos.

**Nota:** Postergable a una segunda fase.

---

## Dependencias entre requirements

```
RE-001 (types)  ──────► RE-002, RE-003, RE-004, RE-005
RE-002 (ProjectService) ──► RE-006
RE-003 (VideoService) ───► RE-007
RE-004 (SceneService) ───► RE-008
RE-005 (EventService) ───► RE-009
RE-006 + RE-007 + RE-008 + RE-009 ──► RE-010
```

---

## Non-scope

- Frontend React (no existe aún)
- Sistema de auth/permisos
- Migración de posts-data.ts (RE-011 postergable)
- OpenCode ACP session management avanzado (por ahora simple)
- MiniMax advanced control (cancel, pause, seed por escena)
